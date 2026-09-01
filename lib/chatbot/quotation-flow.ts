import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { findRelevantProducts } from "./product-knowledge";
import { generateQuotationPDF, type QuotationItem } from "./quotation-pdf";
import { generateReply } from "./llm/router";
import { appendMessage } from "./conversation-store";
import { notifyAdminOfQuotationRequest } from "./admin-alerts";
import type { NormalizedMessage } from "./types";

/**
 * Multi-product quotation flow: customer asks for pricing on several named
 * products at once ("quote me a 7800X3D, an RTX 5060, and 32GB of RAM") ->
 * every product gets looked up and checked against the live catalog -> if
 * everything's found and in stock, a branded PDF quotation (quotation-pdf.ts)
 * is generated and sent as a document; if anything's missing or out of
 * stock, the customer gets a "we're checking availability" holding reply and
 * the admin gets an email naming exactly what still needs manual checking
 * (admin-alerts.ts's notifyAdminOfQuotationRequest).
 *
 * Deliberately separate from the normal single-product reply path in
 * orchestrator.ts (findMentionedProduct etc.) — that path answers a
 * conversational question about one product; this one is triggered
 * explicitly for "give me a quote/price list" requests and always resolves
 * every named product against the database itself, never trusting an LLM's
 * idea of a price.
 */

export interface QuotationResult {
  text: string;
  media?: { url: string; type: "document"; caption?: string };
}

const QUOTATION_SIGNAL = /\b(quote|quotation|price\s*list|pricing)\b/i;

/**
 * Cheap pre-filter so a plain "what's the price of the 7800X3D" (a single
 * product — handled fine by the existing conversational flow) or an
 * unrelated message doesn't pay for an extra LLM call just to find out it
 * wasn't a quotation request. Not perfectly precise on its own — the actual
 * decision is "did extraction find 2+ distinct products," which runs next.
 */
function looksLikeQuotationRequest(text: string): boolean {
  if (QUOTATION_SIGNAL.test(text)) return true;
  const mentionsPriceOrCost = /\b(price|cost|prices|costs)\b/i.test(text);
  const mentionsMultipleItems = /,| and |\+/i.test(text);
  return Boolean(mentionsPriceOrCost && mentionsMultipleItems);
}

const EXTRACTION_PROMPT =
  "You extract a shopping list from a customer's message for a PC parts store. " +
  "Read the customer's message and output ONLY a JSON array of short product search terms — " +
  'one per distinct product they want priced/quoted, e.g. ["ryzen 7 7800x3d", "rtx 5060", "32gb ddr5 ram"]. ' +
  "No other text, no markdown, no code fences — just the raw JSON array. " +
  "If the message isn't asking for pricing on specific products, output [].";

async function extractQuotationTerms(userMessage: string): Promise<string[]> {
  try {
    const { text } = await generateReply(EXTRACTION_PROMPT, [], userMessage);
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
      .map((term) => term.trim());
  } catch (err) {
    console.error(`[chatbot:quotation] term extraction failed: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Returns null when this message isn't (or doesn't resolve to) a
 * multi-product quotation request — the caller should fall through to the
 * normal reply flow in that case, exactly as if this function didn't exist.
 */
export async function tryHandleQuotationRequest(
  msg: NormalizedMessage,
  conversationId: string
): Promise<QuotationResult | null> {
  if (!looksLikeQuotationRequest(msg.text)) return null;

  const terms = await extractQuotationTerms(msg.text);
  if (terms.length < 2) return null; // a single product is the normal flow's job, not this one's

  const matched: QuotationItem[] = [];
  const missing: string[] = [];

  for (const term of terms) {
    const candidates = await findRelevantProducts(term, 1);
    const best = candidates[0];
    if (best && best.in_stock) {
      matched.push({
        name: best.breadcrumb_name?.trim() || best.name,
        price: best.price,
        category: best.category,
      });
    } else {
      missing.push(term);
    }
  }

  if (missing.length > 0) {
    console.log(
      `[chatbot:quotation] holding reply — requested: ${terms.join(", ")} — unresolved/out of stock: ${missing.join(", ")}`
    );
    await notifyAdminOfQuotationRequest({
      channel: msg.channel,
      externalUserId: msg.externalUserId,
      requestedTerms: terms,
      missingTerms: missing,
    });
    const holdingReply =
      "Let us check the availability of the products — we'll send you the quotation soon. Have any other queries?";
    await appendMessage(conversationId, "assistant", holdingReply, "quotation-pending");
    return { text: holdingReply };
  }

  try {
    const pdf = await generateQuotationPDF(matched);
    const path = `quotations/${conversationId}/${Date.now()}-quotation.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("chatbot-media")
      .upload(path, pdf, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("chatbot-media").getPublicUrl(path);
    const pdfUrl = publicUrlData.publicUrl;

    const replyText =
      "Here's your quotation with the latest pricing — let me know if you'd like to proceed or need anything adjusted!";
    await appendMessage(conversationId, "assistant", replyText, "quotation", { url: pdfUrl, type: "document" });

    return {
      text: replyText,
      media: { url: pdfUrl, type: "document", caption: "Rig Builders — Quotation" },
    };
  } catch (err) {
    // A failure here (storage down, PDF render error) shouldn't leave the
    // customer with silence — same fallback tone as the orchestrator's own
    // "all LLM providers failed" case.
    console.error(`[chatbot:quotation] PDF generation/upload failed: ${(err as Error).message}`);
    const fallback =
      "Sorry, I'm having trouble putting your quotation together right now. A member of the Rig Builders team will follow up with you shortly.";
    await appendMessage(conversationId, "assistant", fallback, "none");
    return { text: fallback };
  }
}
