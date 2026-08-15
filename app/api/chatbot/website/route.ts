import { NextRequest } from "next/server";
import { handleWebsiteMessage } from "@/lib/chatbot/website-stream";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * POST /api/chatbot/website — the live chat widget's send endpoint. Public
 * (no admin auth — this is the customer-facing chat), scoped only by a
 * client-generated visitorId (see ChatWidget.tsx). Streams the reply back as
 * plain text chunks; handleWebsiteMessage never throws, so this route never
 * has to translate an error into a broken stream.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: { visitorId?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!visitorId || !message) {
    return new Response("visitorId and message are required", { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`, { status: 400 });
  }

  const stream = await handleWebsiteMessage(visitorId, message);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
