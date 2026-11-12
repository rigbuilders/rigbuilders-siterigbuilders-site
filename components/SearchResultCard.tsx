"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { toast } from "sonner";
import { FaShoppingCart, FaArrowRight } from "react-icons/fa";

interface Product {
  id: string;
  name: string;
  breadcrumb_name: string | null;
  price: number | null;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  in_stock?: boolean | null;
}

/**
 * Search-result product card — mirrors the category-page card.
 * Clicking anywhere on the card opens the product page; the Add / Buy buttons
 * stop propagation so they act without navigating.
 */
export default function SearchResultCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const title = product.breadcrumb_name?.trim() || product.name;
  const inStock = product.in_stock !== false;

  const act = (e: React.MouseEvent, buyNow: boolean) => {
    e.stopPropagation();
    addToCart({ id: product.id, name: title, price: product.price, image: product.image_url });
    if (buyNow) router.push("/checkout");
    else toast.success("Added to Gear", {
      description: `${title} is secure in your cart.`,
      action: { label: "View Cart", onClick: () => router.push("/cart") },
    });
  };

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className="group relative rb-surface-card overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {!inStock && (
        <div className="absolute top-3 right-3 z-20 bg-rb-danger text-white text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-widest">
          Out of Stock
        </div>
      )}

      <div className="relative aspect-square w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-rb-surface to-transparent border-b border-rb-line">
        <div className="absolute inset-0 bg-rb-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl z-0" />
        {product.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover relative z-10 group-hover:scale-[1.1] transition-transform duration-700" />
        ) : (
          <span className="text-rb-silver/20 font-saira text-xl font-bold -rotate-12 select-none px-4 text-center">{title}</span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow relative z-10">
        {product.brand && (
          <span className="text-[10px] font-bold text-rb-silver tracking-[0.2em] uppercase mb-2 block">{product.brand}</span>
        )}
        <h2 className="text-rb-white font-saira text-sm leading-tight uppercase line-clamp-2 group-hover:text-rb-orange transition-colors mb-2 min-h-[36px]">{title}</h2>
        {product.category && (
          <span className="text-[11px] text-rb-silver/70 uppercase tracking-wide mb-4">{product.category}</span>
        )}

        <div className="mt-auto pt-4 border-t border-rb-line">
          <div className="mb-3">
            <p className="text-[10px] text-rb-silver uppercase tracking-widest mb-0.5">Price</p>
            <span className="text-rb-white font-saira font-bold text-lg">
              {typeof product.price === "number" ? `₹${product.price.toLocaleString("en-IN")}` : "On request"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => act(e, false)}
              disabled={!inStock}
              className="flex-1 h-10 rounded-lg border border-rb-line text-rb-white text-[10px] font-bold uppercase tracking-widest hover:border-rb-orange hover:text-rb-orange transition-all flex items-center justify-center gap-1.5 disabled:opacity-20"
            >
              <FaShoppingCart size={11} /> Add
            </button>
            <button
              onClick={(e) => act(e, true)}
              disabled={!inStock}
              className="flex-1 h-10 rounded-lg bg-rb-orange text-rb-orange-ink text-[10px] font-bold uppercase tracking-widest hover:bg-rb-orange-deep transition-all flex items-center justify-center gap-1.5 disabled:opacity-20"
            >
              Buy Now <FaArrowRight size={9} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
