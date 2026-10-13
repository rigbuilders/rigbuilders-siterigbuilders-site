import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { toProductCards, type ProductCard } from "./product-knowledge";
import type { MenuFilters } from "./guided-menu";

/**
 * Catalogue lookups behind the guided menu's data-driven steps.
 *
 * Lives here rather than inside the API route because WhatsApp needs the same
 * answers without an HTTP hop — the website widget calls these through
 * /api/chatbot/menu, the WhatsApp engine (whatsapp-menu.ts) calls them
 * directly, and both get identical results because it's the same function.
 *
 * Every query filters on listing_status='published', exactly as
 * product-knowledge.ts does, so a draft product is invisible to the menu for
 * the same reason it's invisible to the assistant.
 */

const PUBLISHED = "published";

const PRODUCT_SELECT =
  "id, name, breadcrumb_name, configurator_name, nickname, brand, category, price, mrp, warranty, in_stock, description, features, specs, series, tier, image_url";

export interface MenuChoice {
  id: string;
  label: string;
  hint?: string;
}

/** Case-insensitive de-duplication that keeps the catalogue's own casing. */
function distinct(values: (string | null | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) seen.set(key, trimmed);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * Socket lives inside the free-form `specs` JSON rather than its own column,
 * and isn't guaranteed to be populated. Reading the JSON and picking the key
 * out in JS (rather than with a PostgREST JSON operator) keeps this working
 * whatever shape the spec takes, and tolerates the three key spellings the
 * catalogue has used.
 */
export function socketOf(specs: unknown): string | undefined {
  if (!specs || typeof specs !== "object") return undefined;
  const record = specs as Record<string, unknown>;
  for (const key of ["socket", "cpu_socket", "socket_type"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Fewer than two distinct values is not a choice — callers treat an empty
 * array as "skip this step", which is what stops a sparsely-populated
 * attribute from producing a dead-end screen.
 */
export async function resolveBrands(filters: MenuFilters): Promise<MenuChoice[]> {
  if (!filters.category) return [];
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("brand")
    .eq("listing_status", PUBLISHED)
    .eq("category", filters.category);

  if (error) {
    console.error(`[chatbot:menu-data] brands lookup failed: ${error.message}`);
    return [];
  }

  const brands = distinct((data ?? []).map((r) => (r as { brand: string | null }).brand));
  return brands.length < 2 ? [] : brands.map((b) => ({ id: b, label: b }));
}

export async function resolveSockets(filters: MenuFilters): Promise<MenuChoice[]> {
  if (!filters.category) return [];
  let query = supabaseAdmin
    .from("products")
    .select("specs")
    .eq("listing_status", PUBLISHED)
    .eq("category", filters.category);

  if (filters.brand) query = query.ilike("brand", filters.brand);

  const { data, error } = await query;
  if (error) {
    console.error(`[chatbot:menu-data] sockets lookup failed: ${error.message}`);
    return [];
  }

  const sockets = distinct((data ?? []).map((r) => socketOf((r as { specs: unknown }).specs)));
  return sockets.length < 2 ? [] : sockets.map((s) => ({ id: s, label: s }));
}

export interface MenuProductDetail {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[] | null;
  imageUrl: string | null;
}

/**
 * Full detail for one product, for when a customer picks a row out of a
 * WhatsApp list and we send the rich card. Returns the fields ReplyMeta needs
 * — resolveProducts' card shape deliberately omits description and features
 * because the website renders those from its own page.
 */
export async function getProductDetail(id: string): Promise<MenuProductDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, breadcrumb_name, price, description, features, image_url")
    .eq("id", id)
    .eq("listing_status", PUBLISHED)
    .maybeSingle<{
      id: string;
      name: string;
      breadcrumb_name: string | null;
      price: number;
      description: string | null;
      features: string[] | null;
      image_url: string | null;
    }>();

  if (error || !data) {
    if (error) console.error(`[chatbot:menu-data] product detail failed: ${error.message}`);
    return null;
  }

  return {
    id: data.id,
    name: data.breadcrumb_name?.trim() || data.name,
    price: data.price,
    description: data.description,
    features: data.features,
    imageUrl: data.image_url,
  };
}

export async function resolveProducts(filters: MenuFilters, limit = 8): Promise<ProductCard[]> {
  let query = supabaseAdmin
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("listing_status", PUBLISHED)
    .order("price", { ascending: true })
    .limit(24);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.brand) query = query.ilike("brand", filters.brand);
  if (filters.series) query = query.ilike("series", filters.series);

  const { data, error } = await query;
  if (error) {
    console.error(`[chatbot:menu-data] products lookup failed: ${error.message}`);
    return [];
  }

  let rows = (data ?? []) as Parameters<typeof toProductCards>[0];

  // Socket is filtered in memory for the same reason it's read in memory —
  // it lives in free-form JSON with no reliable column to push this into.
  if (filters.socket) {
    const wanted = filters.socket.toLowerCase();
    rows = rows.filter((r) => socketOf(r.specs)?.toLowerCase() === wanted);
  }

  return toProductCards(rows).slice(0, limit);
}
