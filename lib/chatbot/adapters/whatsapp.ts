import { getWhatsAppConfig } from "../config";
import type { ChannelAdapter, MediaType, NormalizedMessage } from "../types";
import { graphApiUrl, postToGraphApi } from "./meta-graph-client";

/**
 * WhatsApp Cloud API webhook payload shape (only the parts we use):
 * { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [...] } }] }] }
 *
 * TODO: only handles the first message event in the payload. Meta can batch
 * multiple entries/changes/messages into a single webhook call — if you see
 * missed messages under load, extend this to loop over all of them instead
 * of just entry[0].changes[0].value.messages[0].
 */
interface WhatsAppWebhookPayload {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        messages?: {
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { caption?: string };
          document?: { caption?: string; filename?: string };
        }[];
      };
    }[];
  }[];
}

function extractFirstMessage(rawPayload: unknown) {
  const payload = rawPayload as WhatsAppWebhookPayload;
  if (payload.object !== "whatsapp_business_account") return null;
  return payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ?? null;
}

export const whatsappAdapter: ChannelAdapter = {
  channelId: "whatsapp",

  parseIncoming(rawPayload: unknown): NormalizedMessage | null {
    const message = extractFirstMessage(rawPayload);
    if (!message) return null;

    // Inbound image/document downloading isn't wired up yet (Meta only gives
    // a media id for inbound files, which needs a second authenticated fetch
    // for a short-lived URL, then re-hosting before it expires — a genuinely
    // separate feature from outbound sending). For now these just show a
    // readable placeholder in the admin thread instead of a raw type string.
    let text: string;
    if (message.type === "text" && message.text?.body) {
      text = message.text.body;
    } else if (message.type === "image") {
      text = message.image?.caption ? `[Image] ${message.image.caption}` : "[Customer sent an image]";
    } else if (message.type === "document") {
      text = `[Customer sent a file${message.document?.filename ? `: ${message.document.filename}` : ""}]`;
    } else {
      text = `[unsupported WhatsApp message type: ${message.type}]`;
    }

    return {
      channel: "whatsapp",
      externalUserId: message.from,
      text,
      timestamp: Number(message.timestamp) * 1000, // WhatsApp sends seconds, not ms
      messageId: message.id,
    };
  },

  async sendReply(externalUserId: string, reply: string): Promise<void> {
    const config = getWhatsAppConfig();
    if (!config) {
      throw new Error(
        "WhatsApp is not configured: set META_VERIFY_TOKEN, WA_PHONE_ID, and WHATSAPP_ACCESS_TOKEN."
      );
    }

    const url = graphApiUrl(`${config.phoneId}/messages`);
    await postToGraphApi(
      url,
      {
        messaging_product: "whatsapp",
        to: externalUserId,
        type: "text",
        text: { body: reply },
      },
      { Authorization: `Bearer ${config.accessToken}` }
    );
  },

  /**
   * Sends an image or document by public URL — WhatsApp's Cloud API fetches
   * it from mediaUrl itself, no separate "upload to Meta first" step needed.
   * mediaUrl must be publicly reachable over HTTPS (see the admin send-media
   * route, which uploads to a public Supabase Storage bucket first).
   */
  async sendMedia(externalUserId: string, mediaUrl: string, mediaType: MediaType, caption?: string): Promise<void> {
    const config = getWhatsAppConfig();
    if (!config) {
      throw new Error(
        "WhatsApp is not configured: set META_VERIFY_TOKEN, WA_PHONE_ID, and WHATSAPP_ACCESS_TOKEN."
      );
    }

    const url = graphApiUrl(`${config.phoneId}/messages`);
    const mediaPayload = caption ? { link: mediaUrl, caption } : { link: mediaUrl };
    await postToGraphApi(
      url,
      {
        messaging_product: "whatsapp",
        to: externalUserId,
        type: mediaType,
        [mediaType]: mediaPayload,
      },
      { Authorization: `Bearer ${config.accessToken}` }
    );
  },

  /**
   * Marks the inbound message as read (blue ticks on the customer's side).
   * Purely cosmetic — never worth failing the whole webhook over — so the
   * caller (the webhook route) is expected to catch/log rather than let this
   * block persisting the message or generating a reply.
   */
  async markAsRead(messageId: string): Promise<void> {
    const config = getWhatsAppConfig();
    if (!config) return;

    const url = graphApiUrl(`${config.phoneId}/messages`);
    await postToGraphApi(
      url,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
      { Authorization: `Bearer ${config.accessToken}` }
    );
  },
};
