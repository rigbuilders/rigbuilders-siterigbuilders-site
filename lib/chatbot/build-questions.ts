import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * The admin-editable questionnaire that precedes a custom build quote.
 *
 * Questions live in the database (see security/chatbot_build_questions.sql)
 * rather than in this file, because they change with the market — budget
 * bands drift with prices, DDR4 stops being worth asking, a new use case
 * appears. Hardcoding them would make every one of those a deploy.
 *
 * This module is the read/write layer. The asking logic — which question is
 * next, what's already known — is in build-brief.ts, so the same brief can be
 * driven from the website widget and from WhatsApp without duplication.
 */

export type AnswerType = "choice" | "text" | "choice_text";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface BuildQuestion {
  id: string;
  briefKey: string;
  label: string;
  hint: string | null;
  answerType: AnswerType;
  options: QuestionOption[];
  placeholder: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface BuildQuestionRow {
  id: string;
  brief_key: string;
  label: string;
  hint: string | null;
  answer_type: AnswerType;
  options: QuestionOption[] | null;
  placeholder: string | null;
  sort_order: number;
  is_active: boolean;
}

function mapRow(row: BuildQuestionRow): BuildQuestion {
  return {
    id: row.id,
    briefKey: row.brief_key,
    label: row.label,
    hint: row.hint,
    answerType: row.answer_type,
    options: Array.isArray(row.options) ? row.options : [],
    placeholder: row.placeholder,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/**
 * Questions to actually ask, in order. Returns [] on failure rather than
 * throwing: a questionnaire that can't load should degrade to the normal
 * conversational flow, not break the reply.
 */
export async function getActiveQuestions(): Promise<BuildQuestion[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("build_questions")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(`[chatbot:build-questions] load failed: ${error.message}`);
      return [];
    }
    return ((data ?? []) as BuildQuestionRow[]).map(mapRow);
  } catch (err) {
    console.error(`[chatbot:build-questions] load threw: ${(err as Error).message}`);
    return [];
  }
}

/** Every question including retired ones — for the admin editor only. */
export async function getAllQuestions(): Promise<BuildQuestion[]> {
  const { data, error } = await supabaseAdmin
    .from("build_questions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load questions: ${error.message}`);
  return ((data ?? []) as BuildQuestionRow[]).map(mapRow);
}

export interface QuestionInput {
  briefKey: string;
  label: string;
  hint?: string | null;
  answerType: AnswerType;
  options?: QuestionOption[];
  placeholder?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createQuestion(input: QuestionInput): Promise<BuildQuestion> {
  const { data, error } = await supabaseAdmin
    .from("build_questions")
    .insert({
      brief_key: input.briefKey,
      label: input.label,
      hint: input.hint ?? null,
      answer_type: input.answerType,
      options: input.options ?? [],
      placeholder: input.placeholder ?? null,
      sort_order: input.sortOrder ?? 999,
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single<BuildQuestionRow>();

  if (error || !data) throw new Error(`Failed to create question: ${error?.message ?? "unknown"}`);
  return mapRow(data);
}

/**
 * Note brief_key is deliberately NOT updatable. Answers already collected are
 * filed under it, so changing it would orphan them — a customer who answered
 * "budget" would be asked again because the key no longer matches. Retire the
 * question and add a new one instead.
 */
export async function updateQuestion(id: string, input: Partial<Omit<QuestionInput, "briefKey">>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.label !== undefined) patch.label = input.label;
  if (input.hint !== undefined) patch.hint = input.hint;
  if (input.answerType !== undefined) patch.answer_type = input.answerType;
  if (input.options !== undefined) patch.options = input.options;
  if (input.placeholder !== undefined) patch.placeholder = input.placeholder;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const { error } = await supabaseAdmin.from("build_questions").update(patch).eq("id", id);
  if (error) throw new Error(`Failed to update question: ${error.message}`);
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("build_questions").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete question: ${error.message}`);
}

/** Bulk reorder from the admin UI's drag handles. */
export async function reorderQuestions(orderedIds: string[]): Promise<void> {
  // Sequential rather than parallel: a handful of rows, and a partial reorder
  // is easier to reason about than a half-applied Promise.all.
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabaseAdmin
      .from("build_questions")
      .update({ sort_order: (i + 1) * 10, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i]);
    if (error) throw new Error(`Failed to reorder: ${error.message}`);
  }
}
