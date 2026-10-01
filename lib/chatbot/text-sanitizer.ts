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

// ---- Reasoning-model chain-of-thought stripping ----
//
// Reasoning models (gpt-oss, Qwen3, DeepSeek-R1 and friends) can emit their
// internal thinking in the same `content` field as the actual reply. Well-
// behaved endpoints put it on a separate `reasoning`/`reasoning_content`
// field instead — which llm/providers/openai-compatible.ts simply never reads
// — but plenty of aggregators pass it through inline, and a customer seeing
// "Okay, the user is asking about Ryzen 7. Let me check the product list..."
// before the answer is worse than any markdown leak this file was originally
// written for. Belt and braces, exactly like the markdown stripping: don't
// rely on the model or the vendor behaving.

const THINK_BLOCK = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;
const UNCLOSED_THINK = /<(think|thinking|reasoning)>[\s\S]*$/i;
// gpt-oss's "harmony" response format, if an endpoint forwards the raw
// channel markers: the deliverable answer is the final channel's message.
const HARMONY_FINAL = /<\|channel\|>final<\|message\|>/i;
const HARMONY_TOKEN = /<\|[^|]*\|>/g;

/**
 * Removes a reasoning model's chain of thought from a reply, leaving only the
 * answer intended for the customer. Safe on text that contains no reasoning
 * at all — every pattern matches explicit markers, so ordinary prose passes
 * through untouched.
 */
export function stripReasoning(text: string): string {
  let s = text;

  // Harmony channels first: when the final-channel marker is present
  // everything before it is preamble/analysis by definition.
  if (HARMONY_FINAL.test(s)) {
    const parts = s.split(HARMONY_FINAL);
    s = parts[parts.length - 1];
  }
  s = s.replace(HARMONY_TOKEN, "");

  s = s.replace(THINK_BLOCK, "");
  // An opening tag with no closing one means generation was cut off
  // mid-thought (hit max_tokens, say) — there's no answer after it to keep.
  s = s.replace(UNCLOSED_THINK, "");

  return s.trim();
}

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

  // Reasoning suppression has to be stateful across lines here, unlike
  // stripReasoning()'s whole-string version: a <think> block routinely spans
  // many lines, and on this path the customer is watching the reply appear
  // live — so a line of chain-of-thought that slips through is on screen
  // before anything downstream could remove it.
  let inReasoning = false;
  const OPEN = /<(think|thinking|reasoning)>/i;
  const CLOSE = /<\/(think|thinking|reasoning)>/i;

  /** Returns the customer-visible part of one line, or "" if fully suppressed. */
  function visiblePart(line: string): string {
    let rest = line;
    let out = "";

    while (rest.length > 0) {
      if (inReasoning) {
        const close = CLOSE.exec(rest);
        if (!close) return out; // rest of this line is still thinking
        rest = rest.slice(close.index + close[0].length);
        inReasoning = false;
      } else {
        const open = OPEN.exec(rest);
        if (!open) {
          out += rest;
          break;
        }
        out += rest.slice(0, open.index);
        rest = rest.slice(open.index + open[0].length);
        inReasoning = true;
      }
    }
    return out;
  }

  function emit(controller: TransformStreamDefaultController<Uint8Array>, line: string, withNewline: boolean) {
    const wasSuppressing = inReasoning;
    const visible = visiblePart(line).replace(HARMONY_TOKEN, "");
    // Nothing survived and we were (or still are) inside a reasoning block —
    // swallow the line entirely rather than streaming a blank one, otherwise
    // the widget shows a growing run of empty lines while the model thinks.
    if (!visible.trim() && (wasSuppressing || inReasoning)) return;
    controller.enqueue(encoder.encode(stripFormattingLine(visible) + (withNewline ? "\n" : "")));
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // last (possibly incomplete) line stays buffered
      for (const line of lines) {
        emit(controller, line, true);
      }
    },
    flush(controller) {
      buffer += decoder.decode();
      if (buffer) {
        emit(controller, buffer, false);
      }
    },
  });
}
