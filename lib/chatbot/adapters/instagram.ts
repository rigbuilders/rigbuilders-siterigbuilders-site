import { getInstagramConfig } from "../config";
import type { ChannelAdapter, NormalizedMessage } from "../types";
import { graphApiUrl, postToGraphApi } from "./meta-graph-client";

/**
 * Instagram messaging webhook payload shape (only the parts we use):
 * { object: "instagram", entry: [{ messaging: [{ sender, timestamp, message }] }] }
 * Structurally the same envelope as Messenger, since both ride the Messenger
 * Platform webhook — just object: "instagram" instead of "page".
 *
 * TODO: only handles the first messaging event — same batching caveat as
 * the other two Meta adapters. Also: Instagram's Graph API endpoints have
 * shifted more than WhatsApp/Messenger's historically — double check
 * developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
 * against whatever's current when you wire up real credentials.
 */
interface InstagramWebhookPayload {
  object?: string;
  entry?: {
    messaging?: {
      sender?: { id: string };
      timestamp?: number;
      message?: { mid: string; text?: string; is_echo?: boolean };
    }[];
  }[];
}

function extractFirstMessagingEvent(rawPayload: unknown) {
  const payload = rawPayload as InstagramWebhookPayload;
  if (payload.object !== "instagram") return null;
  return payload.entry?.[0]?.messaging?.[0] ?? null;
}

export const instagramAdapter: ChannelAdapter = {
  channelId: "instagram",

  parseIncoming(rawPayload: unknown): NormalizedMessage | null {
    const event = extractFirstMessagingEvent(rawPayload);
    if (!event?.sender?.id) return null;

    if (!event.message || event.message.is_echo || !event.message.text) {
      return null;
    }

    return {
      channel: "instagram",
      externalUserId: event.sender.id,
      text: event.message.text,
      timestamp: event.timestamp ?? Date.now(),
    };
  },

  async sendReply(externalUserId: string, reply: string): Promise<void> {
    const config = getInstagramConfig();
    if (!config) {
      throw new Error(
        "Instagram is not configured: set META_VERIFY_TOKEN and INSTAGRAM_ACCESS_TOKEN."
      );
    }

    const path = config.businessId ? `${config.businessId}/messages` : "me/messages";
    const url = `${graphApiUrl(path)}?access_token=${encodeURIComponent(config.accessToken)}`;
    await postToGraphApi(url, {
      recipient: { id: externalUserId },
      message: { text: reply },
    });
  },
};
