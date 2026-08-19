import {
  appendMessage,
  findOrCreateActiveConversation,
  findOrCreateUser,
  getRecentHistory,
  updateConversationStatus,
} from "./conversation-store";
import { isExcluded } from "./exclusions";
import { getProductKnowledge } from "./product-knowledge";
import { SYSTEM_PROMPT } from "./system-prompt";
import { generateReply } from "./llm/router";
import { stripFormatting } from "./text-sanitizer";
import { isHandoffRequest, HANDOFF_ACK_MESSAGE } from "./handoff";
import { notifyAdminOfHandoff, notifyWatchedNumberMessage } from "./admin-alerts";
import { getWatched } from "./watchlist";
import type { NormalizedMessage } from "./types";

/**
 * Channel-agnostic core loop. Every adapter (WhatsApp, Instagram, Messenger,
 * and eventually the website widget) funnels into this single function with
 * nothing but a NormalizedMessage — it never sees a raw platform payload.
 *
 * Returns the reply text to send back, or `null` if the bot should stay
 * silent — either because this number is on the exclusions list, or because
 * a human has taken over this specific conversation (status: handed_off).
 * In both cases the inbound message is still recorded, so it shows up in the
 * admin inbox for a human to answer.
 */
export async function handleMessage(msg: NormalizedMessage): Promise<string | null> {
  const user = await findOrCreateUser(msg.channel, msg.externalUserId);
  const conversation = await findOrCreateActiveConversation(user.id, msg.channel);

  // Persist the inbound message before deciding anything else, so it's
  // never lost and always visible in the admin inbox.
  await appendMessage(conversation.id, "user", msg.text);

  // Fires regardless of bot/exclusion/handoff status below — if a watched
  // number messages at all, the admin wants to know, independent of whether
  // the bot goes on to reply normally.
  const watched = await getWatched(msg.channel, msg.externalUserId);
  if (watched) {
    await notifyWatchedNumberMessage({
      channel: msg.channel,
      externalUserId: msg.externalUserId,
      label: watched.label,
      message: msg.text,
    });
  }

  if (conversation.status === "handed_off") {
    return null; // a human is already handling this conversation
  }

  if (await isExcluded(msg.channel, msg.externalUserId)) {
    return null; // this number is permanently opted out of auto-replies
  }

  // Customer explicitly asked for a human — pause the bot on this
  // conversation right now, before spending an LLM call, and let them know
  // someone's coming rather than leaving them mid-bot-reply when a human
  // eventually does check the inbox. Distinct from the admin manually
  // pausing a conversation from /admin/chatbot (conversation-store.ts) —
  // this is the customer-triggered path.
  if (isHandoffRequest(msg.text)) {
    await updateConversationStatus(conversation.id, "handed_off");
    await appendMessage(conversation.id, "assistant", HANDOFF_ACK_MESSAGE, "handoff");
    await notifyAdminOfHandoff({
      channel: msg.channel,
      externalUserId: msg.externalUserId,
      message: msg.text,
    });
    return HANDOFF_ACK_MESSAGE;
  }

  const history = await getRecentHistory(conversation.id);

  // Look up matching products and fold them into the system prompt for this
  // one call only — keeps the base prompt small and the data always fresh.
  const productContext = await getProductKnowledge(msg.text);
  const systemPrompt = productContext ? `${SYSTEM_PROMPT}\n\n${productContext}` : SYSTEM_PROMPT;

  try {
    const { text: rawText, provider } = await generateReply(systemPrompt, history, msg.text);
    // Same backstop as the website widget (see text-sanitizer.ts): the model
    // ignores the system prompt's no-markdown/no-emoji rule often enough that
    // this needs to be enforced server-side, not just requested in the
    // prompt. WhatsApp only ever renders single-asterisk *bold*, so a
    // double-asterisk **bold** from the model would show up as literal
    // asterisks to the customer without this.
    const text = stripFormatting(rawText);
    await appendMessage(conversation.id, "assistant", text, provider);
    return text;
  } catch (err) {
    // Both providers failed. Graceful degradation instead of going silent
    // (full retry/backoff + human-flagging is Phase 4; this is the seam for it).
    const fallback =
      "Sorry, I'm having trouble getting you an answer right now. A member of the Rig Builders team will follow up with you shortly.";
    await appendMessage(conversation.id, "assistant", fallback, "none");
    console.error(`[chatbot:orchestrator] LLM router failed entirely: ${(err as Error).message}`);
    return fallback;
  }
}
