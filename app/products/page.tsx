import type { Metadata } from "next";
import ProductHubClient from "./ProductHubClient";

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

// 2. RENDER THE CLIENT UI
export default function ProductHubPage() {
  return <ProductHubClient />;
}