import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Simple keyword-based product lookup for the chatbot (Phase 3a "RAG").
 * No embeddings/vector DB — just matches words from the customer's message
 * against product name/breadcrumb/configurator name/brand, ranks by how many
 * words hit, and formats the top matches (including every spec field, not
 * just the ones Google's feed happens to show) for the system prompt.
 *
 * Queries the `products` table directly via supabaseAdmin — this never goes
 * through /api/merchant-feed. The two are separate consumers of the same
 * table with very different output shapes (Google's XML tags vs. plain text
 * for an LLM) and different filtering needs.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "what", "which", "how",
  "much", "many", "for", "of", "in", "on", "with", "and", "or", "to",
  "i", "want", "need", "have", "has", "can", "you", "your", "tell", "me",
  "about", "price", "cost", "spec", "specs", "specification", "please",
  "this", "that", "it", "im", "i'm", "buy", "get",
]);

interface ProductRow {
  id: string;
  name: string;
  breadcrumb_name: string | null;
  configurator_name: string | null;
  nickname: string | null;
  brand: string | null;
  category: string;
  price: number;
  mrp: number | null;
  warranty: string | null;
  in_stock: boolean;
  description: string | null;
  features: string[] | null;
  specs: Record<string, unknown> | null;
  series: string | null;
  tier: number | null;
  image_url: string | null;
}

const PRODUCT_SELECT =
  "id, name, breadcrumb_name, configurator_name, nickname, brand, category, price, mrp, warranty, in_stock, description, features, specs, series, tier, image_url";

/** The shape the website widget renders as a product card — see ChatProductCard.tsx. */
export interface ProductCard {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  imageUrl: string | null;
  inStock: boolean;
  category: string;
  brand: string | null;
}

/**
 * Maps a phrase a customer might type to a real `category` value (see
 * BASE_CATEGORIES in app/admin/products/constants.ts). Longer/more specific
 * phrases first so e.g. "graphics card" matches before a shorter substring
 * would (not strictly required here since we check every entry, but keeps
 * the list readable in the same order it's evaluated).
 */
const CATEGORY_ALIASES: Record<string, string> = {
  "graphics card": "gpu",
  "graphic card": "gpu",
  "power supply": "psu",
  "pre-built": "prebuilt",
  "hard drive": "storage",
  processor: "cpu",
  processors: "cpu",
  cpu: "cpu",
  gpu: "gpu",
  graphics: "gpu",
  motherboard: "motherboard",
  mobo: "motherboard",
  ram: "ram",
  memory: "ram",
  storage: "storage",
  ssd: "storage",
  hdd: "storage",
  psu: "psu",
  cabinet: "cabinet",
  case: "cabinet",
  cooler: "cooler",
  cooling: "cooler",
  windows: "os",
  monitor: "monitor",
  display: "monitor",
  keyboard: "keyboard",
  // "mousepad" MUST come before "mouse" — detectCategoryAndBrand takes the
  // first alias whose key is a substring of the message, and "mousepad"
  // itself contains "mouse", so with the order reversed (as this was until
  // eval testing caught it) every mousepad question matched "mouse" first
  // and got routed to the wrong category entirely.
  mousepad: "mousepad",
  mouse: "mouse",
  usb: "usb",
  prebuilt: "prebuilt",
  desktop: "prebuilt",
  desktops: "prebuilt",
};

// Common component brands carried in the catalog — matched against the
// `brand` column with ILIKE, so exact DB casing doesn't matter.
const BRAND_ALIASES: Record<string, string> = {
  intel: "Intel",
  amd: "AMD",
  nvidia: "NVIDIA",
  asus: "ASUS",
  msi: "MSI",
  gigabyte: "Gigabyte",
  corsair: "Corsair",
  "cooler master": "Cooler Master",
  nzxt: "NZXT",
  samsung: "Samsung",
  "western digital": "Western Digital",
  seagate: "Seagate",
  kingston: "Kingston",
  logitech: "Logitech",
};

function detectCategoryAndBrand(text: string): { category?: string; brand?: string } {
  const lower = text.toLowerCase();
  const category = Object.entries(CATEGORY_ALIASES).find(([alias]) => lower.includes(alias))?.[1];
  const brand = Object.entries(BRAND_ALIASES).find(([alias]) => lower.includes(alias))?.[1];
  return { category, brand };
}

function includesWord(lower: string, word: string): boolean {
  if (!word) return false;
  const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(lower);
}

/**
 * Fallback for when CATEGORY_ALIASES above has no entry at all for a real
 * category — found via eval testing: "bag" is a real, published category in
 * the catalog (it's also missing from BASE_CATEGORIES in
 * app/admin/products/constants.ts, so it looks like it was added straight
 * to the DB-driven categories table Navbar.tsx already reads from, without
 * either hardcoded list being updated to match) that silently fell through
 * to fuzzy keyword search and returned unrelated products (mice, in
 * testing) instead. Checks the real category id/name/short_name from the
 * categories table against the message. Uses word-boundary matching, not a
 * plain substring check, since category ids can be short ("os") and a bare
 * .includes() would false-positive inside unrelated words ("cost", "most").
 */
