import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CategoryClient from './CategoryClient';
import { getCategory, getCanonicalRedirect } from '@/app/data/categories';

type SearchParams = { [key: string]: string | string[] | undefined };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// 1. SEO METADATA (Server Side) — now varies by funnel step (maker/series/chipset).
export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> }
): Promise<Metadata> {
  const { category } = await params;
  const sp = await searchParams;
  const cat = getCategory(category);

  if (!cat) return { title: "Category Not Found" };

  const maker = one(sp.maker);
  const series = one(sp.series);
  const chipset = one(sp.chipset);
  const brand = one(sp.brand);

  let title: string;
  let description: string;

  if (chipset) {
    title = `Buy ${chipset} — Price in India | Rig Builders`;
    description = `Shop the ${chipset} at Rig Builders. Genuine stock, official warranty, and insured shipping across India.`;
  } else if (maker) {
    const label = series ? `${maker} ${series}` : `${maker} ${cat.short}s`;
    title = `${label} | Rig Builders India`;
    description = `Explore ${label} at Rig Builders — premium components with official warranty and secure delivery.`;
  } else if (brand) {
    title = `${brand} ${cat.short}s | Rig Builders India`;
    description = `Shop ${brand} ${cat.short}s at Rig Builders with official warranty and pan-India shipping.`;
  } else {
    title = `Buy ${cat.title} | Rig Builders India`;
    description = `Shop premium ${cat.title} at Rig Builders. High-performance components, official warranty, and secure shipping across India.`;
  }

  return {
    title,
    description,
    // Canonical always points at the clean category URL so filter/funnel query
    // params don't create duplicate-content variants in the index.
    alternates: { canonical: `/products/${cat.slug}` },
    openGraph: { title, description, url: `https://www.rigbuilders.in/products/${cat.slug}`, type: 'website' },
  };
}

// 2. MAIN PAGE (Server Side) — fetches products so the grid is server-rendered (SEO + instant paint).
export default async function Page(
  { params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> }
) {
  const { category } = await params;
  const sp = await searchParams;

  // Redirect non-canonical aliases (e.g. /products/memory -> /products/ram).
  const canonical = getCanonicalRedirect(category);
  if (canonical) {
    const qs = new URLSearchParams(
      Object.entries(sp).flatMap(([k, v]) =>
        v === undefined ? [] : [[k, Array.isArray(v) ? v[0] : v]] as [string, string][]
      )
    ).toString();
    redirect(`/products/${canonical}${qs ? `?${qs}` : ''}`);
  }

  const cat = getCategory(category);
  if (!cat) notFound();

  // Fetch + normalise products on the server (dedupe variant groups).
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category', cat!.db)
    .order('created_at', { ascending: true });

  const seenGroups = new Set<string>();
  const initialProducts = (data || []).reduce((acc: any[], p: any) => {
    const formatted = { ...p, image: p.image_url, ...(p.specs || {}) };
    if (p.variant_group_id) {
      if (!seenGroups.has(p.variant_group_id)) {
        seenGroups.add(p.variant_group_id);
        acc.push(formatted);
      }
    } else {
      acc.push(formatted);
    }
    return acc;
  }, []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-brand-purple">
          <div className="text-xl font-orbitron mb-2 tracking-widest animate-pulse">LOADING CATEGORY...</div>
          <div className="h-[1px] w-24 bg-brand-purple"></div>
        </div>
      }
    >
      <CategoryClient category={cat!.slug} initialProducts={initialProducts} />
    </Suspense>
  );
}
