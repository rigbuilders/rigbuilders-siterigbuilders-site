/**
 * Listing completeness — the DERIVED `listing_created` value.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  KEEP IN SYNC with the listing-pipeline-app's                          │
 * │  sidecar/src/stages/fieldRequirements.ts + completeness.ts.            │
 * │  Both apps write `listing_created` to the SAME products table. If a     │
 * │  category's required fields differ between the two, a product will      │
 * │  flip between visible and hidden depending on which app saved it last.  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Tri-state, computed from field presence — never set by hand:
 *   'true'    every required field for the product's category is filled
 *   'partial' some are filled
 *   'false'   none are filled
 *
 * Required = the six UNIVERSAL product columns + that category's specs.* keys.
 */

export type ListingCreated = "true" | "partial" | "false";

// The six universal columns every product needs, regardless of category.
const UNIVERSAL_FIELDS = [
  "name",
  "breadcrumb_name",
  "brand",
  "warranty",
  "description",
  "features",
] as const;

// Per-category required specs.* jsonb keys.
// NOTE: cpu / gpu / ram and the "nothing extra" categories (os, prebuilt and
// the accessory categories) are the ones specified in the handoff. Categories
// NOT listed here fall back to the universal six only — if the pipeline app
// requires more specs for them (e.g. motherboard, storage, cooler, psu,
// cabinet), add them here to match or products will flip between apps.
const SPEC_REQUIREMENTS: Record<string, string[]> = {
  cpu: ["socket", "wattage"],
  gpu: ["chipset_maker", "chipset_series", "chipset", "vram", "memory_type", "length_mm", "wattage"],
  ram: ["memory_type", "capacity"],
  // Explicitly "nothing beyond the universal six":
  os: [],
  prebuilt: [],
  monitor: [],
  keyboard: [],
  mouse: [],
  combo: [],
  mousepad: [],
  usb: [],
};

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return Boolean(value);
}

function requiredFieldsFor(category: string | null | undefined): { universal: string[]; specs: string[] } {
  const cat = (category || "").toLowerCase();
  const specs = SPEC_REQUIREMENTS[cat] ?? []; // undocumented category → universal only
  return { universal: [...UNIVERSAL_FIELDS], specs };
}

/**
 * Names of every required field that is currently empty on this product.
 * Universal columns are returned as-is; spec keys are prefixed "specs.".
 */
export function missingListingFields(product: any): string[] {
  if (!product) return [...UNIVERSAL_FIELDS];
  const { universal, specs } = requiredFieldsFor(product.category);
  const specBag = product.specs ?? {};

  const missing: string[] = [];
  for (const f of universal) {
    if (!isPresent(product[f])) missing.push(f);
  }
  for (const key of specs) {
    if (!isPresent(specBag[key])) missing.push(`specs.${key}`);
  }
  return missing;
}

/**
 * The tri-state completeness value for `listing_created`.
 * 'true' = nothing missing, 'false' = nothing filled, 'partial' = some filled.
 */
export function computeListingCreated(product: any): ListingCreated {
  if (!product) return "false";
  const { universal, specs } = requiredFieldsFor(product.category);
  const specBag = product.specs ?? {};

  const required: boolean[] = [
    ...universal.map((f) => isPresent(product[f])),
    ...specs.map((k) => isPresent(specBag[k])),
  ];

  const total = required.length;
  const filled = required.filter(Boolean).length;

  if (filled === 0) return "false";
  if (filled === total) return "true";
  return "partial";
}
