import { getMessengerConfig } from "../config";
import type { ChannelAdapter, MediaType, NormalizedMessage } from "../types";
import { graphApiUrl, postToGraphApi } from "./meta-graph-client";

// Messenger's attachment "type" values are image/audio/video/file — not our
// MediaType names directly, so this maps our two ("image"/"document") onto
// what the Send API actually expects.
const MESSENGER_ATTACHMENT_TYPE: Record<MediaType, string> = {
  image: "image",
  document: "file",
};

/**
 * Messenger Platform webhook payload shape (only the parts we use):
 * { object: "page", entry: [{ messaging: [{ sender, recipient, timestamp, message }] }] }
 *
 * TODO: only handles the first messaging event in the payload — same
 * batching caveat as the WhatsApp adapter.
 */
interface MessengerWebhookPayload {
  object?: string;
  entry?: {
    messaging?: {
      sender?: { id: string };
      timestamp?: number;
      message?: { mid: string; text?: string; is_echo?: boolean };
      postback?: unknown;
    }[];
  }[];
}

function extractFirstMessagingEvent(rawPayload: unknown) {
  const payload = rawPayload as MessengerWebhookPayload;
  if (payload.object !== "page") return null;
  return payload.entry?.[0]?.messaging?.[0] ?? null;
}

export const messengerAdapter: ChannelAdapter = {
  channelId: "messenger",

  parseIncoming(rawPayload: unknown): NormalizedMessage | null {
    const event = extractFirstMessagingEvent(rawPayload);
    if (!event?.sender?.id) return null;

    // Skip echoes of our own outbound messages, postbacks, read receipts, etc.
    if (!event.message || event.message.is_echo || !event.message.text) {
      return null;
    }

    return {
      channel: "messenger",
      externalUserId: event.sender.id,
      text: event.message.text,
      timestamp: event.timestamp ?? Date.now(),
    };
  },

  async sendReply(externalUserId: string, reply: string): Promise<void> {
    const config = getMessengerConfig();
    if (!config) {
      throw new Error(
        "Messenger is not configured: set META_VERIFY_TOKEN and MESSENGER_ACCESS_TOKEN."
      );
    }

    const url = `${graphApiUrl("me/messages")}?access_token=${encodeURIComponent(config.accessToken)}`;
    await postToGraphApi(url, {
      recipient: { id: externalUserId },
      messaging_type: "RESPONSE",
      message: { text: reply },
    });
  },

  /**
   * Sends an image or document by public URL via the Send API's generic
   * attachment payload. `caption` is accepted for interface consistency with
   * the other adapters but Messenger attachments have no separate caption
   * field — send it as a preceding text message from the caller if needed.
   */
  async sendMedia(externalUserId: string, mediaUrl: string, mediaType: MediaType): Promise<void> {
    const config = getMessengerConfig();
    if (!config) {
      throw new Error("Messenger is not configured: set META_VERIFY_TOKEN and MESSENGER_ACCESS_TOKEN.");
    }

    const url = `${graphApiUrl("me/messages")}?access_token=${encodeURIComponent(config.accessToken)}`;
    await postToGraphApi(url, {
      recipient: { id: externalUserId },
      messaging_type: "RESPONSE",
      message: {
        attachment: {
          type: MESSENGER_ATTACHMENT_TYPE[mediaType],
          payload: { url: mediaUrl, is_reusable: true },
        },
      },
    });
  },
};
