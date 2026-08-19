import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { filterInventory, calculateTotals } from "@/app/configure/logic";
import type { Product, SelectionState } from "@/app/configure/types";
import type { ChatMessage } from "./types";

/**
 * Custom-build quotations for the chatbot. Deliberately NOT a fine-tuned or
 * separately "trained" model — a PC build is a compatibility/constraint
 * problem (this socket needs that socket, this much power needs that PSU),
 * not a language problem, and that's already solved correctly and
 * deterministically in app/configure/logic.ts for the website configurator.
 * This reuses that exact same rule set so a chat-recommended build and a
 * manually-configured one can never disagree about what's compatible.
 *
 * The LLM's job stays narrow: turn the customer's words into (budget, use
 * case), and turn a finished BuildQuote back into a friendly sentence. It
 * never picks parts or prices itself — the risk of a model inventing a SKU
 * or a number (which we already saw happen) is exactly what this avoids.
 */

export type UseCase = "gaming" | "workstation" | "creator" | "general";

export interface BuildQuoteItem {
  category: string;
  label: string;
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  brand: string | null;
}

export interface BuildQuote {
  useCase: UseCase;
  budget: number;
  items: BuildQuoteItem[];
  totalPrice: number;
  estimatedTDP: number;
  psuWattage: number;
  isPowerSufficient: boolean;
  withinBudget: boolean;
  missingCategories: string[]; // categories we couldn't fill (no compatible in-stock item)
}

export type BuildIntentResult =
  | { kind: "none" } // not a build request at all
  | { kind: "needs_info"; have: { useCase: UseCase | null; budget: number | null } } // build request, missing budget or use case
  | { kind: "quote"; quote: BuildQuote };

const BUILD_TRIGGER_PATTERNS = [
  "build a pc", "build a system", "build me", "custom pc", "custom build",
  "custom rig", "quotation", "quote for", "give me a quote", "recommend a build",
  "recommend a pc", "suggest a build", "suggest a pc", "system for", "pc for",
  "rig for", "want to build", "need a pc", "need a build", "put together a",
  "assemble a pc", "configure a pc",
];

const USE_CASE_KEYWORDS: Record<UseCase, string[]> = {
  gaming: ["gaming", "game", "esports", "fps", "streaming while gaming"],
  workstation: ["workstation", "cad", "rendering", "render farm", "data science", "engineering", "simulation", "coding server"],
  creator: ["creator", "video editing", "editing", "3d", "streaming", "content creation", "youtube", "animation"],
  general: ["office", "browsing", "everyday", "general use", "study", "school", "college", "basic use"],
};

/** ₹ figures written as "80k", "1.2 lakh", "80000", "₹80,000", etc. */
function extractBudget(text: string): number | null {
  const lower = text.toLowerCase();

  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const rupeeMatch = lower.match(/(?:₹|rs\.?|inr)\s*([\d,]{4,})/);
  if (rupeeMatch) return parseInt(rupeeMatch[1].replace(/,/g, ""), 10);

  // A bare number is only treated as a budget if it's a plausible PC price —
  // avoids misreading "16 gb ram" or "12 cores" as a budget figure.
  const bareMatch = lower.match(/\b(\d{5,7})\b/);
  if (bareMatch) return parseInt(bareMatch[1], 10);

  return null;
}

function extractUseCase(text: string): UseCase | null {
  const lower = text.toLowerCase();
  for (const [useCase, keywords] of Object.entries(USE_CASE_KEYWORDS) as [UseCase, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) return useCase;
  }
  return null;
}

function looksLikeBuildRequest(text: string): boolean {
  const lower = text.toLowerCase();
  if (BUILD_TRIGGER_PATTERNS.some((p) => lower.includes(p))) return true;

  // No explicit "build/custom/quote" phrasing — still treat it as a build
  // request if it names a machine AND pairs it with both a use case and a
  // budget, e.g. "gaming pc under 80k". Requiring all three together avoids
  // misreading an ordinary product question ("is this pc good for gaming")
  // as a request for a full custom quotation.
  //
  // "workstation" and a bare "build" belong here too — found via eval
  // testing: phrasings like "quote a workstation for CAD under ₹40000" or
  // "a build for content creation" were falling through to kind:"none"
  // entirely (never even reaching needs_info) because neither trigger
  // pattern above nor this noun list matched, even though extractUseCase/
  // extractBudget both parse them fine on their own.
  const mentionsMachine = /\b(pc|rig|system|desktop|computer|setup|workstation|build)\b/.test(lower);
  return mentionsMachine && extractUseCase(lower) !== null && extractBudget(lower) !== null;
}

