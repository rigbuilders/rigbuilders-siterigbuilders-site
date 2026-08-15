import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ChatbotUser, ChatMessage, ChatRole, Conversation, StoredMessage } from "./types";

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

/**
 * Finds the user's current *open* conversation on this channel (active OR
 * handed_off — both mean "still ongoing"), or opens a new one. Deliberately
 * does NOT filter to status='active' only: if a human has paused the bot on
 * an ongoing conversation (handed_off), the next inbound message must land
 * in that same conversation, not spawn a fresh 'active' one that would let
 * the bot bypass the pause.
 */
export async function findOrCreateActiveConversation(
  userId: string,
  channel: string
): Promise<Conversation> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("chatbot_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("channel", channel)
    .in("status", ["active", "handed_off"])
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

/**
 * Read-only lookup for the website widget's polling endpoint — unlike
 * findOrCreateActiveConversation, this never creates a user or conversation.
 * A stray poll from a visitorId that hasn't sent a message yet should just
 * see "nothing here" rather than spawning an empty conversation row.
 */
export async function findExistingConversation(
  channel: string,
  externalUserId: string
): Promise<Conversation | null> {
  const { data: user, error: userError } = await supabaseAdmin
    .from("chatbot_users")
    .select("id")
    .contains("channel_identities", { [channel]: externalUserId })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (userError) {
    throw new Error(`Failed to look up user: ${userError.message}`);
  }
  if (!user) return null;

  const { data: conversation, error: convError } = await supabaseAdmin
    .from("chatbot_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("channel", channel)
    .in("status", ["active", "handed_off"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ConversationRow>();

  if (convError) {
    throw new Error(`Failed to look up conversation: ${convError.message}`);
  }
  return conversation ? mapConversation(conversation) : null;
}

/**
 * Full chronological message list for a conversation (unlike
 * getRecentHistory, not capped/reversed — used by the website widget to
 * render the whole thread and to notice new messages a human added).
 */
export async function getMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await supabaseAdmin
    .from("chatbot_messages")
    .select("id, role, content, provider, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    conversationId,
    role: row.role,
    content: row.content,
    provider: row.provider,
    createdAt: row.created_at,
  }));
}

export async function updateConversationStatus(
  conversationId: string,
  status: "active" | "handed_off" | "closed"
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("chatbot_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) throw new Error(`Failed to update conversation status: ${error.message}`);
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
