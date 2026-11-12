import type { Metadata } from "next";
import ProductHubClient from "./ProductHubClient";
import SearchResults from "./SearchResults";
import { getHubCategories } from "@/lib/categories.server";

type SearchParams = { [key: string]: string | string[] | undefined };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Results reflect live stock and pricing, so this can't be statically cached
// the way the category hub alone could be.
export const revalidate = 0;

// 1. SET PROPER SEO METADATA
export const metadata: Metadata = {
  title: "PC Components Store | Processors, GPUs & More",
  description: "Explore the complete Rig Builders component ecosystem. Buy Processors, Graphics Cards, Motherboards, and Storage with official warranty.",
  openGraph: {
    title: "PC Components Ecosystem - Rig Builders",
    description: "Premium hardware for your dream build. Official warranty and insured shipping.",
    url: "https://www.rigbuilders.in/products",
    type: "website",
    images: [
        {
          url: "/opengraph-image.png", // Ensure this image exists in your public folder
          width: 1200,
          height: 630,
          alt: "Rig Builders Components",
        },
    ],
  },
};

// 2. RENDER THE CLIENT UI (categories fetched server-side, DB-driven with fallback)
export default async function ProductHubPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // GlobalSearch.tsx navigates here on Enter, and the site's JSON-LD
  // SearchAction points Google at this URL too — both were silently ignored
  // until now, dropping the query and showing the generic hub.
  const query = one((await searchParams).search)?.trim();
  if (query) return <SearchResults query={query} />;

  const hubCategories = await getHubCategories();
  const cards = hubCategories.map((c) => ({
    id: c.slug,
    name: c.hub!.name,
    sub: c.hub!.sub,
    desc: c.hub!.desc,
    image: c.hub!.image,
  }));
  return <ProductHubClient categories={cards} />;
}