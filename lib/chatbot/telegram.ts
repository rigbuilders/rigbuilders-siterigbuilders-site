import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTelegramConfig } from "./config";

/**
 * Telegram as the ops console.
 *
 * Every inbound customer message is posted here, and the team replies using
 * Telegram's native reply — which on Android works straight from the
 * notification shade, so answering a customer takes one thumb and no app
 * switch. That's the entire point: the previous workflow (notification ->
 * open Chrome -> sign in -> find the conversation) was slow enough that
 * customers were being missed.
 *
 * The link row written on every send is what makes the reply resolvable
 * later — see security/telegram_links.sql and the webhook route.
 *
 * Nothing here throws. An alerting failure must never break the reply
 * pipeline it's alerting about, same rule as push-notify.ts.
 */

const API_BASE = "https://api.telegram.org/bot";
const SEND_TIMEOUT_MS = 8000;

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  messenger: "Messenger",
  instagram: "Instagram",
  website: "Website",
};

interface TelegramSendResult {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
}

async function callTelegram(
  method: string,
  payload: Record<string, unknown>
): Promise<TelegramSendResult | null> {
  const config = getTelegramConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${API_BASE}${config.botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    const data = (await res.json().catch(() => null)) as TelegramSendResult | null;
    if (!data?.ok) {
      console.error(`[chatbot:telegram] ${method} failed: ${data?.description ?? res.status}`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[chatbot:telegram] ${method} threw: ${(err as Error).message}`);
    return null;
  }
}

/** Telegram's HTML parse mode is strict — unescaped angle brackets reject the send. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const SITE_URL = "https://www.rigbuilders.in";

const CHANNEL_ROUTE: Record<string, string> = {
  whatsapp: "whatsapp",
  messenger: "facebook",
  instagram: "instagram",
  website: "website",
};

/**
 * Posts one inbound customer message and records the mapping so a reply to it
 * reaches the right person.
 */
export async function notifyTelegramOfMessage(params: {
  channel: string;
  externalUserId: string;
  text: string;
  conversationId: string;
  mediaUrl?: string | null;
}): Promise<void> {
  const config = getTelegramConfig();
  if (!config) return;

  const label = CHANNEL_LABEL[params.channel] ?? params.channel;
  const inboxUrl = `${SITE_URL}/admin/chatbot/${CHANNEL_ROUTE[params.channel] ?? ""}`;
  const body = params.text?.trim() || "(no text)";

  // Reply instructions are included deliberately: the whole mechanism depends
  // on using Telegram's reply rather than typing a new message, and that isn't
  // obvious to someone who has just been pinged.
  const message =
    `<b>${escapeHtml(label)}</b> — <code>${escapeHtml(params.externalUserId)}</code>\n\n` +
    `${escapeHtml(body)}\n\n` +
    `<i>Reply to this message to answer the customer.</i>` +
    (params.mediaUrl ? `\n<a href="${escapeHtml(params.mediaUrl)}">View attachment</a>` : "") +
    `\n<a href="${escapeHtml(inboxUrl)}">Open inbox</a>`;

  const sent = await callTelegram("sendMessage", {
    chat_id: config.chatId,
    text: message,
    parse_mode: "HTML",
    // Previews on the inbox link would push the message text off-screen in the
    // notification, which defeats the point of reading it at a glance.
    disable_web_page_preview: true,
  });

  const messageId = sent?.result?.message_id;
  if (!messageId) return;

  try {
    await supabaseAdmin.from("telegram_message_links").insert({
      telegram_chat_id: String(config.chatId),
      telegram_message_id: messageId,
      conversation_id: params.conversationId,
      channel: params.channel,
      external_user_id: params.externalUserId,
    });
  } catch (err) {
    // The alert still arrived — only the reply path is lost, and the team can
    // fall back to the inbox link in the message itself.
    console.error(`[chatbot:telegram] link insert failed: ${(err as Error).message}`);
  }
}

/**
 * A customer needs a person — they asked for an expert or a call, it's
 * urgent, it's a complaint, or the assistant couldn't resolve it.
 *
 * Deliberately a SEPARATE, visually distinct message rather than a flag on the
 * normal alert: in a busy chat the ordinary notifications become wallpaper,
 * and the whole reason this exists is that customers were being told someone
 * would call them and then nobody did. This is the one that has to be noticed.
 *
 * Still carries the link row, so it can be replied to like any other alert.
 */
export async function notifyTelegramEscalation(params: {
  channel: string;
  externalUserId: string;
  text: string;
  conversationId: string;
  reason: string;
}): Promise<void> {
  const config = getTelegramConfig();
  if (!config) return;

  const label = CHANNEL_LABEL[params.channel] ?? params.channel;
  const inboxUrl = `${SITE_URL}/admin/chatbot/${CHANNEL_ROUTE[params.channel] ?? ""}`;

  // The customer's own number is the contact detail on WhatsApp — surfacing
  // it here means nobody has to go and look it up, and the bot never has to
  // ask the customer for a number it was already given.
  const contactLine =
    params.channel === "whatsapp"
      ? `\n<b>Call back on:</b> <code>${escapeHtml(params.externalUserId)}</code>`
      : "";

  const message =
    `‼️ <b>NEEDS A PERSON</b> — ${escapeHtml(label)}\n` +
    `<b>Why:</b> ${escapeHtml(params.reason)}${contactLine}\n\n` +
    `${escapeHtml(params.text?.trim() || "(no text)")}\n\n` +
    `<i>Reply to this message to answer them directly.</i>\n` +
    `<a href="${escapeHtml(inboxUrl)}">Open inbox</a>`;

  const sent = await callTelegram("sendMessage", {
    chat_id: config.chatId,
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    // Overrides a muted chat. Normal alerts respect mute; this one shouldn't,
    // because a missed escalation is a lost customer.
    disable_notification: false,
  });

  const messageId = sent?.result?.message_id;
  if (!messageId) return;

  try {
    await supabaseAdmin.from("telegram_message_links").insert({
      telegram_chat_id: String(config.chatId),
      telegram_message_id: messageId,
      conversation_id: params.conversationId,
      channel: params.channel,
      external_user_id: params.externalUserId,
    });
  } catch (err) {
    console.error(`[chatbot:telegram] escalation link insert failed: ${(err as Error).message}`);
  }
}

/** Plain confirmation back into the Telegram thread (delivery receipts, errors). */
export async function replyInTelegram(replyToMessageId: number, text: string): Promise<void> {
  const config = getTelegramConfig();
  if (!config) return;

  await callTelegram("sendMessage", {
    chat_id: config.chatId,
    text,
    reply_to_message_id: replyToMessageId,
    disable_web_page_preview: true,
  });
}

export interface TelegramLink {
  conversationId: string;
  channel: string;
  externalUserId: string;
}

/** Resolves a replied-to Telegram message back to its conversation. */
export async function findTelegramLink(
  chatId: string | number,
  messageId: number
): Promise<TelegramLink | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("telegram_message_links")
      .select("conversation_id, channel, external_user_id")
      .eq("telegram_chat_id", String(chatId))
      .eq("telegram_message_id", messageId)
      .maybeSingle<{ conversation_id: string; channel: string; external_user_id: string }>();

    if (error || !data) return null;
    return {
      conversationId: data.conversation_id,
      channel: data.channel,
      externalUserId: data.external_user_id,
    };
  } catch (err) {
    console.error(`[chatbot:telegram] link lookup failed: ${(err as Error).message}`);
    return null;
  }
}