async function detectDynamicCategory(text: string): Promise<string | undefined> {
  const { data, error } = await supabaseAdmin.from("categories").select("id, name, short_name").eq("active", true);
  if (error || !data) return undefined;

  const lower = text.toLowerCase();
  for (const c of data as { id: string; name: string | null; short_name: string | null }[]) {
    const candidates = [c.id, c.name, c.short_name].filter(Boolean) as string[];
    if (candidates.some((cand) => includesWord(lower, cand))) return c.id;
  }
  return undefined;
}

/**
 * Fallback for when BRAND_ALIASES above doesn't recognize a brand the
 * customer actually typed — found via eval testing: a real catalog brand
 * ("Colorful", on a motherboard) outside that ~14-brand hardcoded list
 * silently lost its brand filter, so "do you have Colorful motherboards"
 * fell back to an unfiltered category listing (any motherboard, any brand)
 * instead of matching the real Colorful product or correctly saying "no."
 * Queries the real distinct brand values for this category and checks
 * whether any of them appears as a substring of the message — this way any
 * brand actually in the catalog gets matched, not just the common ones.
 */
async function detectDynamicBrand(text: string, category: string): Promise<string | undefined> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("brand")
    .eq("listing_status", "published")
    .eq("category", category)
    .not("brand", "is", null);

  if (error || !data) return undefined;

  const lower = text.toLowerCase();
  // Longest name first so e.g. "western digital" wins over a shorter
  // accidental substring match.
  const brands = [...new Set(data.map((r) => r.brand as string).filter(Boolean))].sort((a, b) => b.length - a.length);
  return brands.find((b) => lower.includes(b.toLowerCase()));
}

// Human-friendly labels for known spec keys (falls back to a titleized raw key).
const SPEC_LABELS: Record<string, string> = {
  socket: "Socket",
  chipset_maker: "Chipset Maker",
  chipset_series: "Chipset Series",
  chipset: "Chipset",
  wattage: "TDP / Wattage",
  memory_type: "Memory Type",
  form_factor: "Form Factor",
  capacity: "Capacity",
  vram: "VRAM",
  length_mm: "Length (mm)",
  storage_type: "Storage Type",
  radiator_size: "Radiator Size",
  max_gpu_length_mm: "Max GPU Length Supported (mm)",
  supported_motherboards: "Supports Motherboard Sizes",
  supported_radiators: "Supports Radiator Sizes",
  color: "Color",
};

// Internal bookkeeping keys that shouldn't be shown to the LLM/customer.
const SPEC_HIDE = new Set(["group", "variant_label"]);

/**
 * Which spec keys actually make sense for each category — mirrors exactly
 * what app/admin/products/page.tsx writes into `specs` per category (see
 * ProductForm.tsx). `specs` is a single shared JSONB column across every
 * category, so without this filter a stray/legacy key (e.g. a leftover
 * `length_mm` on a CPU row) would get read back out and handed to the LLM as
 * if it were a real GPU-length spec for a processor. Categories not listed
 * here (custom/admin-added ones) fall back to showing everything present.
 */
const CATEGORY_SPEC_ALLOWLIST: Record<string, string[]> = {
  cpu: ["socket", "wattage"],
  gpu: ["chipset_maker", "chipset_series", "chipset", "vram", "memory_type", "length_mm", "wattage", "color"],
  motherboard: ["chipset_maker", "chipset_series", "chipset", "socket", "memory_type", "form_factor", "wattage"],
  ram: ["memory_type", "capacity", "color"],
  storage: ["capacity", "storage_type"],
  psu: ["wattage"],
  cabinet: ["max_gpu_length_mm", "supported_motherboards", "supported_radiators", "color"],
  cooler: ["radiator_size", "color"],
  os: [],
  monitor: ["color", "capacity", "style"],
  keyboard: ["color", "style"],
  mouse: ["color", "style"],
  combo: ["color", "style"],
  mousepad: ["color", "style"],
  usb: ["color", "capacity"],
  // prebuilt intentionally omitted — its specs are already curated,
  // human-readable BOM labels ("Processor", "Graphics Card (Slot 1)", ...),
  // not raw technical keys, so those should always pass through as-is.
};

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    .slice(0, 6); // cap so the DB filter stays reasonably sized
}

