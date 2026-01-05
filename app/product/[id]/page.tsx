// app/product/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import ProductClient from "./ProductClient";
import { Metadata } from "next";

// Fetch data once on the server
async function getProduct(id: string) {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  return data;
}

// 1. DYNAMIC METADATA (The "Meta" Layer)
// This puts your Main Keyword (Product Name) in the browser tab and Google Link
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | Premium Gaming PC | Rig Builders`, // <--- KEYWORDS HERE
    description: `Buy the ${product.name}. Features: ${product.specs?.gpu || 'High Performance'}, ${product.specs?.cpu}. Best price in India.`, // <--- KEYWORDS HERE
    openGraph: {
      images: [product.image_url], // Shows this image when shared on WhatsApp/Twitter
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) return <div>Product not found</div>;

  // 2. JSON-LD SCHEMA (The "Schema" Layer)
  // This is invisible to users but GOLD for Google.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'Rig Builders',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      {/* Inject the Schema for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* 3. THE VISIBLE CONTENT (The "Content" Layer) */}
      {/* We pass the data here so the HTML is pre-filled with keywords when it loads */}
      <ProductClient initialProduct={product} id={params.id} />
    </>
  );
}