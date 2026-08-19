import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * The mirror-image of exclusions.ts. A number on THIS list still gets normal
 * auto-replies — the only effect is an admin email fires the moment they
 * send any message at all, regardless of content (unlike the handoff-keyword
 * detection in handoff.ts, which only fires when the message itself looks
 * like a request for a human). Useful for "if this specific supplier/VIP
 * customer/family member texts, tell me immediately."
 */
export interface WatchedNumber {
  id: string;
  channel: string;
  externalUserId: string;
  label: string | null;
  createdAt: string;
}

interface WatchedRow {
  id: string;
  channel: string;
  external_user_id: string;
  label: string | null;
  created_at: string;
}

function mapRow(row: WatchedRow): WatchedNumber {
  return {
    id: row.id,
    channel: row.channel,
    externalUserId: row.external_user_id,
    label: row.label,
    createdAt: row.created_at,
  };
}

/**
 * Checked on every inbound message, independent of bot/exclusion status.
 * Returns the row (so the caller has the label for the alert email) or null
 * if this number isn't being watched.
 */
export async function getWatched(channel: string, externalUserId: string): Promise<WatchedNumber | null> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_watched_numbers")
    .select("*")
    .eq("channel", channel)
    .eq("external_user_id", externalUserId)
    .maybeSingle<WatchedRow>();

  if (error) {
    // Same fail-closed philosophy as exclusions.ts: a broken watchlist check
    // should never take down the reply pipeline, just silently skip the alert.
    console.error(`[chatbot:watchlist] lookup failed: ${error.message}`);
    return null;
  }
  return data ? mapRow(data) : null;
}

export async function listWatched(): Promise<WatchedNumber[]> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_watched_numbers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list watched numbers: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as WatchedRow));
}

export async function addWatched(
  channel: string,
  externalUserId: string,
  label?: string
): Promise<WatchedNumber> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_watched_numbers")
    .insert({ channel, external_user_id: externalUserId, label: label ?? null })
    .select("*")
    .single<WatchedRow>();

  if (error || !data) {
    throw new Error(`Failed to add watched number: ${error?.message ?? "unknown error"}`);
  }
  return mapRow(data);
}

export async function removeWatched(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("chatbot_watched_numbers").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove watched number: ${error.message}`);
}
