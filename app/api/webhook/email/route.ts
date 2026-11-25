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
  /** When the mail was received. Only sent by the backlog workflow. */
  receivedAt?: string;
  /** True when this is a catch-up on mail that was never answered. */
  backfill?: boolean;
  /** Classify and report what WOULD be sent, without sending it. */
  dryRun?: boolean;
}

/**
 * Anything left this long deserves acknowledging rather than a reply that
 * acts as though it arrived this morning.
 */
const APOLOGY_AFTER_DAYS = 7;

const BACKLOG_APOLOGY =
  "Apologies for the delayed reply — your message sat unanswered longer than it should have, and we're sorry about that.";

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / 86_400_000;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** "Name <a@b.com>" -> "a@b.com". The address is the stable identity. */
function extractAddress(from: string): string | null {
  const angled = from.match(/<([^>]+)>/);
  const candidate = (angled ? angled[1] : from).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ---- One-time discovery mode -------------------------------------------
  // Hostinger's OpenAPI spec documents how to CREATE a webhook but not the
  // shape of what it delivers, nor which header carries the signature. Set
  // EMAIL_WEBHOOK_DEBUG=true, press Test on the Hostinger webhook screen, and
  // the headers and body appear in the Vercel logs — then the real handler
  // can be written against the actual payload instead of a guess.
  //
  // Nothing is processed and no mail is sent in this mode. TURN IT OFF once
  // the shape is known: it accepts unauthenticated requests by design.
  if (process.env.EMAIL_WEBHOOK_DEBUG === "true") {
    const raw = await req.text().catch(() => "");
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      // Header values can themselves be secrets, so log names in full and
      // values truncated — enough to identify a signature header without
      // writing the signature itself to a log that others can read.
      headers[key] = value.length > 80 ? `${value.slice(0, 80)}…` : value;
    });

    console.log(`[webhook:email] DISCOVERY headers: ${JSON.stringify(headers, null, 2)}`);
    console.log(`[webhook:email] DISCOVERY body: ${raw.slice(0, 4000)}`);

    return NextResponse.json({ status: "ok", discovery: true });
  }

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

    // null means excluded, spam, or a human already owns this thread —
    // recorded in the inbox either way, so n8n should still mark it
    // processed. Importantly this is also how the backlog run stays silent
    // on old marketing mail: spam is spam whether it's an hour or a month
    // old, and apologising to a cold pitch would be worse than ignoring it.
    if (!reply) return NextResponse.json({ status: "ok", replied: false, reason: "no reply required" });

    // Old mail gets the apology in front of whatever the normal answer is,
    // rather than a separate message or a different pipeline.
    const age = daysSince(payload?.receivedAt);
    const overdue = age !== null && age >= APOLOGY_AFTER_DAYS;
    const outText = overdue ? `${BACKLOG_APOLOGY}\n\n${reply.text}` : reply.text;

    // Dry run exists because the first backlog pass is the risky one: it can
    // touch hundreds of threads at once, and seeing what would go out beats
    // discovering it in the sent folder.
    if (payload?.dryRun) {
      return NextResponse.json({
        status: "ok",
        dryRun: true,
        wouldSendTo: address,
        ageDays: age !== null ? Math.round(age) : null,
        apologyAdded: overdue,
        preview: outText.slice(0, 500),
      });
    }

    const sent = await sendEmailReply({
      to: address,
      subject: subject ? `Re: ${subject}` : "Your Rig Builders enquiry",
      text: outText,
      inReplyTo: payload?.messageId,
      attachmentUrl: reply.media?.url,
    });

    return NextResponse.json({ status: "ok", replied: sent, apologyAdded: overdue });
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
