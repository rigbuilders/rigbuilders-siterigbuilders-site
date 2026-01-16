// app/product/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import ProductClient from "./ProductClient";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  
  // Fetch single product for SEO
  const { data: product } = await supabase
    .from('products')
    .select('name, description, image_url')
    .eq('id', id)
    .single();

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name, // Will become: "NVIDIA RTX 4090 | Rig Builders India"
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
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  return data;
}

// 3. MAIN PAGE COMPONENT (Async)
export default async function ProductPage({ params }: Props) {
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