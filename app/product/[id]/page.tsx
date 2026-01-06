// app/product/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import ProductClient from "./ProductClient";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// 1. Define the props type as a Promise (Next.js 15 Requirement)
type Props = {
  params: Promise<{ id: string }>;
};

// Fetch data helper
async function getProduct(id: string) {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  return data;
}

// 2. DYNAMIC METADATA (Async)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; // <--- MUST AWAIT PARAMS HERE
  const product = await getProduct(id);
  
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | Premium Gaming PC | Rig Builders`,
    description: `Buy the ${product.name}. Features: ${product.specs?.gpu || 'High Performance'}.`,
    openGraph: { images: [product.image_url] },
  };
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