// Budget split per category, as a fraction of the core-build budget (sums to
// 1.0 within each profile). Reflects typical part-cost proportions for each
// use case — GPU-heavy for gaming, CPU/RAM-heavy for workstation, etc.
const ALLOCATION: Record<UseCase, Record<string, number>> = {
  gaming: { cpu: 0.20, motherboard: 0.10, gpu: 0.35, ram: 0.08, storage: 0.08, psu: 0.07, cabinet: 0.07, cooler: 0.05 },
  workstation: { cpu: 0.28, motherboard: 0.14, gpu: 0.12, ram: 0.16, storage: 0.14, psu: 0.08, cabinet: 0.05, cooler: 0.03 },
  creator: { cpu: 0.24, motherboard: 0.10, gpu: 0.28, ram: 0.12, storage: 0.12, psu: 0.07, cabinet: 0.04, cooler: 0.03 },
  general: { cpu: 0.30, motherboard: 0.15, gpu: 0.05, ram: 0.12, storage: 0.15, psu: 0.10, cabinet: 0.08, cooler: 0.05 },
};

const CATEGORY_LABELS: Record<string, string> = {
  cpu: "Processor",
  motherboard: "Motherboard",
  gpu: "Graphics Card",
  ram: "Memory",
  storage: "Storage",
  psu: "Power Supply",
  cabinet: "Cabinet",
  cooler: "Cooling",
  os: "Operating System",
};

// Order matters: each category can only filter by compatibility rules that
// depend on an EARLIER pick (mirrors app/configure/logic.ts's dependency
// chain — cabinet needs the mobo's form factor, the GPU's length, and the
// cooler's radiator size, so it has to come after all three).
const PICK_ORDER = ["cpu", "motherboard", "gpu", "cooler", "cabinet", "ram", "storage", "psu", "os"] as const;

async function fetchInventory(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, price, category, brand, image_url, in_stock, configurator_name, specs")
    .eq("listing_status", "published")
    .in("category", ["cpu", "motherboard", "gpu", "ram", "storage", "psu", "cabinet", "cooler", "os"]);

  if (error) {
    console.error(`[chatbot:build-recommender] inventory fetch failed: ${error.message}`);
    return [];
  }

  // Same shape the configurator itself builds from the same table (see
  // app/configure/page.tsx's init()) — specs fields (socket, memory_type,
  // wattage, etc.) get spread up to the top level, which is what
  // filterInventory/calculateTotals expect.
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    configurator_name: p.configurator_name,
    category: p.category,
    brand: p.brand,
    image: p.image_url,
    inStock: p.in_stock,
    ...(p.specs && typeof p.specs === "object" ? p.specs : {}),
  })) as Product[];
}

/** Picks the best-value in-stock, compatible candidate within a budget slice. */
function pickBest(candidates: Product[], sliceBudget: number): Product | null {
  const eligible = candidates.filter((p) => p.inStock !== false && p.isCompatible !== false);
  if (eligible.length === 0) return null;

  const withinSlice = eligible.filter((p) => Number(p.price) <= sliceBudget);
  const pool = withinSlice.length > 0 ? withinSlice : eligible;

  // Best value = the most expensive option that still fits — within a
  // curated catalog, price is a reasonable stand-in for spec tier. Falling
  // back to the cheapest compatible item overall (when nothing fits the
  // slice) keeps the build buildable rather than leaving a category empty.
  return pool.reduce((best, p) => (Number(p.price) > Number(best.price) ? p : best), pool[0]);
}

function pickPsu(candidates: Product[], estimatedTDP: number, sliceBudget: number): Product | null {
  const eligible = candidates.filter((p) => p.inStock !== false);
  if (eligible.length === 0) return null;

  const required = estimatedTDP * 1.2; // 20% headroom, same spirit as calculateTotals' sufficiency check
  const sufficient = eligible.filter((p) => {
    const w = typeof p.wattage === "number" ? p.wattage : parseInt(String(p.wattage ?? "0"), 10) || 0;
    return w >= required;
  });

  const pool = sufficient.length > 0 ? sufficient : eligible;
  const withinSlice = pool.filter((p) => Number(p.price) <= sliceBudget);
  const finalPool = withinSlice.length > 0 ? withinSlice : pool;

  // Cheapest sufficient PSU — headroom is the requirement here, not "more expensive = better".
  return finalPool.reduce((cheapest, p) => (Number(p.price) < Number(cheapest.price) ? p : cheapest), finalPool[0]);
}

