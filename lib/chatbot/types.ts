export interface NormalizedMessage {
  channel: string;
  externalUserId: string;
  text: string;
  timestamp: number;
  attachments?: { type: string; url: string }[];
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ConversationStatus = "active" | "handed_off" | "closed";

export interface ChatbotUser {
  id: string;
  displayName: string | null;
  channelIdentities: Record<string, string>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  channel: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  provider: string | null;
  createdAt: string;
}

/**
 * The only layer that knows a platform's message format. The orchestrator
 * never sees a raw Meta payload — only what comes out of parseIncoming.
 */
export interface ChannelAdapter {
  channelId: string;
  parseIncoming(rawPayload: unknown): NormalizedMessage | null;
  sendReply(
    externalUserId: string,
    reply: string,
    meta?: Record<string, unknown>
  ): Promise<void>;
}
