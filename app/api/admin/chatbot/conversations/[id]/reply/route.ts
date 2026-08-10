import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { appendMessage, updateConversationStatus } from "@/lib/chatbot/conversation-store";
import { whatsappAdapter } from "@/lib/chatbot/adapters/whatsapp";
import { messengerAdapter } from "@/lib/chatbot/adapters/messenger";
import { instagramAdapter } from "@/lib/chatbot/adapters/instagram";
import type { ChannelAdapter } from "@/lib/chatbot/types";

export const dynamic = "force-dynamic";

const ADAPTERS: Record<string, ChannelAdapter> = {
  whatsapp: whatsappAdapter,
  messenger: messengerAdapter,
  instagram: instagramAdapter,
};

/**
 * POST /api/admin/chatbot/conversations/:id/reply — a human sends a manual
 * message from the admin inbox. Sends via the same Graph API the bot uses,
 * records it (role: assistant, provider: "human" so it's visually
 * distinguishable from LLM replies), and automatically marks the
 * conversation handed_off so the bot doesn't also jump in right after.
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
  const body = await req.json().catch(() => null);
  const text: string | undefined = body?.text;

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
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

  const adapter = ADAPTERS[conversation.channel];
  const externalUserId = conversation.chatbot_users?.channel_identities?.[conversation.channel];

  if (!adapter || !externalUserId) {
    return NextResponse.json(
      { error: `Cannot send: unknown channel or missing external user id (${conversation.channel})` },
      { status: 400 }
    );
  }

  try {
    await adapter.sendReply(externalUserId, text);
    await appendMessage(id, "assistant", text, "human");
    await updateConversationStatus(id, "handed_off");
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
