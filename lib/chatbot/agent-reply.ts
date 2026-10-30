import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { appendMessage, updateConversationStatus } from "./conversation-store";
import { whatsappAdapter } from "./adapters/whatsapp";
import { messengerAdapter } from "./adapters/messenger";
import { instagramAdapter } from "./adapters/instagram";
import type { ChannelAdapter, MediaType } from "./types";

/**
 * One human reply, dispatched to whichever channel the customer is on.
 *
 * Extracted from the admin inbox's reply route so Telegram can reuse it —
 * two code paths that both mean "a person is answering" must not drift on the
 * details that matter: recording it as provider "human" so it's visually
 * distinct from an LLM reply, and flipping the conversation to handed_off so
 * the bot doesn't talk over the person who just stepped in.
 */

const ADAPTERS: Record<string, ChannelAdapter> = {
  whatsapp: whatsappAdapter,
  messenger: messengerAdapter,
  instagram: instagramAdapter,
};

export interface AgentReplyTarget {
  conversationId: string;
  channel: string;
  externalUserId: string;
}

export interface AgentReplyResult {
  ok: boolean;
  error?: string;
}

/** Resolves a conversation to the channel + customer id needed to reply to it. */
export async function resolveReplyTarget(conversationId: string): Promise<AgentReplyTarget | null> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_conversations")
    .select("id, channel, chatbot_users ( channel_identities )")
    .eq("id", conversationId)
    .maybeSingle<{
      id: string;
      channel: string;
      chatbot_users: { channel_identities: Record<string, string> } | null;
    }>();

  if (error || !data) {
    if (error) console.error(`[chatbot:agent-reply] target lookup failed: ${error.message}`);
    return null;
  }

  const externalUserId = data.chatbot_users?.channel_identities?.[data.channel];
  if (!externalUserId) return null;

  return { conversationId: data.id, channel: data.channel, externalUserId };
}

export async function sendAgentReply(target: AgentReplyTarget, text: string): Promise<AgentReplyResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Empty message" };

  try {
    // The website channel has no push API to send through — there's no
    // persistent connection to a browser tab the way there is a phone number
    // or page id for the Meta channels. The widget polls
    // /api/chatbot/website/thread and picks this up like any other message.
    if (target.channel !== "website") {
      const adapter = ADAPTERS[target.channel];
      if (!adapter) return { ok: false, error: `Unknown channel: ${target.channel}` };
      await adapter.sendReply(target.externalUserId, trimmed);
    }

    await appendMessage(target.conversationId, "assistant", trimmed, "human");
    await updateConversationStatus(target.conversationId, "handed_off");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Same as sendAgentReply but for an image or document the agent sent. */
export async function sendAgentMedia(
  target: AgentReplyTarget,
  mediaUrl: string,
  mediaType: MediaType,
  caption?: string
): Promise<AgentReplyResult> {
  try {
    if (target.channel !== "website") {
      const adapter = ADAPTERS[target.channel];
      if (!adapter?.sendMedia) return { ok: false, error: `Channel cannot send media: ${target.channel}` };
      await adapter.sendMedia(target.externalUserId, mediaUrl, mediaType, caption);
    }

    await appendMessage(target.conversationId, "assistant", caption ?? "", "human", {
      url: mediaUrl,
      type: mediaType,
    });
    await updateConversationStatus(target.conversationId, "handed_off");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
