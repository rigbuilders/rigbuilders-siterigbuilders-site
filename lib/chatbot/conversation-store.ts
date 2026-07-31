import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ChatbotUser, ChatMessage, ChatRole, Conversation } from "./types";

const MAX_HISTORY_MESSAGES = 20;
// Rough stand-in for a real token budget until we wire up a tokenizer.
const MAX_HISTORY_CHARS = 6000;

interface UserRow {
  id: string;
  display_name: string | null;
  channel_identities: Record<string, string>;
  created_at: string;
}

interface ConversationRow {
  id: string;
  user_id: string;
  channel: string;
  status: "active" | "handed_off" | "closed";
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  role: ChatRole;
  content: string;
  created_at: string;
}

function mapUser(row: UserRow): ChatbotUser {
  return {
    id: row.id,
    displayName: row.display_name,
    channelIdentities: row.channel_identities,
    createdAt: row.created_at,
  };
}

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    channel: row.channel,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findOrCreateUser(
  channel: string,
  externalUserId: string,
  displayName?: string
): Promise<ChatbotUser> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("chatbot_users")
    .select("*")
    .contains("channel_identities", { [channel]: externalUserId })
    .limit(1)
    .maybeSingle<UserRow>();

  if (findError) {
    throw new Error(`Failed to look up user: ${findError.message}`);
  }
  if (existing) return mapUser(existing);

  const { data: created, error: insertError } = await supabaseAdmin
    .from("chatbot_users")
    .insert({
      display_name: displayName ?? null,
      channel_identities: { [channel]: externalUserId },
    })
    .select("*")
    .single<UserRow>();

  if (insertError || !created) {
    throw new Error(`Failed to create user: ${insertError?.message ?? "unknown error"}`);
  }
  return mapUser(created);
}

export async function findOrCreateActiveConversation(
  userId: string,
  channel: string
): Promise<Conversation> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("chatbot_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("channel", channel)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ConversationRow>();

  if (findError) {
    throw new Error(`Failed to look up conversation: ${findError.message}`);
  }
  if (existing) return mapConversation(existing);

  const { data: created, error: insertError } = await supabaseAdmin
    .from("chatbot_conversations")
    .insert({ user_id: userId, channel, status: "active" })
    .select("*")
    .single<ConversationRow>();

  if (insertError || !created) {
    throw new Error(`Failed to create conversation: ${insertError?.message ?? "unknown error"}`);
  }
  return mapConversation(created);
}

export async function appendMessage(
  conversationId: string,
  role: ChatRole,
  content: string,
  provider?: string
): Promise<void> {
  const { error: insertError } = await supabaseAdmin.from("chatbot_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    provider: provider ?? null,
  });

  if (insertError) {
    throw new Error(`Failed to append message: ${insertError.message}`);
  }

  const { error: touchError } = await supabaseAdmin
    .from("chatbot_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (touchError) {
    console.warn(
      `[chatbot] failed to touch conversation ${conversationId}: ${touchError.message}`
    );
  }
}

export async function getRecentHistory(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);

  if (error) {
    throw new Error(`Failed to load history: ${error.message}`);
  }

  const rows = (data ?? []) as MessageRow[];

  const trimmed: ChatMessage[] = [];
  let charCount = 0;
  for (const row of rows) {
    charCount += row.content.length;
    if (charCount > MAX_HISTORY_CHARS && trimmed.length > 0) break;
    trimmed.push({ role: row.role, content: row.content });
  }

  return trimmed.reverse(); // chronological order (oldest first)
}
