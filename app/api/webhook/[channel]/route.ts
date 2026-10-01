import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import type { ChannelAdapter, NormalizedMessage } from "@/lib/chatbot/types";
import { whatsappAdapter } from "@/lib/chatbot/adapters/whatsapp";
import { messengerAdapter } from "@/lib/chatbot/adapters/messenger";
import { instagramAdapter } from "@/lib/chatbot/adapters/instagram";
import { handleMessage } from "@/lib/chatbot/orchestrator";

// Webhook payloads must never be cached or statically rendered.
export const dynamic = "force-dynamic";

// The actual pipeline (mark-as-read + typing indicator, the LLM call, DB
// writes, then the WhatsApp/Messenger/Instagram send) now runs via after()
// AFTER the HTTP response goes back to Meta — but that background work is
// still bound by this function's own execution limit, which defaults to a
// short value (10s on Vercel's Hobby plan) if not set explicitly. That
// default is too short for this pipeline's combined latency and would get
// the function killed mid-reply with no error surfaced anywhere. 60s is the
// max allowed on Hobby and comfortably covers what we've measured (Gemini
// calls have run 5-9s; raise this if a heavier LLM/provider ever needs more).
export const maxDuration = 60;

/**
 * One route handles all three Meta channels — /api/webhook/whatsapp,
 * /api/webhook/messenger, /api/webhook/instagram — dispatching to the
 * matching adapter. Adding a fourth Meta-style channel later = one new
 * adapter file + one entry in this map, no new route needed.
 */
const ADAPTERS: Record<string, ChannelAdapter> = {
  whatsapp: whatsappAdapter,
  messenger: messengerAdapter,
  instagram: instagramAdapter,
};

/**
 * Meta batches: a single webhook POST can carry several entries, several
 * changes per entry, and several messages per change — routinely so when more
 * than one customer writes in at the same moment. Every adapter's
 * parseIncoming only ever looks at the FIRST message in the payload, so
 * everything after it used to be silently dropped: with 4 customers messaging
 * at once, 3 of them got no reply and no inbox row, with nothing logged to
 * say why.
 *
 * Rather than change all three adapters (and the ChannelAdapter contract) to
 * return arrays, this fans a batched payload out into N single-message
 * payloads of exactly the shape each adapter already expects, so each one
 * flows through the normal path untouched. A payload with only one message in
 * it comes back out as a single-element list, i.e. unchanged behaviour.
 */
function splitBatchedPayload(channel: string, rawPayload: unknown): unknown[] {
  const payload = rawPayload as {
    object?: string;
    entry?: { changes?: { field?: string; value?: Record<string, unknown> }[]; messaging?: unknown[] }[];
  };
  if (!payload?.entry?.length) return [rawPayload];

  const out: unknown[] = [];

  // One output payload per (entry, change, message) tuple — note this splits
  // on multiple *entries* too, not just multiple messages inside one entry.
  // Several customers writing at the same time most often arrives as several
  // entries with one message each, and since every adapter reads entry[0]
  // only, that case dropped everyone but the first customer.
  for (const entry of payload.entry) {
    if (channel === "whatsapp") {
      for (const change of entry.changes ?? []) {
        const messages = change.value?.messages as unknown[] | undefined;
        if (!Array.isArray(messages) || messages.length === 0) continue;
        for (const message of messages) {
          out.push({
            ...payload,
            entry: [{ ...entry, changes: [{ ...change, value: { ...change.value, messages: [message] } }] }],
          });
        }
      }
    } else {
      // Messenger + Instagram share the Messenger Platform shape: one
      // `messaging` array per entry, one event each.
      const messaging = entry.messaging;
      if (!Array.isArray(messaging) || messaging.length === 0) continue;
      for (const event of messaging) {
        out.push({ ...payload, entry: [{ ...entry, messaging: [event] }] });
      }
    }
  }

  // No actual messages in this payload (a delivery-status or read-receipt
  // callback, say) — hand back the original so the adapter's own "nothing to
  // reply to" path runs exactly as before.
  return out.length > 0 ? out : [rawPayload];
}

