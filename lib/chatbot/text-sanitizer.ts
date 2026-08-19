/**
 * Defensive backstop for the "no markdown, no emoji" hard rule in
 * system-prompt.ts. Found via eval testing (scripts/chatbot-eval): even with
 * that rule spelled out explicitly, ornith:9b (and to a lesser extent other
 * models) still emits **bold**, # headings, - bullets, 1. numbered lists, and
 * occasional emoji in roughly a quarter of replies. Since the widget renders
 * replies as plain text with no markdown rendering step, any of that leaking
 * through shows up as literal asterisks/hashes to the customer — exactly the
 * "**Hi**" bug this project already fixed once, just re-introduced by model
 * behavior rather than a prompt-writing mistake. Rather than only relying on
 * the model "behaving," strip it server-side no matter which model produced
 * it, so this doesn't regress again with a future model swap.
 *
 * The regexes here intentionally mirror scripts/chatbot-eval/analyze-results.mjs's
 * MD_BOLD/MD_HEADING/MD_BULLET/MD_NUMBERED/EMOJI checks — if a reply passes
 * through this sanitizer, the eval's formatting check should no longer flag it.
 */

const HEADING_PREFIX = /^\s{0,3}#{1,6}\s+/;
const BULLET_PREFIX = /^\s{0,3}[-*•]\s+/;
const NUMBERED_PREFIX = /^\s{0,3}\d+\.\s+/;
const BOLD = /\*\*([^*]+)\*\*/g;
const UNDERSCORE_BOLD = /__([^_]+)__/g;
const ITALIC_STAR = /\*([^*\n]+)\*/g;
const STRIKETHROUGH = /~~([^~]+)~~/g;
const INLINE_CODE = /`([^`]+)`/g;
// Same range as analyze-results.mjs's EMOJI check, plus the variation
// selector that often trails an emoji codepoint (present in the character
// but invisible, so worth stripping alongside it).
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu;

/** Sanitizes a single line: strips a leading heading/bullet/numbered-list
 * marker, then any inline bold/italic/strikethrough/code markers and emoji
 * anywhere in the line. Safe to call on plain prose — every pattern only
 * matches actual markdown syntax, so text with no markdown in it passes
 * through unchanged. */
export function stripFormattingLine(line: string): string {
  let s = line.replace(HEADING_PREFIX, "").replace(BULLET_PREFIX, "").replace(NUMBERED_PREFIX, "");
  s = s.replace(BOLD, "$1").replace(UNDERSCORE_BOLD, "$1").replace(STRIKETHROUGH, "$1").replace(INLINE_CODE, "$1");
  // Single-asterisk italics last, after ** is already gone, so a leftover
  // stray "*" from a malformed bold pair isn't misread as italic markers.
  s = s.replace(ITALIC_STAR, "$1");
  s = s.replace(EMOJI, "");
  return s;
}

/** Whole-string version — splits on newlines, sanitizes each line, rejoins.
 * Used for the copy that gets persisted to Supabase (full text is available
 * all at once there, unlike the live stream). */
export function stripFormatting(text: string): string {
  return text.split("\n").map(stripFormattingLine).join("\n");
}

/**
 * Streaming version. Both LLM providers (ollama.ts, together.ts) emit plain
 * UTF-8 text deltas — not the JSON-line product header, that's added
 * separately by withProductsHeader() after this transform runs. Buffers up
 * to the last complete line so markdown pairs (e.g. "**word**") that a model
 * might emit as separate token chunks are never split mid-pattern; only a
 * genuinely unterminated trailing line (still being generated) stays
 * buffered, and gets flushed sanitized as-is when the stream ends.
 */
export function createSanitizingTransform(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // last (possibly incomplete) line stays buffered
      for (const line of lines) {
        controller.enqueue(encoder.encode(stripFormattingLine(line) + "\n"));
      }
    },
    flush(controller) {
      buffer += decoder.decode();
      if (buffer) {
        controller.enqueue(encoder.encode(stripFormattingLine(buffer)));
      }
    },
  });
}
