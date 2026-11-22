import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getActiveQuestions, type BuildQuestion } from "./build-questions";

/**
 * Collects the answers needed before we can quote a custom build, across
 * however many messages it takes and whichever channel the customer is on.
 *
 * The single rule that shapes this module: never ask something we already
 * know. That includes answers given earlier in the conversation AND answers
 * buried in the customer's own free text — someone who opens with "gaming pc
 * under 1 lakh" has already told us their purpose and budget, and asking
 * again is the fastest way to look like nobody's listening.
 */

export type BuildBrief = Record<string, string>;

export async function getBrief(conversationId: string): Promise<BuildBrief | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chatbot_conversations")
      .select("build_brief")
      .eq("id", conversationId)
      .maybeSingle<{ build_brief: BuildBrief | null }>();

    if (error) {
      console.error(`[chatbot:build-brief] read failed: ${error.message}`);
      return null;
    }
    const brief = data?.build_brief;
    return brief && typeof brief === "object" ? brief : null;
  } catch (err) {
    console.error(`[chatbot:build-brief] read threw: ${(err as Error).message}`);
    return null;
  }
}

export async function setBrief(conversationId: string, brief: BuildBrief | null): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("chatbot_conversations")
      .update({ build_brief: brief })
      .eq("id", conversationId);
    if (error) console.error(`[chatbot:build-brief] write failed: ${error.message}`);
  } catch (err) {
    console.error(`[chatbot:build-brief] write threw: ${(err as Error).message}`);
  }
}

export async function clearBrief(conversationId: string): Promise<void> {
  await setBrief(conversationId, null);
}

/**
 * Pulls answers out of whatever the customer already wrote, so the
 * questionnaire can skip them.
 *
 * Matching is against each question's own option labels and ids, which keeps
 * this working when the questions are edited in the admin panel — there's no
 * second list of keywords here to fall out of sync with the first.
 */
export function inferAnswers(text: string, questions: BuildQuestion[]): BuildBrief {
  const lower = ` ${text.toLowerCase()} `;
  const found: BuildBrief = {};

  for (const question of questions) {
    for (const option of question.options) {
      // "any"/"no preference" is never inferred — saying nothing about a
      // graphics card isn't the same as saying you don't care, and assuming
      // otherwise silently removes a question the customer wanted to answer.
      if (option.id === "any") continue;

      const needle = option.label.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      if (!needle) continue;
      if (lower.includes(` ${needle} `) || lower.includes(` ${option.id.toLowerCase()} `)) {
        found[question.briefKey] = option.label;
        break;
      }
    }
  }

  const budgetQuestion = questions.find((q) => q.briefKey === "budget");
  if (budgetQuestion && !found.budget) {
    const budget = extractBudgetPhrase(text);
    if (budget) found.budget = budget;
  }

  return found;
}

/**
 * Lifts a budget out of free text, preserving the customer's own phrasing.
 *
 * Deliberately returns the phrase rather than a number: "strict 50k" and
 * "1.25 lakh - 1.50 lakh" carry intent a single figure throws away, and the
 * person building the quote wants to see what was actually said.
 */
export function extractBudgetPhrase(text: string): string | null {
  const patterns: RegExp[] = [
    // Ranges first — otherwise the single-figure pattern matches half of one.
    /(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?\s*(?:k|lakh|lac|l)?\s*(?:-|–|to)\s*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?\s*(?:k|lakh|lac|l)\b/i,
    /\b(?:strict|exactly|max|maximum|under|below|around|about|upto|up to)\s*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?\s*(?:k|lakh|lac|l)\b/i,
    /(?:₹|rs\.?|inr)\s*[\d,]{4,}/i,
    /\b\d+(?:\.\d+)?\s*(?:k|lakh|lac)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

export interface BriefProgress {
  /** The question to ask now, or null when the brief is complete. */
  question: BuildQuestion | null;
  brief: BuildBrief;
  answered: number;
  total: number;
}

/**
 * Starts or resumes a brief. Any answers inferable from `text` are recorded
 * first, so a customer who said what they wanted up front is asked only for
 * what's genuinely missing.
 */
export async function advanceBrief(conversationId: string, text?: string): Promise<BriefProgress> {
  const questions = await getActiveQuestions();
  const existing = (await getBrief(conversationId)) ?? {};

  const brief: BuildBrief = text
    ? { ...inferAnswers(text, questions), ...existing } // existing wins: an explicit answer beats an inference
    : existing;

  const question = questions.find((q) => !brief[q.briefKey]) ?? null;

  await setBrief(conversationId, brief);

  return {
    question,
    brief,
    answered: questions.filter((q) => brief[q.briefKey]).length,
    total: questions.length,
  };
}

/**
 * Records an answer and returns the next question. `value` is whatever the
 * customer said — a tapped option's label, or their own words for the
 * free-text budget.
 */
export async function recordAnswer(
  conversationId: string,
  briefKey: string,
  value: string
): Promise<BriefProgress> {
  const questions = await getActiveQuestions();
  const brief = { ...((await getBrief(conversationId)) ?? {}), [briefKey]: value.trim() };
  await setBrief(conversationId, brief);

  return {
    question: questions.find((q) => !brief[q.briefKey]) ?? null,
    brief,
    answered: questions.filter((q) => brief[q.briefKey]).length,
    total: questions.length,
  };
}

/** Human-readable summary, for the quote context and the ops alert. */
export async function describeBrief(brief: BuildBrief): Promise<string> {
  const questions = await getActiveQuestions();
  const lines = questions
    .filter((q) => brief[q.briefKey])
    .map((q) => `${q.label.replace(/\?$/, "")}: ${brief[q.briefKey]}`);

  // Anything collected under a key that's since been retired still matters to
  // whoever reads this, so it isn't dropped just because the question is gone.
  const known = new Set(questions.map((q) => q.briefKey));
  for (const [key, value] of Object.entries(brief)) {
    if (!known.has(key)) lines.push(`${key}: ${value}`);
  }

  return lines.join("\n");
}
