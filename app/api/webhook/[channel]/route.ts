import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import type { ChannelAdapter } from "@/lib/chatbot/types";
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

async function processInbound(adapter: ChannelAdapter, rawPayload: unknown): Promise<void> {
  const message = await adapter.parseIncoming(rawPayload);
  if (!message) return; // status update, echo, unsupported type, etc. — nothing to reply to

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
      await adapter.sendReply(message.externalUserId, reply.text, reply.meta);
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

  after(() => processInbound(adapter, rawPayload));

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