function formatSpecs(specs: Record<string, unknown> | null, category: string): string {
  if (!specs) return "";
  const lines: string[] = [];
  const allowlist = CATEGORY_SPEC_ALLOWLIST[category];

  for (const [key, value] of Object.entries(specs)) {
    if (SPEC_HIDE.has(key)) continue;
    if (allowlist && !allowlist.includes(key)) continue; // category mismatch — skip
    if (value === null || value === undefined || value === "") continue;

    const label = SPEC_LABELS[key] ?? key.replace(/_/g, " ");
    const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
    if (!displayValue) continue;

    lines.push(`  - ${label}: ${displayValue}`);
  }

  return lines.join("\n");
}

function formatProduct(p: ProductRow): string {
  const lines = [
    `${p.name}${p.brand ? ` (${p.brand})` : ""}`,
    `  - Category: ${p.category}${p.series ? `, Series: ${p.series.toUpperCase()}${p.tier ? " " + p.tier : ""}` : ""}`,
    `  - Price: ₹${p.price}${p.mrp && p.mrp > p.price ? ` (MRP ₹${p.mrp})` : ""}`,
    `  - Stock: ${p.in_stock ? "In stock" : "Out of stock"}`,
  ];

  if (p.warranty) lines.push(`  - Warranty: ${p.warranty}`);

  const specLines = formatSpecs(p.specs, p.category);
  if (specLines) lines.push(specLines);

  if (p.features && p.features.length > 0) {
    lines.push(`  - Features: ${p.features.join("; ")}`);
  }

  if (p.description) lines.push(`  - Description: ${p.description}`);

  return lines.join("\n");
}

/**
 * Finds products relevant to a customer's message. Two strategies, tried in
 * order:
 *
 * 1. Structured category/brand lookup — if the message names a category
 *    ("processors", "graphics card") and optionally a brand ("Intel"), query
 *    for every published product in that category (+ brand filter if given).
 *    This is what guarantees completeness: "do you have Intel processors"
 *    returns *all* Intel CPUs, not just however many happen to rank highest
 *    in a fuzzy text search.
 * 2. Fuzzy keyword search — falls back to matching words from the message
 *    against name/breadcrumb/configurator/nickname/brand text, for queries
 *    that name a specific product rather than a whole category ("how much is
 *    the 7800X3D").
 *
 * Never throws — a lookup failure just means no product context this turn,
 * not a broken reply.
 */
