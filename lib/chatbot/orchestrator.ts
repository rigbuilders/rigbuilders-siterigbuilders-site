import {
  appendMessage,
  findOrCreateActiveConversation,
  findOrCreateUser,
  getRecentHistory,
} from "./conversation-store";
import { SYSTEM_PROMPT } from "./system-prompt";
import { generateReply } from "./llm/router";
import type { NormalizedMessage } from "./types";

/**
 * Channel-agnostic core loop. Every adapter (WhatsApp, Instagram, Messenger,
 * and eventually the website widget) funnels into this single function with
 * nothing but a NormalizedMessage — it never sees a raw platform payload.
 */
export async function handleMessage(msg: NormalizedMessage): Promise<string> {
  const user = await findOrCreateUser(msg.channel, msg.externalUserId);
  const conversation = await findOrCreateActiveConversation(user.id, msg.channel);

  const history = await getRecentHistory(conversation.id);

  // Persist the inbound message before calling the LLM so it's never lost
  // even if the LLM call fails.
  await appendMessage(conversation.id, "user", msg.text);

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
