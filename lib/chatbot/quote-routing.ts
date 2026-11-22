import { getTelegramConfig, getWhatsAppConfig } from "./config";
import { graphApiUrl, postToGraphApi } from "./adapters/meta-graph-client";

/**
 * Where a quotation request goes when the bot can't finish it itself.
 *
 * Two kinds of alert, both going to the same people:
 *   - named parts we don't stock      -> needs sourcing or pricing by hand
 *   - a vague build ("gaming pc 1L")  -> needs someone to spec it
 *
 * ON WHATSAPP DELIVERY: the Cloud API will not let a business message an
 * arbitrary number out of the blue. Free-form sends only work inside the
 * 24-hour window opened by that number messaging us first; anything else
 * needs a pre-approved Message Template and is billed per send.
 *
 * So these alerts go to Telegram by default, which works today, costs
 * nothing, and is already where the team is watching. Set
 * QUOTE_ALERT_TEMPLATE to an approved template name and the WhatsApp send
 * switches on as well — the code is ready, it just can't be enabled from our
 * side alone.
 */

/**
 * Both alert types go to both numbers — a missing part and a finished build
 * brief are each a lead someone has to act on, and splitting them by
 * recipient only creates a gap when one person is unavailable.
 *
 * Override with QUOTE_ALERT_PHONES as a comma-separated list.
 */
const DEFAULT_ALERT_PHONES = ["917986553947", "917814389247"];

function alertNumbers(): string[] {
  const configured = process.env.QUOTE_ALERT_PHONES?.trim();
  if (!configured) return DEFAULT_ALERT_PHONES;

  // Digits only — the Graph API rejects "+", spaces and hyphens.
  return configured
    .split(",")
    .map((n) => n.replace(/\D/g, ""))
    .filter(Boolean);
}

async function sendTelegram(text: string): Promise<boolean> {
  const config = getTelegramConfig();
  if (!config) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (err) {
    console.error(`[chatbot:quote-routing] telegram send failed: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Template send to an ops phone. Only fires when QUOTE_ALERT_TEMPLATE names
 * an approved template with a single body parameter — without one Meta
 * rejects the send, so attempting it unconditionally would just log errors
 * on every lead.
 */
async function sendWhatsAppTemplate(toNumber: string, body: string): Promise<boolean> {
  const templateName = process.env.QUOTE_ALERT_TEMPLATE?.trim();
  const config = getWhatsAppConfig();
  if (!templateName || !toNumber || !config) return false;

  try {
    await postToGraphApi(
      graphApiUrl(`${config.phoneId}/messages`),
      {
        messaging_product: "whatsapp",
        to: toNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.QUOTE_ALERT_TEMPLATE_LANG?.trim() || "en" },
          components: [
            {
              type: "body",
              // Newlines are not allowed in template parameters, so the
              // multi-line summary is flattened for this one transport.
              parameters: [{ type: "text", text: body.replace(/\n+/g, " · ").slice(0, 1000) }],
            },
          ],
        },
      },
      { Authorization: `Bearer ${config.accessToken}` }
    );
    return true;
  } catch (err) {
    console.error(`[chatbot:quote-routing] whatsapp template send failed: ${(err as Error).message}`);
    return false;
  }
}

async function dispatch(text: string): Promise<void> {
  const numbers = alertNumbers();

  // Telegram is one message to the shared chat; WhatsApp is one per number.
  // Sent in parallel because a slow send to one recipient shouldn't delay
  // the others, and every path already swallows its own failures.
  const results = await Promise.all([
    sendTelegram(text),
    ...numbers.map((number) => sendWhatsAppTemplate(number, text)),
  ]);

  if (!results.some(Boolean)) {
    // Loud, because this is a lead that reached nobody at all.
    console.error(`[chatbot:quote-routing] NO DELIVERY PATH for alert:\n${text}`);
  }
}

/**
 * The customer named specific parts and at least one isn't in the catalogue.
 * Someone needs to price or source them by hand.
 */
export async function routeUnmatchedParts(params: {
  channel: string;
  customer: string;
  requested: string[];
  missing: string[];
}): Promise<void> {
  const text =
    `QUOTE — PARTS TO SOURCE\n` +
    `Channel: ${params.channel}\n` +
    `Customer: ${params.customer}\n\n` +
    `Asked for:\n${params.requested.map((t) => `• ${t}`).join("\n")}\n\n` +
    `Not in catalogue:\n${params.missing.map((t) => `• ${t}`).join("\n")}`;

  await dispatch(text);
}

/**
 * The customer wants a build rather than named parts — "a gaming PC under 1
 * lakh". Goes to the builds number with whatever the questionnaire gathered,
 * so whoever picks it up isn't starting from a one-line request.
 */
export async function routeBuildRequest(params: {
  channel: string;
  customer: string;
  briefSummary: string;
  originalMessage: string;
}): Promise<void> {
  const text =
    `QUOTE — CUSTOM BUILD\n` +
    `Channel: ${params.channel}\n` +
    `Customer: ${params.customer}\n\n` +
    `Their words: ${params.originalMessage}\n\n` +
    `Brief:\n${params.briefSummary || "(nothing captured)"}`;

  await dispatch(text);
}