export async function findRelevantProducts(userMessage: string, limit = 8): Promise<ProductRow[]> {
  const { category: aliasCategory, brand: aliasBrand } = detectCategoryAndBrand(userMessage);
  const category = aliasCategory ?? (await detectDynamicCategory(userMessage));

  if (category) {
    const brand = aliasBrand ?? (await detectDynamicBrand(userMessage, category));

    let query = supabaseAdmin
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("listing_status", "published")
      .eq("category", category)
      .order("price", { ascending: true })
      .limit(limit);

    if (brand) query = query.ilike("brand", `%${brand}%`);

    const { data, error } = await query;
    if (error) {
      console.error(`[chatbot:product-knowledge] category lookup failed: ${error.message}`);
    } else if (data && data.length > 0) {
      return data as ProductRow[];
    }
    // No category match (or brand filter too narrow) — fall through to fuzzy search.
  }

  const keywords = extractKeywords(userMessage);
  if (keywords.length === 0) return [];

  const orFilter = keywords
    .flatMap((k) => [
      `name.ilike.%${k}%`,
      `breadcrumb_name.ilike.%${k}%`,
      `configurator_name.ilike.%${k}%`,
      `nickname.ilike.%${k}%`,
      `brand.ilike.%${k}%`,
    ])
    .join(",");

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("listing_status", "published")
    .or(orFilter)
    .limit(20);

  if (error) {
    console.error(`[chatbot:product-knowledge] lookup failed: ${error.message}`);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Rank with breadcrumb_name (the short, clean product identity, e.g. "Ryzen 7
  // 7800X3D") as the primary signal, nickname/configurator_name as strong
  // secondary signals, and the full SEO title only as a low-confidence
  // fallback — it's long and keyword-stuffed, so on its own it's a weaker
  // signal of what the customer actually meant.
  const scored = (data as ProductRow[]).map((p) => {
    const breadcrumb = (p.breadcrumb_name ?? "").toLowerCase();
    const nickname = (p.nickname ?? "").toLowerCase();
    const configurator = (p.configurator_name ?? "").toLowerCase();
    const seoName = p.name.toLowerCase();

    let score = 0;
    for (const k of keywords) {
      if (breadcrumb.includes(k)) score += 3;
      if (nickname.includes(k)) score += 3;
      if (configurator.includes(k)) score += 2;
      if (seoName.includes(k)) score += 1;
      if ((p.brand ?? "").toLowerCase().includes(k)) score += 1;
    }
    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);
}

/**
 * Formats an already-fetched product list into the text block appended to
 * the system prompt. Split out from findRelevantProducts so website-stream.ts
 * can query once and use the result both for this prompt context and for the
 * product cards rendered in the widget.
 */
export function buildProductContext(products: ProductRow[]): string {
  if (products.length === 0) return "";
  return (
    "Relevant product data from the Rig Builders catalog (this is live, accurate data — use " +
    "it for exact prices/specs/stock, and never state numbers beyond what's listed here). " +
    "You don't need to enumerate every single one in full detail — a short summary covering " +
    "what's relevant to the question is enough:\n\n" +
    products.map(formatProduct).join("\n\n")
  );
}

/** Maps DB rows to the plain-data shape the website widget renders as cards. */
export function toProductCards(products: ProductRow[]): ProductCard[] {
  return products.map((p) => ({
    id: p.id,
    name: p.breadcrumb_name?.trim() || p.name,
    price: p.price,
    mrp: p.mrp,
    imageUrl: p.image_url,
    inStock: p.in_stock,
    category: p.category,
    brand: p.brand,
  }));
}

/**
 * Looks up products relevant to a customer's message and returns a compact
 * text block ready to append to the system prompt for this one LLM call.
 * Returns "" when nothing matches — the orchestrator skips adding an empty
 * block rather than confusing the prompt with a "no results" note.
 *
 * Kept as the entry point for channels without card UI (WhatsApp, Instagram,
 * Messenger) — the website widget uses findRelevantProducts directly so it
 * can also build product cards from the same result.
 */
export async function getProductKnowledge(userMessage: string, limit = 3): Promise<string> {
  const products = await findRelevantProducts(userMessage, limit);
  return buildProductContext(products);
}

/**
 * Figures out which single product (if any) a generated reply is actually
 * about, so a "View Details" button can point at the right page — this is
 * NOT the same as "which products matched the customer's question." The
 * customer might ask for something out of stock and the bot recommends a
 * different part instead (e.g. asked for an RTX 3060, got quoted an RTX
 * 5060), so the button target has to come from what the reply text itself
 * settled on, not from the original candidate search. Deliberately
 * conservative: only returns a product when exactly one candidate's name
 * shows up in the reply — if the reply mentions several products (a
 * category listing) or none by name, there's no single obvious link target,
 * so callers should just send plain text instead of guessing.
 */
// Strips everything but letters/digits before comparing, so small phrasing
// drift between the LLM's generated text and the exact stored product name
// doesn't break the match — e.g. the model writing "7800X 3D" (with a
// space) or "7800-X3D" against a stored name of "7800X3D" would otherwise
// silently fail an exact substring check and fall back to plain text with
// no product card, even though it's obviously the same product.
function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// breadcrumb_name/name in this catalog is often a full spec-dump title —
// e.g. "AMD Ryzen 7 7800X 3D Desktop Processor 8 cores 16 Threads 104 MB
// Cache 4.2 GHz Upto 5.6 GHz AM5 Socket (100-100000910WOF)" — not a short
// display name. No natural conversational reply is ever going to repeat
// that whole string verbatim, and even truncating to "the first N words"
// is fragile: titles don't consistently break at the same point (a plain
// number like the "8" in "8 cores" can land inside the window and corrupt
// the match, or the real name runs longer than the window and gets cut
// short). Instead, this pulls out the one token that's actually unique to
// the product — its model number (e.g. "7800X", "B550M", "9600X") — by
// looking for a word that mixes letters and digits, which spec-count words
// ("8", "16", "104") never do and generic component words ("Desktop",
// "Processor", "Socket") never do either. Long alphanumeric SKU codes
// ("100-100000910WOF") are excluded by a max length so they don't win out
// over the real, shorter model number. Falls back to the first few words
// only when a name has no such token at all.
function identifyingToken(fullName: string): string | null {
  const cleaned = fullName.split("(")[0].split(",")[0].split(" - ")[0];
  const words = cleaned.trim().split(/\s+/).filter(Boolean);
  const modelNumberLike = words.filter(
    (w) => /[a-z]/i.test(w) && /\d/.test(w) && w.length >= 4 && w.length <= 10
  );
  if (modelNumberLike.length === 0) return null;
  return modelNumberLike.reduce((longest, w) => (w.length > longest.length ? w : longest));
}

export function findMentionedProduct(replyText: string, candidates: ProductRow[]): ProductRow | null {
  const normalizedReply = normalizeForMatch(replyText);
  const matches = candidates.filter((p) => {
    const fullName = p.breadcrumb_name?.trim() || p.name;
    const token = identifyingToken(fullName);
    if (token) {
      return normalizedReply.includes(normalizeForMatch(token));
    }
    const fallback = normalizeForMatch(
      fullName.split("(")[0].split(",")[0].trim().split(/\s+/).slice(0, 5).join(" ")
    );
    return fallback.length > 0 && normalizedReply.includes(fallback);
  });
  return matches.length === 1 ? matches[0] : null;
}
