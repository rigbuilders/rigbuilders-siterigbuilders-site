import { appendMessage, claimHandoff } from "./conversation-store";
import { classifyMessage, type Classification } from "./categorizer";
import { notifyTelegramCategorised } from "./telegram";

/**
 * Runs the categoriser and applies whatever that category says to do.
 *
 * Channel-agnostic on purpose: email, WhatsApp, the website widget and
 * Messenger/Instagram all call this, so a donation request is handled
 * identically whichever door it arrives through. Adding a channel later
 * means calling this function — there's nothing per-channel to duplicate.
 *
 * Returns:
 *   { handled: true, reply }  send that reply and stop
 *   { handled: true }         send nothing and stop (spam)
 *   { handled: false }        carry on to the normal conversational flow
 *
 * Never throws. A classifier failure must fall through to the assistant,
 * not swallow the customer's message.
 */

export interface CategoryOutcome {
  handled: boolean;
  reply?: string;
  classification?: Classification;
}

export async function applyCategory(params: {
  text: string;
  channel: string;
  externalUserId: string;
  conversationId: string;
}): Promise<CategoryOutcome> {
  let classification: Classification | null = null;

  try {
    classification = await classifyMessage(params.text);
  } catch (err) {
    console.error(`[chatbot:category-actions] classify threw: ${(err as Error).message}`);
  }

  if (!classification) return { handled: false };

  const { category, summary } = classification;
  console.log(`[chatbot:category] ${params.channel} ${params.externalUserId} -> ${category.key}`);

  if (category.shouldAlert) {
    await notifyTelegramCategorised({
      heading: category.heading,
      summary,
      channel: params.channel,
      externalUserId: params.externalUserId,
      conversationId: params.conversationId,
    });
  }

  // Spam: recorded so you can audit what's being filtered, but nothing is
  // sent. Auto-replying to cold outreach looks unprofessional and costs money.
  if (category.isSilent) {
    console.log(`[chatbot:category] silent category "${category.key}" — no reply sent`);
    return { handled: true, classification };
  }

  if (category.shouldHandoff) {
    // claimHandoff rather than a plain status write, so two messages arriving
    // together don't both send the acknowledgement.
    const claimed = await claimHandoff(params.conversationId);
    if (!claimed) return { handled: true, classification };
  }

  // No template means this category has real logic behind it — quotation,
  // support, order status — and a canned line would be worse than the answer
  // the normal flow produces. Fall through.
  if (!category.replyTemplate) return { handled: false, classification };

  await appendMessage(params.conversationId, "assistant", category.replyTemplate, `category:${category.key}`);
  return { handled: true, reply: category.replyTemplate, classification };
}
