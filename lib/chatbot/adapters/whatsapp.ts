import { getWhatsAppConfig } from "../config";
import type { ChannelAdapter, MediaType, NormalizedMessage, ReplyMeta } from "../types";
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
          // Present when type is "unsupported" — Meta's Cloud API doesn't
          // deliver content for certain WhatsApp-native message types at
          // all (view-once/ephemeral photos & videos, reactions, polls,
          // deleted messages). This isn't something our webhook can work
          // around: the actual content is never sent to any business
          // integration, by design, for privacy reasons — same limitation
          // every WhatsApp Cloud API integration hits, not a gap in our code.
          errors?: { code: number; title: string; message?: string; error_data?: { details?: string } }[];
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
    } else if (message.type === "unsupported") {
      // Meta never sends content for these regardless of integration — most
      // often a view-once/disappearing photo or video, a reaction, a poll,
      // or a deleted message. code 131051 is the generic "unsupported
      // message type" error Meta attaches; error_data.details is sometimes
      // more specific but usually just repeats the same generic wording.
      text = "[Customer sent a message type WhatsApp doesn't deliver to businesses — likely a view-once photo/video, a reaction, or a poll. Ask them to resend as a regular photo/video or plain text.]";
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

  async sendReply(externalUserId: string, reply: string, meta?: ReplyMeta): Promise<void> {
    const config = getWhatsAppConfig();
    if (!config) {
      throw new Error(
        "WhatsApp is not configured: set META_VERIFY_TOKEN, WA_PHONE_ID, and WHATSAPP_ACCESS_TOKEN."
      );
    }

    const url = graphApiUrl(`${config.phoneId}/messages`);

    // Rich product card, single free button by default: "View Details" only
    // — no Buy Now, no Add to Cart link. Kept deliberately simple/free: the
    // "buy_now_view_details" Message Template (2 real buttons) is built and
    // approved if ever wanted back, but Marketing-category templates are
    // billed per send by Meta, and the product decision here is to show
    // customers exactly one option rather than juggle cost against choice.
    // Plain cta_url session messages like this one are free as long as
    // they're sent within 24h of the customer's own message (always true
    // here, since this only ever fires as a direct reply).
    if (meta?.product) {
      const { product } = meta;
      console.log(
        `[chatbot:whatsapp-adapter] sending product card for "${product.name}" — imageUrl: ${
          product.imageUrl ?? "(none)"
        }`
      );

      const body = reply.length > 1000 ? `${reply.slice(0, 997)}...` : reply;

      const ctaResult = await postToGraphApi(
        url,
        {
          messaging_product: "whatsapp",
          to: externalUserId,
          type: "interactive",
          interactive: {
            type: "cta_url",
            ...(product.imageUrl ? { header: { type: "image", image: { link: product.imageUrl } } } : {}),
            body: { text: body },
            action: {
              name: "cta_url",
              parameters: { display_text: "View Details", url: product.productUrl },
            },
          },
        },
        { Authorization: `Bearer ${config.accessToken}` }
      );
      console.log(`[chatbot:whatsapp-adapter] product card send accepted: ${JSON.stringify(ctaResult)}`);
      return;
    }

    // A "View Details" button — sent as a cta_url interactive message
    // instead of plain text. Interactive message bodies cap at 1024
    // characters (vs. 4096 for plain text), so truncate defensively rather
    // than let the whole send fail over a long reply.
    if (meta?.ctaUrl) {
      const body = reply.length > 1000 ? `${reply.slice(0, 997)}...` : reply;
      await postToGraphApi(
        url,
        {
          messaging_product: "whatsapp",
          to: externalUserId,
          type: "interactive",
          interactive: {
            type: "cta_url",
            body: { text: body },
            action: {
              name: "cta_url",
              parameters: { display_text: meta.ctaLabel ?? "View Details", url: meta.ctaUrl },
            },
          },
        },
        { Authorization: `Bearer ${config.accessToken}` }
      );
      return;
    }

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
   * Marks the inbound message as read (blue ticks) AND shows WhatsApp's
   * native "typing…" indicator, in the same call — Meta's Cloud API combines
   * both into one request via the optional `typing_indicator` field on the
   * mark-as-read payload. The typing bubble is exactly what a human agent
   * typing a reply would show; it auto-dismisses the moment we send the
   * actual reply (handleMessage() runs right after this in the webhook
   * route), or after 25s on its own if something goes wrong — comfortably
   * longer than the few-second LLM round-trip this is bridging.
   * Cosmetic — never worth failing the whole webhook over — so the caller
   * (the webhook route) is expected to catch/log rather than let this block
   * persisting the message or generating a reply.
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
        typing_indicator: { type: "text" },
      },
      { Authorization: `Bearer ${config.accessToken}` }
    );
  },
};
