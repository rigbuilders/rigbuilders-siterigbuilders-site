import { NextRequest, NextResponse } from "next/server";
import { getTelegramConfig } from "@/lib/chatbot/config";
import { findTelegramLink, replyInTelegram } from "@/lib/chatbot/telegram";
import { resolveReplyTarget, sendAgentReply } from "@/lib/chatbot/agent-reply";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/webhook/telegram — a team member replied to a customer alert.
 *
 * The flow this completes: customer messages -> we post it to Telegram ->
 * someone replies to that Telegram message (from the notification shade, on
 * their phone, without opening anything) -> this relays it back out on
 * whatever channel the customer actually used.
 *
 * Replying to the right notification IS how the conversation gets selected —
 * there's no list to pick from, which is what makes it fast enough to use
 * one-handed.
 *
 * SECURITY: this endpoint can send messages to customers, so it is gated
 * twice. First on Telegram's own secret header, which proves the call came
 * from Telegram. Second on the chat id, so that even a valid Telegram call
 * from some other chat — someone who found the bot and messaged it directly —
 * can't relay anything to a customer.
 *
 * Always returns 200. A non-200 makes Telegram retry the same update for
 * hours, which for a send-to-customer endpoint would mean duplicate replies.
 */

interface TelegramUpdate {
  message?: {
    message_id: number;
    chat?: { id: number | string };
    from?: { first_name?: string; username?: string };
    text?: string;
    reply_to_message?: { message_id: number };
  };
}

const ok = () => NextResponse.json({ ok: true }, { status: 200 });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const config = getTelegramConfig();
  if (!config) return ok();

  // Telegram sends this header on every call when the webhook was registered
  // with a secret_token. Without the check the URL alone is enough to message
  // your customers.
  if (config.webhookSecret) {
    const supplied = req.headers.get("x-telegram-bot-api-secret-token");
    if (supplied !== config.webhookSecret) {
      console.error("[webhook:telegram] rejected: bad or missing secret token");
      return ok();
    }
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  if (!message?.text) return ok();

  // Only the configured chat can relay. A valid Telegram call from anywhere
  // else is someone who found the bot, not a team member.
  if (String(message.chat?.id ?? "") !== String(config.chatId)) {
    console.error(`[webhook:telegram] ignored message from unexpected chat ${message.chat?.id}`);
    return ok();
  }

  const repliedTo = message.reply_to_message?.message_id;
  if (!repliedTo) {
    await replyInTelegram(
      message.message_id,
      "To answer a customer, reply directly to their message above rather than sending a new one — that's how I know who it's for."
    );
    return ok();
  }

  const link = await findTelegramLink(config.chatId, repliedTo);
  if (!link) {
    await replyInTelegram(
      message.message_id,
      "I couldn't match that to a conversation. It may predate this setup — open the inbox to reply."
    );
    return ok();
  }

  const target = await resolveReplyTarget(link.conversationId);
  if (!target) {
    await replyInTelegram(message.message_id, "That conversation no longer exists.");
    return ok();
  }

  const result = await sendAgentReply(target, message.text);

  // Confirm either way. Silence after sending a reply is indistinguishable
  // from a reply that vanished, and on a channel being used one-handed from a
  // notification that ambiguity is expensive.
  await replyInTelegram(
    message.message_id,
    result.ok
      ? `Sent to the customer on ${link.channel}. The bot is paused on this conversation.`
      : `Could not send: ${result.error ?? "unknown error"}`
  );

  return ok();
}

/** GET is just a liveness check — useful when verifying the webhook is reachable. */
export async function GET(): Promise<NextResponse> {
  const configured = Boolean(getTelegramConfig());
  return NextResponse.json({ ok: true, configured });
}
