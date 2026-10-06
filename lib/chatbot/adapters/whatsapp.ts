import { getWhatsAppConfig } from "../config";
import type { ChannelAdapter, MediaType, NormalizedMessage, ReplyMeta } from "../types";
import { getFromGraphApi, graphApiUrl, postToGraphApi } from "./meta-graph-client";
import { rehostInboundMedia } from "../inbound-media";

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
          // `id` is a WhatsApp media id, not a URL — actual content requires
          // a separate authenticated lookup (see downloadWhatsAppImage
          // below), unlike Messenger/Instagram which hand back a direct URL.
          image?: { caption?: string; id?: string };
          document?: { caption?: string; filename?: string };
          video?: { caption?: string; id?: string };
          audio?: { id?: string; voice?: boolean };
          sticker?: { id?: string };
          location?: { latitude?: number; longitude?: number; name?: string; address?: string };
          contacts?: { name?: { formatted_name?: string } }[];
          reaction?: { message_id?: string; emoji?: string };
          button?: { text?: string; payload?: string };
          interactive?: {
            type?: string;
            button_reply?: { id?: string; title?: string };
            list_reply?: { id?: string; title?: string };
          };
          // Present when type is "unsupported" — Meta's Cloud API doesn't
          // deliver content for certain WhatsApp-native message types at
          // all (view-once/ephemeral photos & videos, polls, deleted
          // messages). This isn't something our webhook can work around: the
          // actual content is never sent to any business integration, by
          // design, for privacy reasons — same limitation every WhatsApp
          // Cloud API integration hits, not a gap in our code. Meta
          // sometimes includes a more specific title/message/details here
          // though,so always surface those instead of a single generic string.
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

/**
 * WhatsApp only ever gives a media *id* for inbound files, not a URL —
 * getting the actual bytes is a two-step dance: GET /{media-id} resolves it
 * to a short-lived (minutes) download URL, which then itself requires the
 * SAME Bearer token to fetch. Re-hosts into the public chatbot-media bucket
 * (see inbound-media.ts) so it doesn't matter that WhatsApp's URL will have
 * expired by the time an admin opens the conversation later.
 *
 * Never throws — parseIncoming must still return the text-based message even
 * if this fails, so a customer's message is never dropped over an image
 * re-hosting hiccup.
 */
