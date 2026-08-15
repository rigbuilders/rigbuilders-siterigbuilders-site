"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/app/context/CartContext";

export interface ChatProductCardData {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  imageUrl: string | null;
  inStock: boolean;
  category: string;
  brand: string | null;
}

/**
 * Product card rendered inline in the chat widget. Mirrors the existing
 * Add to Cart / Buy Now behavior from app/product/[id]/ProductClient.tsx
 * (same addToCart shape, same "Added to Gear" toast) so the widget feels
 * consistent with the rest of the site rather than inventing its own flow.
 */
export default function ChatProductCard({ product }: { product: ChatProductCardData }) {
  const router = useRouter();
  const { addToCart } = useCart();

  function goToProduct() {
    router.push(`/product/${product.id}`);
  }

  function handleAction(isBuyNow: boolean) {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || undefined,
      category: product.category,
    });

    if (isBuyNow) {
      router.push("/checkout");
    } else {
      toast.success("Added to Gear", {
        description: `${product.name} is secure in your cart.`,
        action: { label: "Checkout", onClick: () => router.push("/cart") },
      });
    }
  }

  const hasDiscount = typeof product.mrp === "number" && product.mrp > product.price;

  return (
    <div className="flex gap-3 bg-[#121212] border border-white/10 rounded-xl p-2.5">
      <button
        onClick={goToProduct}
        className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[#1A1A1A] border border-white/10"
        title="View details"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-silver/40 text-[9px] text-center px-1">
            No image
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <button
          onClick={goToProduct}
          className="text-left text-xs font-bold text-white leading-snug line-clamp-2 hover:text-brand-purple transition-colors"
        >
          {product.name}
        </button>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-sm font-bold text-white">₹{product.price.toLocaleString("en-IN")}</span>
          {hasDiscount && (
            <span className="text-[11px] text-brand-silver/60 line-through">
              ₹{product.mrp!.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {!product.inStock && <p className="text-[10px] text-red-400 mt-0.5">Out of stock</p>}

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleAction(false)}
            disabled={!product.inStock}
            title="Add to Cart"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={!product.inStock}
            title="Buy Now"
            className="w-7 h-7 rounded-full bg-brand-purple hover:scale-105 flex items-center justify-center disabled:opacity-30 transition-transform"
          >
            <Zap className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={goToProduct}
            className="text-[11px] text-brand-silver hover:text-white underline underline-offset-2 transition-colors ml-auto"
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
