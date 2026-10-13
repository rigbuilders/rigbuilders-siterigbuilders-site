import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { MenuFilters } from "./guided-menu";

/**
 * Persisted guided-menu position for a conversation.
 *
 * Only the channels that are stateless between messages need this — WhatsApp,
 * Messenger and Instagram each arrive as an isolated webhook with no memory of
 * what was last on screen. The website widget keeps the equivalent in React
 * state and never touches these functions.
 *
 * Stored as a single jsonb column on chatbot_conversations (see
 * security/chatbot_menu_state.sql) rather than its own table: it's strictly
 * one-per-conversation, always read and written together, and has no history
 * worth keeping once the menu is done.
 *
 * Nothing here throws. A menu that loses its place should fall back to the
 * assistant, never break the reply.
 */

export interface MenuCrumb {
  nodeId: string;
  label: string;
  filters: MenuFilters;
}

export interface MenuState {
  nodeId: string;
  filters: MenuFilters;
  trail: MenuCrumb[];
  /** Consecutive menu fallbacks. Two means stop offering it and get a human. */
  misses: number;
}

export const MAX_CONSECUTIVE_MISSES = 2;

export async function getMenuState(conversationId: string): Promise<MenuState | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chatbot_conversations")
      .select("menu_state")
      .eq("id", conversationId)
      .maybeSingle<{ menu_state: MenuState | null }>();

    if (error) {
      console.error(`[chatbot:menu-state] read failed: ${error.message}`);
      return null;
    }
    const state = data?.menu_state;
    // Guard against a hand-edited or half-written row rather than trusting
    // whatever JSON happens to be in the column.
    if (!state || typeof state.nodeId !== "string") return null;
    return {
      nodeId: state.nodeId,
      filters: state.filters ?? {},
      trail: Array.isArray(state.trail) ? state.trail : [],
      misses: typeof state.misses === "number" ? state.misses : 0,
    };
  } catch (err) {
    console.error(`[chatbot:menu-state] read threw: ${(err as Error).message}`);
    return null;
  }
}

export async function setMenuState(conversationId: string, state: MenuState | null): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("chatbot_conversations")
      .update({ menu_state: state })
      .eq("id", conversationId);

    if (error) console.error(`[chatbot:menu-state] write failed: ${error.message}`);
  } catch (err) {
    console.error(`[chatbot:menu-state] write threw: ${(err as Error).message}`);
  }
}

/** Clears the menu — called whenever the customer types free text instead of tapping. */
export async function clearMenuState(conversationId: string): Promise<void> {
  await setMenuState(conversationId, null);
}