async function downloadWhatsAppMedia(mediaId: string, accessToken: string, filename?: string) {
  try {
    const lookup = (await getFromGraphApi(graphApiUrl(mediaId), {
      Authorization: `Bearer ${accessToken}`,
    })) as { url?: string; mime_type?: string; file_size?: number };
    if (!lookup.url) return null;
    return await rehostInboundMedia(lookup.url, "whatsapp", {
      authHeader: `Bearer ${accessToken}`,
      filename,
    });
  } catch (err) {
    console.error(`[adapter:whatsapp] inbound media lookup failed: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Every inbound WhatsApp media type carries its payload the same way — an
 * object with an `id` (and, for documents, a `filename`) — so one table
 * covers them all rather than a branch per type. Previously only `image` was
 * wired up, which meant a customer sending a PDF purchase order, a video of
 * a faulty rig, or a voice note left the admin with placeholder text and no
 * actual file to open.
 */
const MEDIA_MESSAGE_TYPES = ["image", "document", "video", "audio", "sticker"] as const;

export const whatsappAdapter: ChannelAdapter = {
  channelId: "whatsapp",

  async parseIncoming(rawPayload: unknown): Promise<NormalizedMessage | null> {
    const message = extractFirstMessage(rawPayload);
    if (!message) return null;

    // Every media type (image, document, video, audio/voice note, sticker)
    // goes through the same id -> url -> bytes -> re-host path below and ends
    // up as a downloadable file in the admin inbox. Non-media types fall
    // through to descriptive placeholder text.
    let text: string;
    let attachments: { type: string; url: string }[] | undefined;

    if (message.type === "text" && message.text?.body) {
      text = message.text.body;
    } else if ((MEDIA_MESSAGE_TYPES as readonly string[]).includes(message.type)) {
      // Readable placeholder first, so the message is never lost even if the
      // download below fails (expired media id, oversized file, storage
      // hiccup) — the admin still sees that something was sent and what kind.
      if (message.type === "image") {
        text = message.image?.caption ? `[Image] ${message.image.caption}` : "[Customer sent an image]";
      } else if (message.type === "document") {
        text = `[Customer sent a file${message.document?.filename ? `: ${message.document.filename}` : ""}]`;
      } else if (message.type === "video") {
        text = message.video?.caption ? `[Video] ${message.video.caption}` : "[Customer sent a video]";
      } else if (message.type === "audio") {
        text = message.audio?.voice ? "[Customer sent a voice message]" : "[Customer sent an audio file]";
      } else {
        text = "[Customer sent a sticker]";
      }

      const config = getWhatsAppConfig();
      const payload = (message as unknown as Record<string, { id?: string; filename?: string } | undefined>)[
        message.type
      ];

      if (payload?.id && config) {
        const media = await downloadWhatsAppMedia(payload.id, config.accessToken, payload.filename);
        if (media) attachments = [{ type: media.type, url: media.url }];
      }
    } else if (message.type === "location") {
      const loc = message.location;
      text = loc
        ? `[Customer shared a location${loc.name ? `: ${loc.name}` : ""}${
            loc.address ? ` (${loc.address})` : ""
          }${loc.latitude && loc.longitude ? ` — ${loc.latitude}, ${loc.longitude}` : ""}]`
        : "[Customer shared a location]";
    } else if (message.type === "contacts") {
      const names = message.contacts?.map((c) => c.name?.formatted_name).filter(Boolean).join(", ");
      text = names ? `[Customer shared a contact: ${names}]` : "[Customer shared a contact card]";
    } else if (message.type === "reaction") {
      text = message.reaction?.emoji
        ? `[Customer reacted ${message.reaction.emoji} to a message]`
        : "[Customer removed a reaction]";
    } else if (message.type === "button") {
      text = message.button?.text ? `[Customer tapped: ${message.button.text}]` : "[Customer tapped a button]";
    } else if (message.type === "interactive") {
      const choice = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title;
      text = choice ? `[Customer selected: ${choice}]` : "[Customer made an interactive selection]";
    } else if (message.type === "unsupported") {
      // Meta never sends content for these regardless of integration — most
      // often a poll or a deleted message. code 131051 is the generic
      // "unsupported message type" error Meta attaches to this; the detail
      // fields below sometimes narrow it down further, so always surface
      // whatever Meta actually gave us instead of one fixed guess, and log
      // the full raw message so it's inspectable even when Meta's own
      // wording is unhelpful.
      const err = message.errors?.[0];
      const detail = err?.error_data?.details || err?.message || err?.title;
      console.error(`[adapter:whatsapp] unsupported message type from ${message.from}: ${JSON.stringify(message)}`);
      text = detail
        ? `[Customer sent a message type WhatsApp doesn't deliver to businesses. Meta's detail: "${detail}". Ask them to resend as a regular photo/video or plain text.]`
        : "[Customer sent a message type WhatsApp doesn't deliver to businesses — likely a poll or a deleted message. Ask them to resend as a regular photo/video or plain text.]";
    } else {
      console.error(`[adapter:whatsapp] unrecognized message type from ${message.from}: ${JSON.stringify(message)}`);
      text = `[unsupported WhatsApp message type: ${message.type}]`;
    }

    return {
      channel: "whatsapp",
      externalUserId: message.from,
      text,
      timestamp: Number(message.timestamp) * 1000, // WhatsApp sends seconds, not ms
      messageId: message.id,
      ...(attachments ? { attachments } : {}),
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

      const featuresBlock = product.features?.length
        ? `\n\nKey Features:\n${product.features.map((f) => `• ${f}`).join("\n")}`
        : "";
      const withFeatures = `${reply}${featuresBlock}`;
      const body = withFeatures.length > 1000 ? `${withFeatures.slice(0, 997)}...` : withFeatures;

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

    // WhatsApp hard-rejects a text body over 4096 characters, so an unusually
    // long reply would fail the send entirely rather than arriving truncated.
    // Reply length is meant to be governed by the system prompt, not by the
    // token budget (see getLlmApiConfig's max_tokens note), which leaves this
    // as the last line of defence.
    const body = reply.length > 4096 ? `${reply.slice(0, 4093)}...` : reply;
    await postToGraphApi(
      url,
      {
        messaging_product: "whatsapp",
        to: externalUserId,
        type: "text",
        text: { body },
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
