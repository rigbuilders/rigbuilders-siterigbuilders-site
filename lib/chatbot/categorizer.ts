import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateReply } from "./llm/router";

/**
 * Works out what an inbound message is about, on any channel.
 *
 * One LLM call returns the category AND a summary together — summarising
 * separately would double the cost for something the model has already read.
 *
 * Categories live in the database (security/chatbot_message_categories.sql)
 * so "reseller enquiry" can be added from the admin panel rather than a
 * deploy. Their descriptions ARE the classifier's accuracy: a vague
 * description produces vague routing.
 *
 * Never throws. An unclassified message falls through to the normal
 * conversational flow, which is what happened before this existed.
 */

export interface MessageCategory {
  key: string;
  heading: string;
  description: string;
  replyTemplate: string | null;
  shouldAlert: boolean;
  shouldHandoff: boolean;
  isSilent: boolean;
}

export interface Classification {
  category: MessageCategory;
  /** Two or three lines for the Telegram alert. */
  summary: string;
}

interface CategoryRow {
  key: string;
  heading: string;
  description: string;
  reply_template: string | null;
  should_alert: boolean;
  should_handoff: boolean;
  is_silent: boolean;
}

function mapRow(row: CategoryRow): MessageCategory {
  return {
    key: row.key,
    heading: row.heading,
    description: row.description,
    replyTemplate: row.reply_template,
    shouldAlert: row.should_alert,
    shouldHandoff: row.should_handoff,
    isSilent: row.is_silent,
  };
}

export async function getActiveCategories(): Promise<MessageCategory[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("message_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(`[chatbot:categorizer] load failed: ${error.message}`);
      return [];
    }
    return ((data ?? []) as CategoryRow[]).map(mapRow);
  } catch (err) {
    console.error(`[chatbot:categorizer] load threw: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Below this length the message is its own summary. "do you have ryzen 7" is
 * shorter than any restatement of it, and paying a model to paraphrase every
 * short chat message would be waste.
 */
const SUMMARY_THRESHOLD = 280;

function buildPrompt(categories: MessageCategory[]): string {
  const list = categories.map((c) => `- ${c.key}: ${c.description}`).join("\n");

  return (
    `You classify incoming messages to Rig Builders, a custom PC builder in India.\n\n` +
    `Categories:\n${list}\n\n` +
    `Reply with ONLY a JSON object, no other text and no code fences:\n` +
    `{"category":"<one key from the list above>","summary":"<what they want, 2-3 short lines, plain text>"}\n\n` +
    `Rules:\n` +
    `- category must be exactly one of the keys listed. Never invent one.\n` +
    `- If nothing clearly fits, use "other" rather than forcing a poor match.\n` +
    `- The summary is read by a colleague deciding whether to act now. State what they actually want and any figure, quantity or deadline they gave. No greeting, no padding, no advice.\n` +
    `- Describe only what the message says. Never infer a budget, quantity or product that isn't written.`
  );
}

export async function classifyMessage(text: string): Promise<Classification | null> {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  const categories = await getActiveCategories();
  if (categories.length === 0) return null;

  try {
    const { text: raw } = await generateReply(buildPrompt(categories), [], trimmed);

    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned) as { category?: string; summary?: string };

    const category = categories.find((c) => c.key === parsed.category);
    if (!category) {
      // The model returned something not on the list. Falling through to the
      // normal flow is safer than guessing at which category was meant.
      console.error(`[chatbot:categorizer] unknown category "${parsed.category}"`);
      return null;
    }

    const summary =
      trimmed.length <= SUMMARY_THRESHOLD ? trimmed : (parsed.summary ?? "").trim() || trimmed.slice(0, 280);

    return { category, summary };
  } catch (err) {
    console.error(`[chatbot:categorizer] classify failed: ${(err as Error).message}`);
    return null;
  }
}
