import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { appendMessage, updateConversationStatus } from "@/lib/chatbot/conversation-store";
import { whatsappAdapter } from "@/lib/chatbot/adapters/whatsapp";
import { messengerAdapter } from "@/lib/chatbot/adapters/messenger";
import { instagramAdapter } from "@/lib/chatbot/adapters/instagram";
import type { ChannelAdapter, MediaType } from "@/lib/chatbot/types";

export const dynamic = "force-dynamic";

const ADAPTERS: Record<string, ChannelAdapter> = {
  whatsapp: whatsappAdapter,
  messenger: messengerAdapter,
  instagram: instagramAdapter,
};

const MAX_BYTES = 16 * 1024 * 1024; // WhatsApp's own image/document cap

function guessMediaType(mimeType: string): MediaType {
  return mimeType.startsWith("image/") ? "image" : "document";
}

/**
 * POST /api/admin/chatbot/conversations/:id/send-media — a human sends an
 * image or document from the admin inbox. multipart/form-data body:
 * `file` (required), `caption` (optional text).
 *
 * Uploads to the public chatbot-media Supabase Storage bucket first (see
 * security/chatbot_media.sql — must be run once before this route works),
 * then sends the resulting public URL to the platform via the same
 * "send by link" mechanism WhatsApp/Messenger/Instagram all support, so
 * there's no separate "upload to Meta" round trip.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const { id } = await params;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const caption = (form?.get("caption") as string | null)?.trim() || undefined;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large — max ${MAX_BYTES / 1024 / 1024}MB` }, { status: 400 });
  }

  const { data: conversation, error: convError } = await supabaseAdmin
    .from("chatbot_conversations")
    .select(`id, channel, chatbot_users ( channel_identities )`)
    .eq("id", id)
    .maybeSingle<{
      id: string;
      channel: string;
      chatbot_users: { channel_identities: Record<string, string> } | null;
    }>();

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const mediaType = guessMediaType(file.type || "application/octet-stream");
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const path = `${conversation.channel}/${id}/${Date.now()}-${crypto.randomUUID()}${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("chatbot-media")
    .upload(path, await file.arrayBuffer(), { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}. Have you run security/chatbot_media.sql yet?` },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from("chatbot-media").getPublicUrl(path);
  const mediaUrl = publicUrlData.publicUrl;
  const content = caption || (mediaType === "image" ? "[Image]" : `[File: ${file.name}]`);

  // Website channel has no Graph API to call — just persist it, same as the
  // text reply route's website branch. Rendering it in the widget itself is
  // a separate, not-yet-built piece of work.
  if (conversation.channel === "website") {
    try {
      await appendMessage(id, "assistant", content, "human", { url: mediaUrl, type: mediaType });
      await updateConversationStatus(id, "handed_off");
      return NextResponse.json({ status: "ok", mediaUrl });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  const adapter = ADAPTERS[conversation.channel];
  const externalUserId = conversation.chatbot_users?.channel_identities?.[conversation.channel];

  if (!adapter?.sendMedia || !externalUserId) {
    return NextResponse.json(
      { error: `Cannot send media: unknown channel or missing external user id (${conversation.channel})` },
      { status: 400 }
    );
  }

  try {
    await adapter.sendMedia(externalUserId, mediaUrl, mediaType, caption);
    await appendMessage(id, "assistant", content, "human", { url: mediaUrl, type: mediaType });
    await updateConversationStatus(id, "handed_off");
    return NextResponse.json({ status: "ok", mediaUrl });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
