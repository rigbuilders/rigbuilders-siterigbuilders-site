import {
  appendMessage,
  findOrCreateActiveConversation,
  findOrCreateUser,
  getRecentHistory,
} from "./conversation-store";
import { isExcluded } from "./exclusions";
import { SYSTEM_PROMPT } from "./system-prompt";
import { generateReply } from "./llm/router";
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

  if (conversation.status === "handed_off") {
    return null; // a human is already handling this conversation
  }

  if (await isExcluded(msg.channel, msg.externalUserId)) {
    return null; // this number is permanently opted out of auto-replies
  }

  const history = await getRecentHistory(conversation.id);

  try {
    const { text, provider } = await generateReply(SYSTEM_PROMPT, history, msg.text);
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
