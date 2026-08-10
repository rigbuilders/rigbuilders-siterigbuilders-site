import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface ConversationListRow {
  id: string;
  channel: string;
  status: string;
  updated_at: string;
  created_at: string;
  chatbot_users: { display_name: string | null; channel_identities: Record<string, string> } | null;
  chatbot_messages: { content: string; role: string; created_at: string }[];
}

/**
 * GET /api/admin/chatbot/conversations — inbox list for the admin portal.
 * Returns each conversation with its user info and last message, newest first.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("chatbot_conversations")
    .select(
      `id, channel, status, updated_at, created_at,
       chatbot_users ( display_name, channel_identities ),
       chatbot_messages ( content, role, created_at )`
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ConversationListRow[];

  const conversations = rows.map((row) => {
    const lastMessage = [...(row.chatbot_messages ?? [])].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1
    )[0];

    return {
      id: row.id,
      channel: row.channel,
      status: row.status,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      externalUserId: row.chatbot_users?.channel_identities?.[row.channel] ?? "unknown",
      displayName: row.chatbot_users?.display_name ?? null,
      lastMessage: lastMessage
        ? { content: lastMessage.content, role: lastMessage.role, createdAt: lastMessage.created_at }
        : null,
    };
  });

  return NextResponse.json({ conversations });
}
