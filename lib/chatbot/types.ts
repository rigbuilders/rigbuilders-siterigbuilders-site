export interface NormalizedMessage {
  channel: string;
  externalUserId: string;
  text: string;
  timestamp: number;
  attachments?: { type: string; url: string }[];
  // Platform-native message id, when the adapter has one — currently only
  // set by the WhatsApp adapter, so it can mark the inbound message as read
  // (blue ticks) via the Graph API. Optional because not every channel's
  // webhook payload exposes (or needs) this.
  messageId?: string;
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

export type MediaType = "image" | "document";

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  provider: string | null;
  createdAt: string;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
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
  // Optional: not every channel has a read-receipt concept worth wiring up.
  // Currently only implemented by the WhatsApp adapter (blue ticks).
  markAsRead?(messageId: string): Promise<void>;
  // Optional: send an image/document by public URL ("link" style — Meta's
  // servers fetch it themselves, no separate media-upload-to-Meta step
  // needed). Currently implemented by all three Meta adapters, not the
  // website channel (which has no Graph API to call).
  sendMedia?(externalUserId: string, mediaUrl: string, mediaType: MediaType, caption?: string): Promise<void>;
}
