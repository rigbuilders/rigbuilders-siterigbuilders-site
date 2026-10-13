import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { toProductCards, type ProductCard } from "@/lib/chatbot/product-knowledge";
import type { MenuFilters } from "@/lib/chatbot/guided-menu";

export const dynamic = "force-dynamic";

/**
 * Resolves the guided menu's data-driven steps (see lib/chatbot/guided-menu.ts)
 * against the live catalogue. Three kinds:
 *
 *   GET ?step=brands&category=cpu
 *   GET ?step=sockets&category=cpu&brand=AMD
 *   GET ?step=products&category=cpu&brand=AMD&socket=AM5
 *
 * Every query filters on listing_status='published', exactly as the chatbot's
 * own product lookup does, so an unpublished product is invisible here too —
 * the menu and the assistant can never disagree about what's for sale.
 *
 * `choices` comes back EMPTY rather than erroring when an attribute isn't
 * usable (no socket data on these rows, only one brand in the category). The
 * widget reads that as "skip this step", which is what keeps a sparsely
 * populated spec field from producing a dead-end screen.
 */

const PUBLISHED = "published";

interface ChoiceResponse {
  step: "brands" | "sockets";
  choices: { id: string; label: string; hint?: string }[];
}

interface ProductsResponse {
  step: "products";
  items: ProductCard[];
}

function readFilters(req: NextRequest): MenuFilters {
  const p = req.nextUrl.searchParams;
  const take = (k: string) => p.get(k)?.trim() || undefined;
  return {
    category: take("category"),
    brand: take("brand"),
    socket: take("socket"),
    series: take("series"),
  };
}

/** Case-insensitive de-duplication that keeps the catalogue's own casing. */
function distinct(values: (string | null | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    const trimmed = v?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) seen.set(key, trimmed);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * Socket lives inside the free-form `specs` JSON rather than its own column,
 * and isn't guaranteed to be populated. Reading the whole JSON and picking the
 * key out here (rather than with a PostgREST JSON operator) keeps this working
 * whatever shape the spec takes, and the catalogue is small enough that the
 * extra bytes don't matter.
 */
function socketOf(specs: unknown): string | undefined {
  if (!specs || typeof specs !== "object") return undefined;
  const record = specs as Record<string, unknown>;
  for (const key of ["socket", "cpu_socket", "socket_type"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const step = req.nextUrl.searchParams.get("step");
  const filters = readFilters(req);

  if (step !== "brands" && step !== "sockets" && step !== "products") {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }

  try {
    if (step === "brands") {
      if (!filters.category) return NextResponse.json({ error: "category is required" }, { status: 400 });

      const { data, error } = await supabaseAdmin
        .from("products")
        .select("brand")
        .eq("listing_status", PUBLISHED)
        .eq("category", filters.category);

      if (error) throw new Error(error.message);

      const brands = distinct((data ?? []).map((r) => (r as { brand: string | null }).brand));
      // One brand is not a choice — skip the step rather than showing a
      // single-option screen.
      const body: ChoiceResponse = {
        step: "brands",
        choices: brands.length < 2 ? [] : brands.map((b) => ({ id: b, label: b })),
      };
      return NextResponse.json(body);
    }

    if (step === "sockets") {
      if (!filters.category) return NextResponse.json({ error: "category is required" }, { status: 400 });

      let query = supabaseAdmin
        .from("products")
        .select("specs")
        .eq("listing_status", PUBLISHED)
        .eq("category", filters.category);

      if (filters.brand) query = query.ilike("brand", filters.brand);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const sockets = distinct((data ?? []).map((r) => socketOf((r as { specs: unknown }).specs)));
      const body: ChoiceResponse = {
        step: "sockets",
        choices: sockets.length < 2 ? [] : sockets.map((s) => ({ id: s, label: s })),
      };
      return NextResponse.json(body);
    }

    // step === "products"
    let query = supabaseAdmin
      .from("products")
      .select("id, name, breadcrumb_name, configurator_name, nickname, brand, category, price, mrp, warranty, in_stock, description, features, specs, series, tier, image_url")
      .eq("listing_status", PUBLISHED)
      .order("price", { ascending: true })
      .limit(24);

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.brand) query = query.ilike("brand", filters.brand);
    if (filters.series) query = query.ilike("series", filters.series);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows = (data ?? []) as Parameters<typeof toProductCards>[0];

    // Socket is filtered in memory for the same reason it's read in memory
    // above — it lives in free-form JSON, so there's no reliable column to
    // push this into the query.
    if (filters.socket) {
      const wanted = filters.socket.toLowerCase();
      rows = rows.filter((r) => socketOf(r.specs)?.toLowerCase() === wanted);
    }

    const body: ProductsResponse = { step: "products", items: toProductCards(rows).slice(0, 8) };
    return NextResponse.json(body);
  } catch (err) {
    console.error(`[chatbot:menu] ${step} lookup failed: ${(err as Error).message}`);
    // Empty rather than a 500: the widget's fallback is to offer the
    // assistant instead, which is a better outcome than an error bubble.
    return NextResponse.json(
      step === "products" ? { step, items: [] } : { step, choices: [] },
      { status: 200 }
    );
  }
}
