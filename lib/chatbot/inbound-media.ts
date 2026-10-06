import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { MediaType } from "./types";

// Same cap the admin's own outbound send-media route uses — WhatsApp's own
// image/document limit, and a sane ceiling regardless of channel.
const MAX_INBOUND_MEDIA_BYTES = 16 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  // Images
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
  "image/svg+xml": ".svg",
  // Documents
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/rtf": ".rtf",
  "application/zip": ".zip",
  "application/x-rar-compressed": ".rar",
  "application/x-7z-compressed": ".7z",
  "application/json": ".json",
  // Video
  "video/mp4": ".mp4",
  "video/3gpp": ".3gp",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-matroska": ".mkv",
  // Audio / voice notes
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/ogg": ".ogg",
  "audio/opus": ".opus",
  "audio/amr": ".amr",
  "audio/wav": ".wav",
  "audio/aac": ".aac",
};

/**
 * Keeps the customer's original filename as the LAST path segment, so the
 * public URL ends in e.g. ".../purchase-order.pdf". That matters because the
 * admin inbox's download button and every browser's own "Save link as" both
 * take the filename from the URL — without this a customer's invoice saves
 * as a bare UUID with no extension, which Windows and Android then refuse to
 * open with anything sensible.
 *
 * Uniqueness comes from the timestamp+uuid directory above it, so two people
 * sending "invoice.pdf" never collide despite sharing a filename.
 */
function safeFileName(filename: string | undefined, fallbackExt: string): string {
  const fallback = `file${fallbackExt}`;
  if (!filename) return fallback;

  // Strip any directory components a platform might include, then reduce to
  // characters that are safe in both a storage key and a URL.
  const base = filename.split(/[/\\]/).pop() ?? "";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[._]+/, "")
    .slice(0, 100);

  if (!cleaned || cleaned === "." || !/[a-zA-Z0-9]/.test(cleaned)) return fallback;
  // Append the content-type's extension when the supplied name has none.
  return /\.[a-zA-Z0-9]{1,8}$/.test(cleaned) ? cleaned : `${cleaned}${fallbackExt}`;
}

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
  opts: { authHeader?: string; filename?: string } = {}
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

    // Only true images render inline in the admin thread; everything else —
    // PDFs, Office files, video, voice notes, archives — is a "document",
    // which the inbox shows as a named, downloadable file.
    const mediaType: MediaType = contentType.startsWith("image/") ? "image" : "document";
    const ext = EXT_BY_MIME[contentType] ?? "";
    // Unique directory, human-readable filename — see safeFileName above.
    const path = `inbound/${channel}/${Date.now()}-${randomUUID()}/${safeFileName(opts.filename, ext)}`;

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
