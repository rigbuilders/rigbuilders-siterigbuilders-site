import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateReply } from "./llm/router";
import { describeBrief, type BuildBrief } from "./build-brief";
import { getTelegramConfig } from "./config";

/**
 * The distributor round-trip: parts we can't price ourselves go out to the
 * distributor, come back priced (and sometimes substituted), get checked
 * against the customer's brief, and land in front of the approver as a
 * yes/no rather than a wall of text.
 *
 * The thing this is really protecting against is a silent downgrade. An
 * RX 550 offered in place of an RX 6500 is a large performance drop that
 * reads as a near-identical model number, and it is very easy to pass
 * straight through to a customer without anyone noticing.
 */

export interface SourcedItem {
  requested: string;
  offered: string;
  brand: string | null;
  price: number | null;
  isSubstitution: boolean;
}

export interface SourcingRequest {
  id: string;
  conversationId: string | null;
  customerChannel: string | null;
  customerExternalId: string | null;
  requestedParts: string[];
  brief: BuildBrief | null;
  status: string;
}

interface SourcingRow {
  id: string;
  conversation_id: string | null;
  customer_channel: string | null;
  customer_external_id: string | null;
  requested_parts: string[] | null;
  brief: BuildBrief | null;
  status: string;
}

function mapRow(row: SourcingRow): SourcingRequest {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    customerChannel: row.customer_channel,
    customerExternalId: row.customer_external_id,
    requestedParts: Array.isArray(row.requested_parts) ? row.requested_parts : [],
    brief: row.brief,
    status: row.status,
  };
}

/** Opened when unmatched parts are sent to the distributor. */
export async function openSourcingRequest(params: {
  conversationId: string;
  customerChannel: string;
  customerExternalId: string;
  requestedParts: string[];
  brief?: BuildBrief | null;
}): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("sourcing_requests")
      .insert({
        conversation_id: params.conversationId,
        customer_channel: params.customerChannel,
        customer_external_id: params.customerExternalId,
        requested_parts: params.requestedParts,
        brief: params.brief ?? null,
        status: "awaiting_distributor",
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      console.error(`[chatbot:sourcing] open failed: ${error?.message ?? "unknown"}`);
      return null;
    }
    return data.id;
  } catch (err) {
    console.error(`[chatbot:sourcing] open threw: ${(err as Error).message}`);
    return null;
  }
}

/**
 * The request a distributor message belongs to.
 *
 * Most recent still-open request wins. That's a deliberate simplification:
 * with one distributor and a handful of requests a day it's almost always
 * right, and the alternative — asking him to quote a reference on every
 * message — is the kind of process people stop following by Thursday. If
 * volume grows, this is the function to revisit.
 */
export async function findOpenRequest(): Promise<SourcingRequest | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("sourcing_requests")
      .select("*")
      .in("status", ["awaiting_distributor", "needs_brand"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<SourcingRow>();

    if (error || !data) return null;
    return mapRow(data);
  } catch {
    return null;
  }
}

/**
 * The request currently sitting with the approver. Separate from
 * findOpenRequest because the two look at different stages — the distributor
 * answers requests that are still out with him, the approver decides on ones
 * that have already come back.
 */
export async function findOpenRequestForApproval(): Promise<SourcingRequest | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("sourcing_requests")
      .select("*")
      .eq("status", "awaiting_approval")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<SourcingRow>();

    if (error || !data) return null;
    return mapRow(data);
  } catch {
    return null;
  }
}

export async function getRequest(id: string): Promise<SourcingRequest | null> {
  const { data, error } = await supabaseAdmin
    .from("sourcing_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle<SourcingRow>();
  if (error || !data) return null;
  return mapRow(data);
}

export async function updateRequest(
  id: string,
  patch: { status?: string; distributorReply?: string; parsedItems?: SourcedItem[] }
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) update.status = patch.status;
  if (patch.distributorReply !== undefined) update.distributor_reply = patch.distributorReply;
  if (patch.parsedItems !== undefined) update.parsed_items = patch.parsedItems;

  const { error } = await supabaseAdmin.from("sourcing_requests").update(update).eq("id", id);
  if (error) console.error(`[chatbot:sourcing] update failed: ${error.message}`);
}

const PARSE_PROMPT = `You read a PC-parts distributor's WhatsApp reply and turn it into structured data.

You are given the list of parts that were ASKED FOR, and the distributor's reply quoting what he can supply at distributor prices.

Output ONLY a JSON array, no other text, no code fences. One object per item he is offering:
[{"requested":"<which asked-for part this answers, verbatim from the asked list>","offered":"<what he is actually offering>","brand":"<brand or null if he didn't say>","price":<number in rupees, or null>,"isSubstitution":<true if offered is a different product from requested>}]

Rules:
- isSubstitution is true whenever the offered part is not the same product as the requested one. A different model number, tier or generation is a substitution. A different brand of the same model is NOT.
- brand is null unless he actually named one. "DDR4 RAM 16GB" has no brand. "Corsair Vengeance 16GB DDR4" has brand "Corsair".
- price is the plain number only — no currency symbol, no commas.
- If he says something is unavailable, omit it entirely.
- Never invent a brand, a price or a model he didn't write.`;

