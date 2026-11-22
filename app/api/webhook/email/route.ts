import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { handleMessage } from "@/lib/chatbot/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/webhook/email — a quotation email, handed over by the local n8n
 * workflow that polls Gmail.
 *
 * THE SPLIT: n8n does ingestion only — poll, strip the quoted reply chain,
 * post here. Everything that decides anything (catalogue lookup, the
 * distributor round-trip, PDF generation, escalation) stays server-side with
 * the other channels. Email is slower than chat but it must not become a
 * second, divergent copy of the quotation logic.
 *
 * Expected body:
 *   {
 *     "from":      "customer@example.com",
 *     "subject":   "Quote for a build",
 *     "body":      "plain text, reply chain already stripped",
 *     "messageId": "<CAF...@mail.gmail.com>",
 *     "threadId":  "18f2a..."
 *   }
 *
 * Auth: X-Webhook-Secret must match EMAIL_WEBHOOK_SECRET. This endpoint can
 * send mail to customers, so it is never left open.
 */

interface EmailPayload {
  from?: string;
  subject?: string;
  body?: string;
  messageId?: string;
  threadId?: string;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** "Name <a@b.com>" -> "a@b.com". The address is the stable identity. */
function extractAddress(from: string): string | null {
  const angled = from.match(/<([^>]+)>/);
  const candidate = (angled ? angled[1] : from).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.EMAIL_WEBHOOK_SECRET;
  if (!expected || req.headers.get("x-webhook-secret") !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (await req.json().catch(() => null)) as EmailPayload | null;
  const address = payload?.from ? extractAddress(payload.from) : null;
  const body = payload?.body?.trim();

  if (!address || !body) {
    return NextResponse.json({ error: "from and body are required" }, { status: 400 });
  }

  // The subject usually carries the actual ask ("Quote for RTX 5060 build")
  // while the body is pleasantries, so both go to the assistant.
  const subject = payload?.subject?.trim();
  const text = subject && !body.startsWith(subject) ? `${subject}\n\n${body}` : body;

  try {
    const reply = await handleMessage({
      channel: "email",
      externalUserId: address,
      text,
      timestamp: Date.now(),
      messageId: payload?.messageId,
    });

    // null means excluded, or a human already owns this thread — recorded in
    // the inbox either way, so n8n should still mark the mail processed.
    if (!reply) return NextResponse.json({ status: "ok", replied: false });

    const sent = await sendEmailReply({
      to: address,
      subject: subject ? `Re: ${subject}` : "Your Rig Builders enquiry",
      text: reply.text,
      inReplyTo: payload?.messageId,
      attachmentUrl: reply.media?.url,
    });

    return NextResponse.json({ status: "ok", replied: sent });
  } catch (err) {
    console.error(`[webhook:email] failed for ${address}: ${(err as Error).message}`);
    // 500 so n8n can retry rather than marking the mail handled — losing a
    // quotation request silently is the worst outcome here.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function sendEmailReply(params: {
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  attachmentUrl?: string;
}): Promise<boolean> {
  if (!resend) {
    console.error("[webhook:email] RESEND_API_KEY not set — reply not sent");
    return false;
  }

  try {
    // Threading headers so the reply lands in the customer's existing thread
    // rather than starting a new one they have to connect themselves.
    const headers = params.inReplyTo
      ? { "In-Reply-To": params.inReplyTo, References: params.inReplyTo }
      : undefined;

    const attachments = params.attachmentUrl
      ? [{ filename: "RigBuilders-Quotation.pdf", path: params.attachmentUrl }]
      : undefined;

    await resend.emails.send({
      from: "Rig Builders <info@rigbuilders.in>",
      to: params.to,
      subject: params.subject,
      text: params.text,
      ...(headers ? { headers } : {}),
      ...(attachments ? { attachments } : {}),
    });
    return true;
  } catch (err) {
    console.error(`[webhook:email] send failed: ${(err as Error).message}`);
    return false;
  }
}

/** Liveness check, so the n8n workflow can be verified before going live. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, configured: Boolean(process.env.EMAIL_WEBHOOK_SECRET && resend) });
}
