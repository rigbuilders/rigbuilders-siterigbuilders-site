import { getWhatsAppConfig } from "../config";
import type { ChannelAdapter, NormalizedMessage } from "../types";
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

    const text =
      message.type === "text" && message.text?.body
        ? message.text.body
        : `[unsupported WhatsApp message type: ${message.type}]`;

    return {
      channel: "whatsapp",
      externalUserId: message.from,
      text,
      timestamp: Number(message.timestamp) * 1000, // WhatsApp sends seconds, not ms
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
};
