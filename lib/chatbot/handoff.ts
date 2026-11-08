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

  // Added after reviewing real transcripts. Every one of these was said by a
  // customer and NOT caught, so the bot carried on conversationally — in one
  // case asking for a phone number four times, in another promising to
  // "forward your details to a specialist" when nothing was forwarded
  // anywhere. Asking for an expert or a call is a request for a person, and
  // treating it as anything else makes the bot dishonest.
  /\bexpert\b/i,
  /\bspecialist\b/i,
  /\btechnician\b/i,
  /\bengineer\b/i,
  /\b(call|ring|phone) (me|us|back)\b/i,
  /\bcallback\b/i,
  /\bcall back\b/i,
  /\bconnect (on|over|via) (a |the |)?call\b/i,
  /\b(can|could|shall) we (connect|talk|speak)\b/i,
  /\bon (a |the )?call\b/i,
  /\byour number\b/i,
  /\bcontact number\b/i,
  /\bwhatsapp number\b/i,
  /\burgent(ly)?\b/i,
  /\bemergency\b/i,
  /\basap\b/i,
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

/**
 * Used when the assistant escalated because it couldn't confirm something —
 * most often a product that isn't in the catalogue.
 *
 * Worded differently from HANDOFF_ACK_MESSAGE on purpose. "Connecting you
 * with someone" answers a request the customer made; this answers a question
 * they asked, and saying we'll check tells them what's actually happening.
 * The alternative — which the assistant used to do — was to invent a plausible
 * product rather than admit it didn't know.
 */
export const CONFIRM_ACK_MESSAGE =
  "Let me check that with the team and confirm — someone will come back to you right here shortly with the details.";

// Re-exported for backward compatibility — the actual email-sending logic
// now lives in admin-alerts.ts, shared with watchlist.ts's notification.
export { notifyAdminOfHandoff } from "./admin-alerts";
