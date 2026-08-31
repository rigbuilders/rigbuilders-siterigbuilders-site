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

    // Rich product card. Real multi-button cards (like the Tumbledry
    // example) aren't possible on a freely-composed/dynamic message —
    // WhatsApp caps those at exactly one URL button. Two real buttons (Buy
    // Now + View Details) requires a pre-approved Message Template, which
    // "buy_now_view_details" is — approved in WhatsApp Manager with an image
    // header, a 3-variable body (product name / price / specs), and two
    // dynamic "Visit website" buttons whose fixed base URLs already encode
    // ?action=buy / the /product/ path, needing only the product id as the
    // per-send suffix. Requires an image (the template's header component is
    // type "image"), so products with no image fall back to the single-
    // button live cta_url message below instead of sending a template with a
    // missing required parameter.
    if (meta?.product) {
      const { product } = meta;
      console.log(
        `[chatbot:whatsapp-adapter] sending product card for "${product.name}" — imageUrl: ${
          product.imageUrl ?? "(none)"
        }`
      );

      if (product.imageUrl) {
        const specs = (product.description ?? "See product page for full specs.").replace(/\s+/g, " ").trim();
        const templateResult = await postToGraphApi(
          url,
          {
            messaging_product: "whatsapp",
            to: externalUserId,
            type: "template",
            template: {
              name: "buy_now_view_details",
              language: { code: "en" },
              components: [
                {
                  type: "header",
                  parameters: [{ type: "image", image: { link: product.imageUrl } }],
                },
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: product.name },
                    { type: "text", text: `₹${product.price.toLocaleString("en-IN")}` },
                    { type: "text", text: specs },
                  ],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [{ type: "text", text: product.id }],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "1",
                  parameters: [{ type: "text", text: product.id }],
                },
              ],
            },
          },
          { Authorization: `Bearer ${config.accessToken}` }
        );
        console.log(`[chatbot:whatsapp-adapter] template send accepted: ${JSON.stringify(templateResult)}`);
        return;
      }

      // No product image — the template's header requires one, so fall back
      // to a single-button live message instead of sending a template with a
      // missing required parameter (Meta would reject it outright).
      const links = `View Details: ${product.productUrl}`;
      const maxReplyLen = 1000 - links.length - 2;
      const replyPart = reply.length > maxReplyLen ? `${reply.slice(0, maxReplyLen - 3)}...` : reply;
      const body = `${replyPart}\n\n${links}`;

      const ctaResult = await postToGraphApi(
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
              parameters: { display_text: "Buy Now", url: product.buyNowUrl },
            },
          },
        },
        { Authorization: `Bearer ${config.accessToken}` }
      );
      console.log(`[chatbot:whatsapp-adapter] fallback (no image) send accepted: ${JSON.stringify(ctaResult)}`);
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