async function processInbound(adapter: ChannelAdapter, rawPayload: unknown): Promise<void> {
  // parseIncoming does network work now (resolving + re-hosting inbound
  // media), so it can genuinely throw. This runs inside after(), where an
  // unhandled rejection is invisible — catch it here or a media hiccup
  // silently swallows the customer's whole message.
  let message: NormalizedMessage | null;
  try {
    message = await adapter.parseIncoming(rawPayload);
  } catch (err) {
    console.error(`[webhook:${adapter.channelId}] parseIncoming threw: ${(err as Error).message}`);
    return;
  }
  if (!message) return; // status update, echo, unsupported type, etc. — nothing to reply to

  // Deliberate "we got this far" marker. When the complaint is "the bot
  // isn't replying at all", the single most important thing to know is
  // whether Meta is even delivering webhooks to us — if this line is absent
  // from the logs the problem is upstream (webhook subscription, app mode,
  // token), and nothing in this codebase can fix it.
  console.log(
    `[webhook:${adapter.channelId}] inbound from ${message.externalUserId}: ${JSON.stringify(message.text).slice(0, 200)}`
  );

  if (adapter.markAsRead && message.messageId) {
    try {
      await adapter.markAsRead(message.messageId);
    } catch (err) {
      // Cosmetic (blue ticks) — never worth losing the reply over.
      console.error(`[webhook:${adapter.channelId}] markAsRead failed: ${(err as Error).message}`);
    }
  }

  try {
    const reply = await handleMessage(message);
    // null means: excluded number, or a human already has this conversation
    // handed off — stay silent, the message is already saved for the admin inbox.
    if (reply) {
      // Meta rejects an empty/whitespace-only message body outright (and for
      // an interactive cta_url message it's a hard 400), so an LLM that
      // returned nothing usable would turn into a send error and total
      // silence. Substitute the same wording the orchestrator uses when both
      // providers fail, so the customer always gets *something* back.
      const outgoing = reply.text?.trim()
        ? reply.text
        : "Sorry, I'm having trouble getting you an answer right now. A member of the Rig Builders team will follow up with you shortly.";
      if (!reply.text?.trim()) {
        console.error(`[webhook:${adapter.channelId}] empty reply text for ${message.externalUserId} — sent fallback instead`);
      }
      await adapter.sendReply(message.externalUserId, outgoing, reply.meta);
      // Paired with the inbound marker above: inbound logged + this missing
      // = the failure is ours (LLM/DB/send error, and the catch below names
      // it). Both present = we handed the reply to Meta successfully, so a
      // customer still not seeing it is a Meta-side delivery problem, which
      // the delivery-status logging in POST() below will show.
      console.log(`[webhook:${adapter.channelId}] reply sent to ${message.externalUserId}`);
      // Set only by the quotation flow right now (orchestrator.ts) — the
      // generated PDF, sent the same way admin-sent media already is.
      if (reply.media && adapter.sendMedia) {
        try {
          await adapter.sendMedia(message.externalUserId, reply.media.url, reply.media.type, reply.media.caption);
        } catch (err) {
          console.error(
            `[webhook:${adapter.channelId}] sendMedia failed for ${message.externalUserId}: ${(err as Error).message}`
          );
        }
      }
    }
  } catch (err) {
    console.error(
      `[webhook:${adapter.channelId}] failed to handle message from ${message.externalUserId}: ${(err as Error).message}`
    );
  }
}

/**
 * GET /api/webhook/:channel — Meta's one-time verification handshake.
 * Meta calls this with hub.mode=subscribe, hub.verify_token, hub.challenge
 * when you save the webhook URL in the App Dashboard. All three channels
 * share the same META_VERIFY_TOKEN.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
): Promise<NextResponse> {
  const { channel } = await params;
  if (!ADAPTERS[channel]) {
    return NextResponse.json({ error: `Unknown channel: ${channel}` }, { status: 404 });
  }

  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const verifyToken = process.env.META_VERIFY_TOKEN;

  if (verifyToken && mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST /api/webhook/:channel — actual event notifications.
 *
 * Responds to Meta immediately, then runs the actual pipeline (LLM call +
 * Supabase writes + Graph API reply) via `after()` once the response is
 * already sent. This used to be reversed — awaiting the whole pipeline
 * before responding — on the assumption that Gemini/Together typically
 * reply in a couple of seconds, safely inside Meta's webhook timeout. That
 * assumption broke once the pipeline grew a mark-as-read+typing-indicator
 * call and a template-message Graph API call on top of the LLM call: the
 * combined latency started exceeding Meta's timeout, so Meta considered the
 * webhook delivery failed and *retried* it — re-running this whole handler
 * for the exact same inbound message, which is what produced duplicate/
 * triplicate replies to a single customer message. `after()` (stable since
 * Next.js 15) keeps the serverless function alive long enough to finish the
 * background work without holding up the HTTP response Meta is timing.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
): Promise<NextResponse> {
  const { channel } = await params;
  const adapter = ADAPTERS[channel];
  if (!adapter) {
    return NextResponse.json({ error: `Unknown channel: ${channel}` }, { status: 404 });
  }

  const rawPayload = await req.json().catch(() => null);

  // WhatsApp sends delivery-status updates (sent/delivered/read/failed) as
  // their own separate webhook calls with no `messages` array — parseIncoming
  // returns null for these and processInbound just no-ops, which normally
  // means "read receipt for something we sent, nothing to do." But it also
  // means an *async* delivery failure (e.g. Meta accepted a media send with
  // 200 then couldn't actually fetch the image URL) would otherwise vanish
  // completely — logged here so a failed status is visible instead of silent.
  if (channel === "whatsapp") {
    const statuses = (rawPayload as any)?.entry?.[0]?.changes?.[0]?.value?.statuses;
    if (Array.isArray(statuses)) {
      for (const status of statuses) {
        if (status?.status === "failed") {
          console.error(`[webhook:whatsapp] delivery status FAILED: ${JSON.stringify(status)}`);
        } else {
          console.log(`[webhook:whatsapp] delivery status: ${status?.status} for message ${status?.id}`);
        }
      }
    }
  }

  // Sequential, not Promise.all: two messages from the same customer in one
  // batch would otherwise race findOrCreateUser/findOrCreateActiveConversation
  // and create duplicate rows for the same person.
  after(async () => {
    for (const single of splitBatchedPayload(channel, rawPayload)) {
      await processInbound(adapter, single);
    }
  });

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
