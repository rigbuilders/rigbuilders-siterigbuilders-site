/**
 * Decides when the guided menu should take over from the assistant.
 *
 * The menu is a FALLBACK, not the front door: someone who opens with "do you
 * have a 7800X3D" should get an answer, not a tree to tap through. It appears
 * only when there's nothing to answer, or when answering failed.
 *
 * Three tiers, ordered by cost — the first two run before any LLM call and are
 * free, the third costs the call we were going to make anyway:
 *
 *   1. No intent      "hi", "hello", a lone emoji. Nothing was asked, so
 *                     there's nothing to answer and no reason to pay a model
 *                     to discover that.
 *   2. Unreadable     Messages we already know we couldn't read, because WE
 *                     generated the placeholder text for them (stickers,
 *                     reactions, locations, WhatsApp's "unsupported" type).
 *                     These used to be sent to the model, which cost money
 *                     and produced a confused reply about inventory.
 *   3. Model gave up  The model is instructed to emit a sentinel when a
 *                     message is too vague or outside its scope (see
 *                     system-prompt.ts). Checking for an exact token beats
 *                     pattern-matching its hedging phrases, which would mean
 *                     chasing wording forever.
 *
 * Shared by both channels on purpose — WhatsApp and the website must never
 * disagree about what counts as "didn't understand".
 */

/** The model emits exactly this when it can't help. See SYSTEM_PROMPT. */
export const NEEDS_MENU_TOKEN = "NEEDS_MENU";

// Greetings and openers that carry no question. Matched on the whole message
// (after stripping punctuation), never as a substring — "hi, do you have
// 32gb ram" is a real question that happens to start with a greeting.
const NO_INTENT = new Set([
  "hi", "hii", "hiii", "hey", "heyy", "hello", "helo", "hlo", "yo",
  "namaste", "namaskar", "hola", "hai",
  "good morning", "good afternoon", "good evening", "gm", "ge",
  "hi there", "hello there", "hey there",
  "menu", "start", "help", "options", "test", "ok", "okay", "k",
  "?", "??", "???", "...",
]);

/**
 * Placeholder text the adapters produce for content we couldn't read. These
 * are our own strings, so matching them is exact rather than heuristic — see
 * adapters/whatsapp.ts, messenger.ts, instagram.ts.
 *
 * Deliberately NOT included: "[Customer sent an image]" and "[Customer sent a
 * file: ...]" when the download succeeded. Those are real messages with real
 * content attached, and belong with a human, not a menu.
 */
const UNREADABLE_MARKERS = [
  "sent a sticker",
  "reacted",
  "removed a reaction",
  "shared a location",
  "shared a contact",
  "message type whatsapp doesn't deliver",
  "unsupported whatsapp message type",
  "made an interactive selection",
];

export type MenuTriggerReason = "no-intent" | "unreadable" | "model-gave-up";

/** Normalises for comparison: lowercase, trimmed, trailing punctuation removed. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[!.,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strips emoji so a message that is ONLY emoji normalises to empty. */
function withoutEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, "").trim();
}

/**
 * Tier 1 + 2, both free. Returns null when the message should go to the
 * assistant as normal.
 */
export function preLlmMenuTrigger(text: string): MenuTriggerReason | null {
  const raw = text ?? "";
  const normalised = normalise(raw);

  if (!normalised || !withoutEmoji(normalised)) return "no-intent";
  if (NO_INTENT.has(normalised)) return "no-intent";

  // A bracketed placeholder is always one of ours — real customer text very
  // rarely arrives wrapped in square brackets.
  if (normalised.startsWith("[") && normalised.endsWith("]")) {
    if (UNREADABLE_MARKERS.some((marker) => normalised.includes(marker))) return "unreadable";
  }

  return null;
}

/** Tier 3. True when the model signalled it couldn't help. */
export function modelGaveUp(reply: string): boolean {
  return reply.trim().toUpperCase().startsWith(NEEDS_MENU_TOKEN);
}

/** The line shown above the menu, worded for why it appeared. */
export function menuIntro(reason: MenuTriggerReason, isFirstContact: boolean): string {
  if (reason === "unreadable") {
    return "Sorry, I couldn't read that one. Could you pick an option below, or send it as a photo or plain text?";
  }
  if (reason === "model-gave-up") {
    return "I'm not sure I followed that. Maybe one of these is what you need?";
  }
  return isFirstContact
    ? "Hi! Welcome to Rig Builders. What can I help you with today?"
    : "Sure — what would you like to do?";
}
