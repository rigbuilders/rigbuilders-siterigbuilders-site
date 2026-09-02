import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { MediaType } from "./types";

// Same cap the admin's own outbound send-media route uses — WhatsApp's own
// image/document limit, and a sane ceiling regardless of channel.
const MAX_INBOUND_MEDIA_BYTES = 16 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

/**
 * Downloads a piece of inbound customer media (from a WhatsApp/Messenger/
 * Instagram webhook) and re-uploads it into the same public `chatbot-media`
 * Supabase Storage bucket the admin's own outbound media already uses (see
 * app/api/admin/chatbot/conversations/[id]/send-media/route.ts) — under an
 * `inbound/` prefix so outbound and inbound files never collide. That's what
 * lets the admin inbox (ChannelChatDashboard.tsx) render it as a plain
 * `<img src>`/link exactly like everything else, no special-casing needed
 * there.
 *
 * Always re-hosts rather than storing the platform's own URL directly:
 * WhatsApp's media URLs are short-lived (expire in minutes) and require an
 * auth header to fetch at all, and Messenger/Instagram's CDN URLs aren't
 * guaranteed to still be reachable by the time an admin opens the
 * conversation later. Re-hosting once, right when the webhook fires, avoids
 * both problems.
 *
 * Never throws — a failure here should never break the rest of the inbound
 * pipeline (the message still gets saved with its placeholder text either
 * way, just without an image attached). Returns null on any failure.
 */
export async function rehostInboundMedia(
  sourceUrl: string,
  channel: string,
  opts: { authHeader?: string } = {}
): Promise<{ url: string; type: MediaType } | null> {
  try {
    const response = await fetch(
      sourceUrl,
      opts.authHeader ? { headers: { Authorization: opts.authHeader } } : undefined
    );
    if (!response.ok) {
      console.error(`[chatbot:inbound-media] fetch failed (${response.status}) for channel "${channel}"`);
      return null;
    }

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      console.error(`[chatbot:inbound-media] empty response body for channel "${channel}"`);
      return null;
    }
    if (buffer.byteLength > MAX_INBOUND_MEDIA_BYTES) {
      console.error(
        `[chatbot:inbound-media] ${buffer.byteLength} bytes exceeds the ${MAX_INBOUND_MEDIA_BYTES} byte cap for channel "${channel}"`
      );
      return null;
    }

    const mediaType: MediaType = contentType.startsWith("image/") ? "image" : "document";
    const ext = EXT_BY_MIME[contentType] ?? "";
    const path = `inbound/${channel}/${Date.now()}-${randomUUID()}${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("chatbot-media")
      .upload(path, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error(`[chatbot:inbound-media] upload failed for channel "${channel}": ${uploadError.message}`);
      return null;
    }

    const { data } = supabaseAdmin.storage.from("chatbot-media").getPublicUrl(path);
    return { url: data.publicUrl, type: mediaType };
  } catch (err) {
    console.error(`[chatbot:inbound-media] rehost failed for channel "${channel}": ${(err as Error).message}`);
    return null;
  }
}
