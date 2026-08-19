/**
 * Customer-triggered handoff detection — separate from the existing
 * "handed_off" status change an admin makes manually from /admin/chatbot
 * (see conversation-store.ts / the reply route). This catches a customer
 * asking for a human mid-conversation, before the LLM ever sees the message,
 * so the bot doesn't try to answer past that point.
 *
 * Deliberately loose (bare "human"/"agent" included) rather than requiring a
 * full phrase match — a false positive just means a person answers a message
 * the bot could've handled, which is the safe direction to err for a support
 * bot. Word-boundary matched so this doesn't fire on, say, "humanoid" or
 * unrelated substrings.
 */
const HANDOFF_PATTERNS: RegExp[] = [
  /\bhuman\b/i,
  /\bagent\b/i,
  /\breal person\b/i,
  /\brepresentative\b/i,
  /\bcustomer (service|support|care)\b/i,
  /\btalk to (a |an |)?(person|someone|somebody)\b/i,
  /\bspeak (to|with) (a |an |)?(person|someone|somebody)\b/i,
  /\bconnect me (to|with)\b/i,
  /\bescalate\b/i,
  /\bmanager\b/i,
  /\bcomplaint\b/i,
];

export function isHandoffRequest(text: string): boolean {
  return HANDOFF_PATTERNS.some((p) => p.test(text));
}

/**
 * Sent back to the customer immediately when a handoff triggers, instead of
 * an LLM reply — same wording used by website-stream.ts for the equivalent
 * "already handed off" case, so the voice is consistent across channels.
 */
export const HANDOFF_ACK_MESSAGE =
  "Sure thing — connecting you with a member of the Rig Builders team now. They'll reply to you right here shortly.";

// Re-exported for backward compatibility — the actual email-sending logic
// now lives in admin-alerts.ts, shared with watchlist.ts's notification.
export { notifyAdminOfHandoff } from "./admin-alerts";
