import type { Metadata } from "next";
import ProductHubClient from "./ProductHubClient";
import { getHubCategories } from "@/lib/categories.server";

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
export default async function ProductHubPage() {
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