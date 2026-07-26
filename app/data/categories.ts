// app/data/categories.ts
// SINGLE SOURCE OF TRUTH for the component category taxonomy.
//
// Previously the category list was duplicated across ProductHubClient, the
// [category] page, CategoryClient, ProductBreadcrumb and sitemap.ts — and had
// already drifted (memory vs ram, hub showing 8 vs sitemap 14). Everything now
// imports from here.

export type FunnelType = "landing" | "simple";

export interface HubCard {
  name: string;   // big title on the hub card, e.g. "GRAPHICS CARD"
  sub: string;    // small kicker
  desc: string;   // one-line description
  image: string;  // background image
  order: number;  // display order on the hub grid
}

export interface CategoryConfig {
  slug: string;        // canonical URL slug (what we link to + put in the sitemap)
  db: string;          // value stored in products.category
  title: string;       // full nice title, e.g. "Graphics Cards (GPU)"
  short: string;       // short label for breadcrumbs, e.g. "Graphics Card"
  funnel: FunnelType;  // "landing" => brand/maker landing funnel (gpu/cpu/motherboard)
  hubStep?: boolean;   // has a ChipsetHub step (series → model): gpu, motherboard
  aliases?: string[];  // alternate slugs that should redirect here (e.g. memory → ram)
  hub?: HubCard;       // present if the category appears on the /products hub grid
}

export const CATEGORIES: CategoryConfig[] = [
  {
    slug: "cpu", db: "cpu", title: "Processors (CPU)", short: "Processor",
    funnel: "landing",
    hub: { name: "PROCESSORS", sub: "CORE ARCHITECTURE", desc: "Intel Core Ultra & AMD Ryzen", image: "/images/Products/cpuv1.jpg", order: 1 },
  },
  {
    slug: "gpu", db: "gpu", title: "Graphics Cards (GPU)", short: "Graphics Card",
    funnel: "landing", hubStep: true,
    hub: { name: "GRAPHICS CARD", sub: "VISUAL ENGINES", desc: "NVIDIA RTX, Intel ARC & AMD Radeon", image: "/images/Products/gpuv1.jpg", order: 2 },
  },
  {
    slug: "motherboard", db: "motherboard", title: "Motherboards", short: "Motherboard",
    funnel: "landing", hubStep: true,
    hub: { name: "MOBO", sub: "SYSTEM FOUNDATION", desc: "Z790, X670 & B650 Chipsets", image: "/images/Products/mobov2.jpg", order: 3 },
  },
  {
    slug: "storage", db: "storage", title: "SSD & Storage", short: "Storage",
    funnel: "simple",
    hub: { name: "STORAGE", sub: "DATA VAULTS", desc: "NVMe Gen4 & Gen5 Solutions", image: "/images/Products/nvmev2.jpg", order: 4 },
  },
  {
    slug: "cabinet", db: "cabinet", title: "PC Cabinets", short: "Cabinet",
    funnel: "simple",
    hub: { name: "CHASSIS", sub: "ARMOR PLATING", desc: "Mid-Tower, Full-Tower & ITX", image: "/images/Products/pc cabinetv2.jpg", order: 5 },
  },
  {
    slug: "psu", db: "psu", title: "Power Supplies (PSU)", short: "Power Supply",
    funnel: "simple",
    hub: { name: "POWER", sub: "ENERGY REACTORS", desc: "Gold & Platinum Modular Units", image: "/images/Products/psuv2.jpg", order: 6 },
  },
  {
    slug: "ram", db: "ram", title: "Memory (RAM)", short: "Memory (RAM)",
    funnel: "simple", aliases: ["memory"],
    hub: { name: "MEMORY", sub: "SYSTEM CACHE", desc: "High-Bandwidth DDR5 Modules", image: "/images/Products/ramv2.jpg", order: 7 },
  },
  {
    slug: "cooler", db: "cooler", title: "CPU Coolers", short: "Cooler",
    funnel: "simple",
    hub: { name: "COOLING", sub: "THERMAL CONTROL", desc: "AIO Liquid & Air Solutions", image: "/images/Products/aiov2.jpg", order: 8 },
  },

  // Peripherals & extras — valid category pages, but not shown on the hub grid.
  { slug: "monitor", db: "monitor", title: "Gaming Monitors", short: "Monitor", funnel: "simple" },
  { slug: "keyboard", db: "keyboard", title: "Mechanical Keyboards", short: "Keyboard", funnel: "simple" },
  { slug: "mouse", db: "mouse", title: "Gaming Mice", short: "Mouse", funnel: "simple" },
  { slug: "combo", db: "combo", title: "Keyboard & Mouse Combos", short: "Combo", funnel: "simple" },
  { slug: "mousepad", db: "mousepad", title: "Mouse Pads", short: "Mouse Pad", funnel: "simple" },
  { slug: "usb", db: "usb", title: "USB Drives", short: "USB Drive", funnel: "simple" },
  { slug: "prebuilt", db: "prebuilt", title: "Pre-Built Gaming PCs", short: "Pre-Built", funnel: "simple" },
];

// --- Lookups -------------------------------------------------------------

const BY_SLUG = new Map<string, CategoryConfig>();
for (const c of CATEGORIES) {
  BY_SLUG.set(c.slug, c);
  for (const a of c.aliases || []) BY_SLUG.set(a, c);
}

/** Resolve a URL slug (including aliases like "memory") to its canonical config. */
export function getCategory(slug: string): CategoryConfig | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}

/** Is this slug (or alias) a real category? */
export function isValidCategory(slug: string): boolean {
  return BY_SLUG.has(slug.toLowerCase());
}

/** True when the slug is a non-canonical alias that should redirect (e.g. "memory"). */
export function getCanonicalRedirect(slug: string): string | null {
  const c = getCategory(slug);
  if (!c) return null;
  return c.slug !== slug.toLowerCase() ? c.slug : null;
}

/** Categories shown on the /products hub grid, in display order. */
export const HUB_CATEGORIES = CATEGORIES
  .filter((c) => c.hub)
  .sort((a, b) => (a.hub!.order - b.hub!.order));

/** All canonical slugs (for the sitemap). */
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
