import { NextRequest, NextResponse } from "next/server";
import { findExistingConversation, getMessages } from "@/lib/chatbot/conversation-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/chatbot/website/thread?visitorId=xxx — public, read-only. Lets
 * the widget (a) restore history when a visitor reopens the site, and (b)
 * poll for new messages a human added from the admin inbox after taking
 * over a conversation (handed_off) — the website channel has no persistent
 * connection to push those through, so the widget pulls instead.
 *
 * Scoped only by visitorId, which is an opaque client-generated UUID (see
 * ChatWidget.tsx) — there's nothing sensitive to protect beyond "don't let
 * one visitor enumerate another's conversation", and a random UUID already
 * covers that.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const visitorId = request.nextUrl.searchParams.get("visitorId")?.trim();
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }

  try {
    const conversation = await findExistingConversation("website", visitorId);
    if (!conversation) {
      return NextResponse.json({ status: null, messages: [] });
    }

    const messages = await getMessages(conversation.id);
    return NextResponse.json({
      status: conversation.status,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        provider: m.provider,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error(`[chatbot:website-thread] ${(err as Error).message}`);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }
}
