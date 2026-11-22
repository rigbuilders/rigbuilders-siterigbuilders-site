import { advanceBrief, clearBrief, describeBrief, getBrief, recordAnswer } from "./build-brief";
import { getActiveQuestions, type BuildQuestion } from "./build-questions";
import { routeBuildRequest } from "./quote-routing";
import type { MenuRender } from "./whatsapp-menu";

/**
 * Runs the pre-quote questionnaire as a conversation.
 *
 * Triggered by a build request with no specific parts named — "a gaming PC
 * under 1 lakh". Requests that DO name parts go to quotation-flow.ts instead,
 * which can price them straight from the catalogue; there's nothing to ask.
 *
 * Channel-agnostic by construction: it returns the question and its options,
 * and each channel renders that however it can (buttons on WhatsApp, chips in
 * the widget, plain text anywhere else).
 */

/** Phrases that mean "build me something" without naming a single part. */
const BUILD_REQUEST = [
  /\bbuild (me|a|my)\b/i,
  /\bcustom (pc|build|rig)\b/i,
  /\b(gaming|editing|streaming|workstation|office) (pc|rig|system|setup|build)\b/i,
  /\b(pc|rig|system|setup) (for|under|within|around)\b/i,
  /\bneed a (pc|rig|computer|system)\b/i,
  /\bwant to build\b/i,
  /\brecommend (a|me a) (pc|build|rig)\b/i,
  /\bsuggest (a|me a) (pc|build|rig)\b/i,
];

export function looksLikeBuildRequest(text: string): boolean {
  return BUILD_REQUEST.some((pattern) => pattern.test(text));
}

export interface BriefStep {
  /** What to say to the customer. */
  text: string;
  /** Interactive rendering for channels that support it. */
  menu?: MenuRender;
  /** True once every question is answered and the lead has been routed. */
  complete: boolean;
}

/** Which question an incoming answer belongs to — the one asked last. */
const PENDING_KEY = "__pending";

function renderQuestion(question: BuildQuestion, answeredCount: number, total: number): BriefStep {
  const progress = total > 1 ? ` (${answeredCount + 1} of ${total})` : "";
  const hint = question.hint ? `\n${question.hint}` : "";
  const body = `${question.label}${progress}${hint}`;

  // Free-text questions have nothing to tap, so they're sent as plain text
  // with the placeholder's examples inlined — those examples are the whole
  // reason someone knows "strict 50k" is an acceptable answer.
  if (question.answerType === "text" || question.options.length === 0) {
    return {
      text: question.placeholder ? `${body}\n\nFor example: ${question.placeholder}` : body,
      complete: false,
    };
  }

  const optionText = question.options.map((o) => `• ${o.label}`).join("\n");
  const extra =
    question.answerType === "choice_text" && question.placeholder
      ? `\n\nOr type your own — ${question.placeholder}`
      : "";

  return {
    text: `${body}\n\n${optionText}${extra}`,
    menu:
      question.options.length <= 3
        ? {
            kind: "buttons",
            body: `${body}${extra}`.slice(0, 1024),
            buttons: question.options.slice(0, 3).map((o) => ({
              id: `brief::${question.briefKey}::${o.id}`,
              title: o.label.slice(0, 20),
            })),
          }
        : {
            kind: "list",
            body: `${body}${extra}`.slice(0, 1024),
            listButtonText: "Choose",
            rows: question.options.slice(0, 10).map((o) => ({
              id: `brief::${question.briefKey}::${o.id}`,
              title: o.label.slice(0, 24),
            })),
          },
    complete: false,
  };
}

/** True when a questionnaire is mid-flight on this conversation. */
export async function isBriefInProgress(conversationId: string): Promise<boolean> {
  const brief = await getBrief(conversationId);
  return Boolean(brief && brief[PENDING_KEY]);
}

/**
 * Starts the questionnaire, recording anything the opening message already
 * told us. Returns null when there are no active questions configured, so the
 * normal conversational flow takes over rather than stalling.
 */
export async function startBrief(
  conversationId: string,
  text: string,
  context: { channel: string; customer: string }
): Promise<BriefStep | null> {
  const questions = await getActiveQuestions();
  if (questions.length === 0) return null;

  const progress = await advanceBrief(conversationId, text);

  if (!progress.question) {
    return completeBrief(conversationId, text, context);
  }

  await recordAnswer(conversationId, PENDING_KEY, progress.question.briefKey);
  return renderQuestion(progress.question, progress.answered, progress.total);
}

/**
 * Files an answer against the question we last asked and moves on.
 *
 * `value` is the customer's words — a tapped option's label, or free text.
 * Both are stored verbatim: "strict 50k" tells whoever builds the quote
 * something that the nearest budget band would have thrown away.
 */
export async function answerBrief(
  conversationId: string,
  value: string,
  context: { channel: string; customer: string }
): Promise<BriefStep | null> {
  const brief = await getBrief(conversationId);
  const pendingKey = brief?.[PENDING_KEY];
  if (!pendingKey) return null;

  const progress = await recordAnswer(conversationId, pendingKey, value);

  if (!progress.question) {
    return completeBrief(conversationId, value, context);
  }

  await recordAnswer(conversationId, PENDING_KEY, progress.question.briefKey);
  // -1 because the pending marker inflates the answered count by one.
  return renderQuestion(progress.question, Math.max(0, progress.answered - 1), progress.total);
}

/** Every question answered — hand the lead to the builds number and say so. */
async function completeBrief(
  conversationId: string,
  originalMessage: string,
  context: { channel: string; customer: string }
): Promise<BriefStep> {
  const brief = (await getBrief(conversationId)) ?? {};
  // Strip the bookkeeping key so it never appears in a summary a human reads.
  const { [PENDING_KEY]: _pending, ...answers } = brief;
  void _pending;

  const summary = await describeBrief(answers);

  await routeBuildRequest({
    channel: context.channel,
    customer: context.customer,
    briefSummary: summary,
    originalMessage,
  });

  await clearBrief(conversationId);

  return {
    text:
      "Thanks — that's everything I need. Our team is putting a build together for you and will share the " +
      "quotation here shortly.",
    complete: true,
  };
}

/** Maps a tapped WhatsApp reply id back to its answer, or null if unrelated. */
export function parseBriefReplyId(replyId: string): { briefKey: string; optionId: string } | null {
  if (!replyId.startsWith("brief::")) return null;
  const [, briefKey, optionId] = replyId.split("::");
  if (!briefKey || !optionId) return null;
  return { briefKey, optionId };
}
