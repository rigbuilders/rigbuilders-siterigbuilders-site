import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateConversationStatus } from "@/lib/chatbot/conversation-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chatbot/conversations/:id — full message thread for one
 * conversation, oldest first, for the admin inbox detail view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const { id } = await params;

  const { data: conversation, error: convError } = await supabaseAdmin
    .from("chatbot_conversations")
    .select(
      `id, channel, status, updated_at, created_at,
       chatbot_users ( display_name, channel_identities )`
    )
    .eq("id", id)
    .maybeSingle();

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: messages, error: msgError } = await supabaseAdmin
    .from("chatbot_messages")
    .select("id, role, content, provider, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ conversation, messages: messages ?? [] });
}

/**
 * PATCH /api/admin/chatbot/conversations/:id — update status
 * (active = bot auto-replies, handed_off = paused for this conversation
 * only, closed = archived). Body: { status: "active" | "handed_off" | "closed" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;

  if (!["active", "handed_off", "closed"].includes(status)) {
    return NextResponse.json({ error: "status must be active, handed_off, or closed" }, { status: 400 });
  }

  try {
    await updateConversationStatus(id, status);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
