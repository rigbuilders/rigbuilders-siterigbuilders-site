// lib/categories.server.ts
// Server-side category source: reads the DB `categories` table (so categories
// created in admin surface on the storefront), and FALLS BACK to the hardcoded
// app/data/categories.ts if the DB is empty or unreachable. This keeps the site
// working even before the seed SQL is run, and if Supabase ever hiccups.
//
// Returns the SAME CategoryConfig shape the rest of the app already uses, so
// downstream code (hub cards, funnel gating, breadcrumbs) is unchanged.

import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES as CODE_CATEGORIES, type CategoryConfig } from "@/app/data/categories";

function rowToConfig(row: any): CategoryConfig {
  const showInHub = !!row.show_in_hub && !!row.image_url;
  return {
    slug: row.id,
    db: row.id,
    title: row.name || row.id,
    short: row.short_name || row.name || row.id,
    funnel: row.funnel === "landing" ? "landing" : "simple",
    hubStep: !!row.hub_step,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    hub: showInHub
      ? {
          name: row.card_title || row.name,
          sub: row.subtitle || "",
          desc: row.description || "",
          image: row.image_url,
          order: row.sort_order ?? 100,
        }
      : undefined,
  };
}

/** All active categories, DB-first with code fallback. */
export async function getAllCategories(): Promise<CategoryConfig[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return CODE_CATEGORIES;
    return data.map(rowToConfig);
  } catch {
    return CODE_CATEGORIES;
  }
}

/** Resolve a slug (or alias) to its category, DB-first with code fallback. */
export async function getCategoryBySlug(slug: string): Promise<CategoryConfig | undefined> {
  const s = slug.toLowerCase();
  const all = await getAllCategories();
  return all.find((c) => c.slug === s || (c.aliases || []).includes(s));
}

/** If `slug` is a non-canonical alias, returns the canonical slug to redirect to. */
export async function getCanonicalRedirectDB(slug: string): Promise<string | null> {
  const c = await getCategoryBySlug(slug);
  if (!c) return null;
  return c.slug !== slug.toLowerCase() ? c.slug : null;
}

/** Categories shown on the /products hub grid, in order. */
export async function getHubCategories(): Promise<CategoryConfig[]> {
  const all = await getAllCategories();
  return all.filter((c) => c.hub).sort((a, b) => (a.hub!.order - b.hub!.order));
}

/** Canonical slugs (for the sitemap). */
export async function getCategorySlugs(): Promise<string[]> {
  return (await getAllCategories()).map((c) => c.slug);
}

/** Look up a tagged image from site_assets (returns null if missing). */
export async function getAsset(tag: string): Promise<{ path: string; alt: string | null } | null> {
  try {
    const { data } = await supabase.from("site_assets").select("path, alt").eq("tag", tag).eq("active", true).single();
    return data ? { path: data.path, alt: data.alt } : null;
  } catch {
    return null;
  }
}

/** Batch look up tagged image paths → { tag: path }. Missing tags are simply absent. */
export async function getAssets(tags: string[]): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.from("site_assets").select("tag, path").in("tag", tags).eq("active", true);
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.tag] = r.path; });
    return map;
  } catch {
    return {};
  }
}