/** Turns the distributor's free-text reply into structured items. */
export async function parseDistributorReply(
  requestedParts: string[],
  reply: string
): Promise<SourcedItem[] | null> {
  try {
    const { text } = await generateReply(
      PARSE_PROMPT,
      [],
      `ASKED FOR:\n${requestedParts.map((p) => `- ${p}`).join("\n")}\n\nHIS REPLY:\n${reply}`
    );

    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;

    return parsed.map((item: Record<string, unknown>) => ({
      requested: String(item.requested ?? ""),
      offered: String(item.offered ?? ""),
      brand: item.brand ? String(item.brand) : null,
      price: typeof item.price === "number" ? item.price : null,
      isSubstitution: Boolean(item.isSubstitution),
    }));
  } catch (err) {
    console.error(`[chatbot:sourcing] parse failed: ${(err as Error).message}`);
    return null;
  }
}

/** Items he named without a brand — unpriceable and unquotable as they stand. */
export function itemsMissingBrand(items: SourcedItem[]): SourcedItem[] {
  return items.filter((item) => !item.brand);
}

/** Sent back to the distributor when he's left brands off. */
export function brandRequestMessage(items: SourcedItem[]): string {
  const list = items.map((i) => `• ${i.offered}`).join("\n");
  return (
    `Thanks! Could you please mention the brand for these so we can quote them accurately?\n\n${list}\n\n` +
    `For example "Corsair Vengeance 16GB DDR4" rather than "DDR4 16GB".`
  );
}

/**
 * Reads the parsed items against the customer's brief.
 *
 * Returns plain sentences rather than a verdict: the approver is deciding,
 * and a flat "over budget" with no figures is less useful than showing the
 * total next to what they said they'd spend.
 */
export async function checkAgainstBrief(items: SourcedItem[], brief: BuildBrief | null): Promise<string[]> {
  const notes: string[] = [];
  const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const missingPrices = items.filter((i) => i.price === null).length;

  notes.push(
    `Distributor total: ₹${total.toLocaleString("en-IN")}` +
      (missingPrices > 0 ? ` (${missingPrices} item${missingPrices === 1 ? "" : "s"} unpriced)` : "")
  );

  if (!brief) return notes;

  if (brief.budget) {
    // Deliberately not a pass/fail: this is cost, not the customer's price,
    // so only a person can say whether it works once margin is applied.
    notes.push(`Customer's budget: ${brief.budget} — compare against cost above once you've added margin.`);
  }

  // A stated brand preference is the kind of thing a substitution quietly
  // breaks, so it's called out explicitly rather than left to be spotted.
  const offered = items.map((i) => `${i.brand ?? ""} ${i.offered}`.toLowerCase()).join(" ");
  if (brief.cpu_brand && brief.cpu_brand.toLowerCase() !== "no preference") {
    const wanted = brief.cpu_brand.toLowerCase();
    const other = wanted === "amd" ? "intel" : "amd";
    if (offered.includes(other)) notes.push(`⚠ Customer asked for ${brief.cpu_brand} — an ${other.toUpperCase()} part is in this list.`);
  }
  if (brief.gpu_brand && brief.gpu_brand.toLowerCase() !== "no preference") {
    const wanted = brief.gpu_brand.toLowerCase();
    const other = wanted === "nvidia" ? "amd" : "nvidia";
    if (offered.includes(other)) notes.push(`⚠ Customer asked for ${brief.gpu_brand} graphics — an ${other.toUpperCase()} part is in this list.`);
  }

  return notes;
}

/** The approval request, sent to the approver on Telegram. */
export async function requestApproval(request: SourcingRequest, items: SourcedItem[]): Promise<void> {
  const config = getTelegramConfig();
  if (!config) {
    console.error("[chatbot:sourcing] no Telegram config — approval request not sent");
    return;
  }

  const substitutions = items.filter((i) => i.isSubstitution);
  const notes = await checkAgainstBrief(items, request.brief);
  const briefText = request.brief ? await describeBrief(request.brief) : "";

  const lines = [
    substitutions.length > 0 ? "SOURCING — SUBSTITUTIONS TO APPROVE" : "SOURCING — DISTRIBUTOR QUOTED",
    `Customer: ${request.customerExternalId ?? "unknown"} (${request.customerChannel ?? "?"})`,
    "",
    ...items.map((item) => {
      const price = item.price !== null ? `₹${item.price.toLocaleString("en-IN")}` : "no price";
      const brand = item.brand ? `${item.brand} ` : "";
      return item.isSubstitution
        ? `• ${item.requested} → ${brand}${item.offered} — ${price}  [SUBSTITUTED]`
        : `• ${brand}${item.offered} — ${price}`;
    }),
    "",
    ...notes,
  ];

  if (briefText) lines.push("", "Customer brief:", briefText);
  lines.push("", 'Reply "send" to quote this, or "updated quotation" to change parts.');

  try {
    await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: lines.join("\n"),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error(`[chatbot:sourcing] approval send failed: ${(err as Error).message}`);
  }

  await updateRequest(request.id, { status: "awaiting_approval", parsedItems: items });
}

/** Recognises the approver's decision. Forgiving, because it's typed one-handed. */
export function parseApproval(text: string): "approve" | "revise" | null {
  const normalised = text.trim().toLowerCase().replace(/[.!]/g, "");
  if (["send", "send it", "ok send", "approved", "approve", "yes send"].includes(normalised)) return "approve";
  if (normalised.includes("updated quotation") || normalised.includes("update quotation") || normalised.includes("revise")) {
    return "revise";
  }
  return null;
}