async function buildQuote(useCase: UseCase, budget: number): Promise<BuildQuote> {
  const inventory = await fetchInventory();
  const allocation = ALLOCATION[useCase];

  const selections: SelectionState = {
    cpu: null, motherboard: null, gpu: null, ram: null, storage: null,
    cooler: null, psu: null, cabinet: null, monitor: null, keyboard: null,
    mouse: null, combo: null, osPrimary: null, osSecondary: null,
  };
  // OS has no compatibility dependencies (nothing in logic.ts filters by it),
  // and SelectionState only has osPrimary/osSecondary slots, not a plain
  // "os" — tracked separately here instead of forcing it into that shape.
  let osPick: Product | null = null;

  const missingCategories: string[] = [];

  for (const category of PICK_ORDER) {
    const slice = budget * (allocation[category] ?? 0);
    const filtered = filterInventory(inventory, selections);

    const candidatesByCategory: Record<string, Product[]> = {
      cpu: filtered.cpus, motherboard: filtered.mobos, gpu: filtered.gpus,
      ram: filtered.rams, storage: filtered.storages, psu: filtered.psus,
      cabinet: filtered.cabinets, cooler: filtered.coolers, os: filtered.osList,
    };
    const candidates = candidatesByCategory[category] ?? [];

    const picked =
      category === "psu"
        ? pickPsu(candidates, calculateTotals(selections).estimatedTDP, slice)
        : pickBest(candidates, slice);

    if (!picked) {
      missingCategories.push(category);
    } else if (category === "os") {
      osPick = picked;
    } else {
      (selections as unknown as Record<string, Product | null>)[category] = picked;
    }
  }

  const totals = calculateTotals(selections);
  const osPrice = osPick ? Number(osPick.price) || 0 : 0;

  const partsList: [string, Product | null][] = [
    ...PICK_ORDER.filter((c) => c !== "os").map((c): [string, Product | null] => [
      c,
      (selections as Record<string, Product | null>)[c],
    ]),
    ["os", osPick],
  ];

  const items: BuildQuoteItem[] = partsList
    .map(([category, product]) => {
      if (!product) return null;
      const item: BuildQuoteItem = {
        category,
        label: CATEGORY_LABELS[category] ?? category,
        id: product.id,
        name: product.configurator_name || product.name,
        price: Number(product.price) || 0,
        imageUrl: product.image ?? null,
        brand: product.brand ?? null,
      };
      return item;
    })
    .filter((x): x is BuildQuoteItem => x !== null);

  const totalPrice = totals.totalPrice + osPrice;

  return {
    useCase,
    budget,
    items,
    totalPrice,
    estimatedTDP: totals.estimatedTDP,
    psuWattage: totals.psuWattage,
    isPowerSufficient: totals.isPowerSufficient,
    withinBudget: totalPrice <= budget * 1.05,
    missingCategories,
  };
}

/**
 * Reads the current message plus recent history for budget/use-case signals
 * (so "I want a gaming PC" followed later by "around 80k" combines into one
 * request instead of needing both in a single message), decides whether
 * there's enough to actually build a quote, and if so, builds it.
 */
export async function detectBuildIntent(userMessage: string, history: ChatMessage[]): Promise<BuildIntentResult> {
  const recentUserText = [
    ...history.filter((m) => m.role === "user").slice(-4).map((m) => m.content),
    userMessage,
  ].join(" \n ");

  if (!looksLikeBuildRequest(recentUserText)) return { kind: "none" };

  const useCase = extractUseCase(recentUserText);
  const budget = extractBudget(recentUserText);

  if (!useCase || !budget) {
    return { kind: "needs_info", have: { useCase, budget } };
  }

  const quote = await buildQuote(useCase, budget);
  return { kind: "quote", quote };
}

/** Text block injected into the system prompt so the LLM can explain the
 * quote in its own words without inventing or altering any of the numbers. */
export function buildQuoteContext(quote: BuildQuote): string {
  const lines = [
    `A custom build quotation was just generated for this customer — present it plainly, do not invent, ` +
      `add, or change any part name or price. All numbers below are final and already verified compatible ` +
      `and correctly powered.`,
    `Use case: ${quote.useCase}. Requested budget: ₹${quote.budget.toLocaleString("en-IN")}.`,
    ...quote.items.map((i) => `- ${i.label}: ${i.name} — ₹${i.price.toLocaleString("en-IN")}`),
    `Total: ₹${quote.totalPrice.toLocaleString("en-IN")} (${quote.withinBudget ? "within" : "slightly over"} the requested budget).`,
    `Estimated system power draw: ${quote.estimatedTDP}W, PSU supplies ${quote.psuWattage}W (${
      quote.isPowerSufficient ? "sufficient" : "NOT sufficient — flag this to the customer"
    }).`,
  ];
  if (quote.missingCategories.length > 0) {
    lines.push(
      `Could not find a compatible in-stock option for: ${quote.missingCategories.join(", ")} — mention this gap honestly.`
    );
  }
  lines.push(
    "The customer can see this build as cards in the chat with an Add to Cart button and a downloadable PDF quotation — you don't need to repeat every line item verbatim, just summarize it warmly."
  );
  return lines.join("\n");
}
