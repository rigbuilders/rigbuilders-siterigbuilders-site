import { NextRequest, NextResponse } from "next/server";
import type { ChannelAdapter } from "@/lib/chatbot/types";
import { whatsappAdapter } from "@/lib/chatbot/adapters/whatsapp";
import { messengerAdapter } from "@/lib/chatbot/adapters/messenger";
import { instagramAdapter } from "@/lib/chatbot/adapters/instagram";
import { handleMessage } from "@/lib/chatbot/orchestrator";

// Webhook payloads must never be cached or statically rendered.
export const dynamic = "force-dynamic";

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
  const message = adapter.parseIncoming(rawPayload);
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
 * Unlike the standalone Express version of this backend, we *await* the full
 * pipeline (LLM call + Supabase writes + Graph API reply) before responding.
 * On Vercel, a serverless function can be frozen the instant it returns a
 * response — a fire-and-forget call kicked off but not awaited is not
 * guaranteed to finish (that requires `after()`/`waitUntil`, which adds
 * complexity for no real benefit here since Gemini/Together typically
 * respond in a couple of seconds, well inside Meta's webhook timeout).
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

  await processInbound(adapter, rawPayload);

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
