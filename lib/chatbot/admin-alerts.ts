import { Resend } from "resend";
import { ADMIN_EMAILS } from "../adminAuth";

/**
 * Shared admin-notification plumbing for the chatbot — currently email only
 * (SMS/WhatsApp-to-self channels are a later discussion). Both handoff.ts
 * (customer explicitly asked for a human) and watchlist.ts (a number on the
 * watchlist sent any message) funnel through here so there's exactly one
 * place that knows how to reach the admin.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Internal channel value -> the per-channel dashboard's URL segment (see
// app/admin/chatbot/[channel]/page.tsx's ROUTE_TO_CHANNEL, the inverse of
// this map — "messenger" is the internal name, "facebook" is what the URL
// and card label use).
const CHANNEL_TO_ROUTE: Record<string, string> = {
  whatsapp: "whatsapp",
  messenger: "facebook",
  instagram: "instagram",
  website: "website",
};

function inboxLink(channel: string): string {
  const route = CHANNEL_TO_ROUTE[channel];
  return route ? `https://www.rigbuilders.in/admin/chatbot/${route}` : `https://www.rigbuilders.in/admin/chatbot`;
}

/**
 * Never throws — a failed notification should never take down the reply
 * pipeline; worst case the admin just finds the conversation in
 * /admin/chatbot without having been emailed about it.
 */
async function sendAdminEmail(subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn("[chatbot:admin-alerts] RESEND_API_KEY not set — skipping admin alert email.");
    return;
  }

  try {
    await resend.emails.send({
      from: "Rig Builders Chatbot <support@rigbuilders.in>",
      to: ADMIN_EMAILS,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[chatbot:admin-alerts] send failed: ${(err as Error).message}`);
  }
}

export async function notifyAdminOfHandoff(params: {
  channel: string;
  externalUserId: string;
  message: string;
}): Promise<void> {
  await sendAdminEmail(
    `A customer asked for a human — ${params.channel}`,
    `<p>A customer on <strong>${params.channel}</strong> (${params.externalUserId}) asked to talk to a person, ` +
      `so the bot has paused itself on this conversation.</p>` +
      `<p><strong>Their message:</strong> ${params.message}</p>` +
      `<p><a href="${inboxLink(params.channel)}">Open the chatbot inbox</a></p>`
  );
}

/**
 * A customer asked for a quotation covering multiple products, but at least
 * one couldn't be confidently matched to an in-stock catalog item — the bot
 * told them "we'll check availability and follow up" instead of guessing,
 * and this is that follow-up trigger: it tells the admin exactly what was
 * asked for and which part(s) need manual checking, so a human can actually
 * send the real quotation once availability's confirmed.
 */
export async function notifyAdminOfQuotationRequest(params: {
  channel: string;
  externalUserId: string;
  requestedTerms: string[];
  missingTerms: string[];
}): Promise<void> {
  await sendAdminEmail(
    `Quotation request needs checking — ${params.channel}`,
    `<p><strong>${params.externalUserId}</strong> on <strong>${params.channel}</strong> asked for a quotation covering:</p>` +
      `<ul>${params.requestedTerms.map((t) => `<li>${t}</li>`).join("")}</ul>` +
      `<p>Couldn't confidently match or confirm stock for:</p>` +
      `<ul>${params.missingTerms.map((t) => `<li><strong>${t}</strong></li>`).join("")}</ul>` +
      `<p>The bot told them we're checking availability and will follow up — please verify stock and send the quotation manually.</p>` +
      `<p><a href="${inboxLink(params.channel)}">Open the chatbot inbox</a></p>`
  );
}

export async function notifyWatchedNumberMessage(params: {
  channel: string;
  externalUserId: string;
  label: string | null;
  message: string;
}): Promise<void> {
  await sendAdminEmail(
    `Watched number messaged you — ${params.channel}${params.label ? ` (${params.label})` : ""}`,
    `<p><strong>${params.externalUserId}</strong> on <strong>${params.channel}</strong> just sent a message. ` +
      `This number is on your watchlist${params.label ? ` ("${params.label}")` : ""}, so you're being notified ` +
      `regardless of what they said — the bot will still reply normally unless you pause it.</p>` +
      `<p><strong>Their message:</strong> ${params.message}</p>` +
      `<p><a href="${inboxLink(params.channel)}">Open the chatbot inbox</a></p>`
  );
}
