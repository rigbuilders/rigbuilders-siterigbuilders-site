import { getInstagramConfig } from "../config";
import type { ChannelAdapter, MediaType, NormalizedMessage, ReplyMeta } from "../types";
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

  // Instagram DMs don't reliably support button/template attachments the
  // way Messenger does (see the TODO above about Instagram's Graph API
  // endpoints shifting a lot) — rather than risk the whole send failing on
  // an unsupported message type, a CTA here just gets appended as a plain
  // link in the text. Always works, just isn't a tappable button.
  async sendReply(externalUserId: string, reply: string, meta?: ReplyMeta): Promise<void> {
    const config = getInstagramConfig();
    if (!config) {
      throw new Error(
        "Instagram is not configured: set META_VERIFY_TOKEN and INSTAGRAM_ACCESS_TOKEN."
      );
    }

    const path = config.businessId ? `${config.businessId}/messages` : "me/messages";
    const url = `${graphApiUrl(path)}?access_token=${encodeURIComponent(config.accessToken)}`;

    // Rich product card: attempt the same generic template Messenger uses
    // (IG DMs ride the same underlying Send API). Deliberately one button
    // only — "View Details" — same product decision as WhatsApp/Messenger:
    // one option, not three. Genuinely unverified whether Instagram's Graph
    // API accepts generic templates the way Messenger's does — per the TODO
    // above, IG's messaging endpoints have shifted more than Messenger's
    // historically. Falls back to plain text with the link appended if the
    // template send throws, so a customer never gets silence over an
    // unsupported message type.
    if (meta?.product) {
      const { product } = meta;
      const title = product.name.length > 80 ? `${product.name.slice(0, 77)}...` : product.name;
      const subtitle = `₹${product.price.toLocaleString("en-IN")}`;

      try {
        await postToGraphApi(url, {
          recipient: { id: externalUserId },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: [
                  {
                    title,
                    subtitle,
                    ...(product.imageUrl ? { image_url: product.imageUrl } : {}),
                    buttons: [{ type: "web_url", url: product.productUrl, title: "View Details" }],
                  },
                ],
              },
            },
          },
        });
        await postToGraphApi(url, {
          recipient: { id: externalUserId },
          message: { text: reply },
        });
        return;
      } catch (err) {
        console.error(
          `[adapter:instagram] generic template send failed, falling back to plain text: ${(err as Error).message}`
        );
        const fallbackText = `${reply}\n\nView Details: ${product.productUrl}`;
        await postToGraphApi(url, {
          recipient: { id: externalUserId },
          message: { text: fallbackText },
        });
        return;
      }
    }

    const text = meta?.ctaUrl ? `${reply}\n\n${meta.ctaLabel ?? "View Details"}: ${meta.ctaUrl}` : reply;

    await postToGraphApi(url, {
      recipient: { id: externalUserId },
      message: { text },
    });
  },

  /**
   * Sends an image by public URL. Note: Instagram DMs via the Graph API only
   * reliably support image/video attachments, not arbitrary documents — if
   * mediaType is "document" this still attempts type "file" for parity with
   * the other adapters, but Meta may reject it depending on the account;
   * that's an Instagram platform limitation, not a bug here.
   */
  async sendMedia(externalUserId: string, mediaUrl: string, mediaType: MediaType): Promise<void> {
    const config = getInstagramConfig();
    if (!config) {
      throw new Error("Instagram is not configured: set META_VERIFY_TOKEN and INSTAGRAM_ACCESS_TOKEN.");
    }

    const path = config.businessId ? `${config.businessId}/messages` : "me/messages";
    const url = `${graphApiUrl(path)}?access_token=${encodeURIComponent(config.accessToken)}`;
    await postToGraphApi(url, {
      recipient: { id: externalUserId },
      message: {
        attachment: {
          type: mediaType === "image" ? "image" : "file",
          payload: { url: mediaUrl, is_reusable: true },
        },
      },
    });
  },
};
