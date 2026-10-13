import { supabase } from "@/lib/supabaseClient";
import { onlyVisible } from "@/lib/productVisibility";
import MobileProductClient from "./MobileProductClient";
import { notFound } from "next/navigation";

export default async function MobileProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Grabs the product securely on the server (visible products only).
  const { data: product } = await onlyVisible(
    supabase
      .from('products')
      .select('*, cod_policy')
      .eq('id', id)
  ).single();

  if (!product) notFound(); 

  return <MobileProductClient initialProduct={product} id={id} />;
}