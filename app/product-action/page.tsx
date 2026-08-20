"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { supabase } from "@/lib/supabaseClient";

/**
 * Bridge route for links that arrive from outside an active browser session
 * (WhatsApp/Messenger/Instagram product-card buttons). The cart
 * (CartContext) is purely client-side/localStorage — there's no server-side
 * cart or session, so a chat button can't just link straight to /checkout or
 * /cart expecting the item to already be there. This page does the one thing
 * a fresh page load needs: fetch the product, add it to the (empty,
 * newly-created) local cart, then continue on to the real page — mirroring
 * exactly what ChatProductCard's handleAction() already does for the
 * website's own chat widget, just triggered by a URL instead of a click.
 *
 * Usage: /product-action?id=<product id>&action=buy|cart
 */
function ProductActionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    const action = searchParams.get("action") === "buy" ? "buy" : "cart";

    if (!id) {
      setError("Missing product.");
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price, image_url, category, cod_policy, in_stock")
        .eq("id", id)
        .single();

      if (cancelled) return;

      if (fetchError || !product) {
        setError("We couldn't find that product — it may no longer be available.");
        return;
      }

      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || undefined,
        category: product.category,
        cod_policy: product.cod_policy || "full_cod",
      });

      router.replace(action === "buy" ? "/checkout" : "/cart");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6">
      {error ? (
        <>
          <p className="text-white text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-brand-purple text-sm underline underline-offset-2"
          >
            Go to homepage
          </button>
        </>
      ) : (
        <>
          <div className="w-8 h-8 border-2 border-white/20 border-t-brand-purple rounded-full animate-spin" />
          <p className="text-brand-silver text-sm">Adding to your cart...</p>
        </>
      )}
    </div>
  );
}

export default function ProductActionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-brand-purple rounded-full animate-spin" />
        </div>
      }
    >
      <ProductActionInner />
    </Suspense>
  );
}
