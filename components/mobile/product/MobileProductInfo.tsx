"use client";

import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaShoppingCart, FaBolt, FaExchangeAlt, FaShieldAlt, FaTruck, FaHandHoldingUsd } from "react-icons/fa";
import MobileVariantSelector from "./MobileVariantSelector";

export default function MobileProductInfo({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();
  
  const mrp = product.mrp || Math.round(product.price * 1.18);
  const discount = Math.round(((mrp - product.price) / mrp) * 100);

  const handleAction = (isBuyNow: boolean) => {
    addToCart({ ...product, image: product.image_url, cod_policy: product.cod_policy || 'full_cod' });
    if (isBuyNow) router.push("/m/checkout");
    else toast.success("Added to Gear", { description: `${product.name} secured in cart.` });
  };

  const CircleIcon = ({ icon, title, sub }: any) => (
      <div className="flex flex-col items-center gap-2 w-16">
          <div className="w-12 h-12 rounded-full border border-[#4E2C8B] bg-[#1A1A1A] flex items-center justify-center text-white text-lg shadow-[0_0_10px_rgba(78,44,139,0.2)]">{icon}</div>
          <div className="text-center">
              <p className="text-[9px] font-bold text-white uppercase leading-tight">{title}</p>
              <p className="text-[7px] text-[#A0A0A0] uppercase">{sub}</p>
          </div>
      </div>
  );

  return (
    <div className="p-6 pb-6 border-b border-white/5 bg-[#050505]">
       
       {/* BADGES (Level & Stock) */}
       <div className="flex items-center gap-3 mb-4">
           <span className="text-[#B084FF] font-bold text-[10px] bg-[#B084FF]/10 px-3 py-1 rounded border border-[#B084FF]/20 uppercase tracking-widest">
               {product.category === 'prebuilt' ? `LEVEL ${product.tier || "X"}` : product.brand || "BRAND"}
           </span>
           {product.in_stock ? (
                <span className="text-[#22c55e] text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest"><span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse"/> IN STOCK</span>
           ) : (
                <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">OUT OF STOCK</span>
           )}
       </div>

       <h1 className="font-saira text-xl font-bold text-white mb-4 leading-snug">{product.name}</h1>
       
       {/* PRICE BLOCK */}
       <div className="flex items-end gap-3 mb-1">
           <div className="text-3xl font-bold text-white font-saira">₹{product.price.toLocaleString("en-IN")}</div>
           <div className="text-sm text-[#A0A0A0] line-through mb-1 font-saira">₹{mrp.toLocaleString("en-IN")}</div>
           <div className="text-[10px] bg-green-500/20 text-green-500 border border-green-500/30 px-2 py-1 rounded font-bold mb-1">{discount}% OFF</div>
       </div>
       <p className="text-[9px] text-[#A0A0A0] mb-6">Inclusive of all taxes</p>

       <MobileVariantSelector currentProductId={product.id} variantGroupId={product.variant_group_id} currentSpecs={product.specs || {}} />

       {/* TECHNICAL HIGHLIGHTS */}
       <div className="mb-8 bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
           <h3 className="font-orbitron font-bold text-white text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2"><FaBolt className="text-[#B084FF]"/> Tech Highlights</h3>
           <div className="space-y-2 text-[10px]">
               {product.category === 'prebuilt' ? Object.entries(product.specs || {}).map(([k, v]: any) => (
                   <div key={k} className="flex justify-between border-b border-white/5 pb-1"><span className="text-[#A0A0A0]">{k}</span><span className="text-white font-bold text-right w-2/3 truncate">{v}</span></div>
               )) : product.features?.slice(0,5).map((f: string, i: number) => (
                   <div key={i} className="text-[#A0A0A0] flex gap-2"><span className="text-[#B084FF]">✦</span> {f}</div>
               ))}
           </div>
       </div>

       {/* CIRCULAR HIGHLIGHT BLOCKS */}
       <div className="flex justify-between mb-8 px-1">
           <CircleIcon icon={<FaExchangeAlt/>} title="7 Days" sub="Replace" />
           <CircleIcon icon={<FaShieldAlt/>} title={product.warranty || "3 YRS"} sub="Warranty" />
           <CircleIcon icon={<FaTruck/>} title="Safe" sub="Shipping" />
           <CircleIcon icon={<FaHandHoldingUsd className={product.cod_policy==='no_cod'?'text-red-500':''}/>} title={product.cod_policy==='no_cod'?'Online':'COD'} sub={product.cod_policy==='no_cod'?'No COD':'Available'} />
       </div>

       {/* ADD TO CART & BUY NOW BUTTONS */}
       <div className="flex gap-3">
           <button onClick={() => handleAction(false)} disabled={!product.in_stock} className="flex-1 py-4 border border-[#4E2C8B] rounded-xl text-white font-orbitron font-bold text-[10px] uppercase tracking-widest hover:bg-[#1A1A1A] disabled:opacity-50 active:scale-95 transition-transform">
               <FaShoppingCart className="inline mr-2" /> Cart
           </button>
           <button onClick={() => handleAction(true)} disabled={!product.in_stock} className="flex-1 py-4 bg-brand-purple rounded-xl text-white font-orbitron font-bold text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(78,44,139,0.3)] disabled:opacity-50 active:scale-95 transition-transform">
               Buy Now
           </button>
       </div>
    </div>
  );
}