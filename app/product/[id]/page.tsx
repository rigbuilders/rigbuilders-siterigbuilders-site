// app/product/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import ProductClient from "./ProductClient";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  // FIX: Await the params promise
  const { id } = await params;
  
  const { data: product } = await supabase
    .from('products')
    .select('name, description, image_url')
    .eq('id', id)
    .single();

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description?.slice(0, 160) || "View this product on Rig Builders.",
    openGraph: {
      images: [product.image_url || "/images/og-default.jpg"],
    },
  };
}

// 1. Define the props type as a Promise (Next.js 15 Requirement)
type Props = {
  params: Promise<{ id: string }>;
};

// Fetch data helper
async function getProduct(id: string) {
  // FIX: Explicitly select 'cod_policy' to ensure it passes to the Cart
  const { data } = await supabase
    .from('products')
    .select('*, cod_policy') 
    .eq('id', id)
    .single();
  return data;
}

// 3. MAIN PAGE COMPONENT (Async)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // <--- MUST AWAIT PARAMS HERE
  const product = await getProduct(id);

  if (!product) {
    notFound(); 
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: product.description,
    brand: { '@type': 'Brand', name: 'Rig Builders' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient initialProduct={product} id={id} />
    </>
  );
}