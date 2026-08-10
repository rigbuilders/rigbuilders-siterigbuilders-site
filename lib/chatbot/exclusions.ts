import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface ExcludedNumber {
  id: string;
  channel: string;
  externalUserId: string;
  reason: string | null;
  createdAt: string;
}

interface ExcludedRow {
  id: string;
  channel: string;
  external_user_id: string;
  reason: string | null;
  created_at: string;
}

function mapRow(row: ExcludedRow): ExcludedNumber {
  return {
    id: row.id,
    channel: row.channel,
    externalUserId: row.external_user_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

/** Checked on every inbound message before the bot is allowed to auto-reply. */
export async function isExcluded(channel: string, externalUserId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_excluded_numbers")
    .select("id")
    .eq("channel", channel)
    .eq("external_user_id", externalUserId)
    .maybeSingle();

  if (error) {
    // Fail closed on the side of NOT crashing the webhook, but log loudly —
    // an exclusion check that silently breaks is worse than a slow reply.
    console.error(`[chatbot:exclusions] lookup failed: ${error.message}`);
    return false;
  }
  return Boolean(data);
}

export async function listExcluded(): Promise<ExcludedNumber[]> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_excluded_numbers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list excluded numbers: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as ExcludedRow));
}

export async function addExcluded(
  channel: string,
  externalUserId: string,
  reason?: string
): Promise<ExcludedNumber> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_excluded_numbers")
    .insert({ channel, external_user_id: externalUserId, reason: reason ?? null })
    .select("*")
    .single<ExcludedRow>();

  if (error || !data) {
    throw new Error(`Failed to add excluded number: ${error?.message ?? "unknown error"}`);
  }

  // Best-effort: if this number already has an open conversation, flip it to
  // handed_off too, so the inbox UI reflects reality instead of still
  // showing "active" for a number that will never get an auto-reply.
  try {
    const { data: user } = await supabaseAdmin
      .from("chatbot_users")
      .select("id")
      .contains("channel_identities", { [channel]: externalUserId })
      .maybeSingle<{ id: string }>();

    if (user) {
      await supabaseAdmin
        .from("chatbot_conversations")
        .update({ status: "handed_off", updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("channel", channel)
        .eq("status", "active");
    }
  } catch (err) {
    console.warn(`[chatbot:exclusions] failed to sync conversation status: ${(err as Error).message}`);
  }

  return mapRow(data);
}

export async function removeExcluded(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("chatbot_excluded_numbers").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove excluded number: ${error.message}`);
}
