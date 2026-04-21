import Link from "next/link";
import { FaStar } from "react-icons/fa";

export default function ProductGridCard({ product, tier }: any) {
    return (
        // FIX: Updated href to /m/product/${product.id} to connect to our new mobile page!
        <Link href={`/m/product/${product.id}`} className="bg-[#1A1A1A] border border-[#4E2C8B]/40 hover:border-[#B084FF] rounded-2xl p-4 flex flex-col active:scale-95 transition-all h-[340px] relative">
            
            {/* Tier Badge */}
            <span className="absolute top-3 right-3 bg-[#B084FF]/20 text-[#B084FF] border border-[#B084FF]/30 text-[8px] font-bold px-2 py-0.5 rounded uppercase z-10">
                Lvl {tier}
            </span>

            {/* Product Image */}
            <div className="w-full h-32 bg-[#050505] rounded-xl mb-4 flex items-center justify-center p-2 border border-white/5">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="max-h-full object-contain drop-shadow-[0_0_15px_rgba(176,132,255,0.15)]" />
                ) : (
                    <span className="text-[10px] text-white/20 font-orbitron">NO IMAGE</span>
                )}
            </div>
            
            {/* Info & Reviews */}
            <h3 className="font-orbitron font-bold text-white text-[11px] leading-tight mb-2 line-clamp-2 h-[28px]">{product.name}</h3>
            
            <div className="flex items-center text-[#FFD700] text-[8px] mb-4">
                <FaStar/><FaStar/><FaStar/><FaStar/><FaStar/>
                <span className="text-[#A0A0A0] ml-1.5 font-saira text-[9px]">(12 Reviews)</span>
            </div>
            
            {/* Mini Specs */}
            <div className="space-y-1.5 mb-auto font-saira">
                <p className="text-[9px] text-[#A0A0A0] truncate">CPU: <span className="text-white">{product.specs?.Processor || "TBD"}</span></p>
                <p className="text-[9px] text-[#A0A0A0] truncate">GPU: <span className="text-white">{product.specs?.['Graphics Card'] || "TBD"}</span></p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-[#4E2C8B]/30 flex justify-between items-center">
                <span className="font-orbitron font-bold text-[#B084FF] text-sm tracking-wider">₹{Number(product.price).toLocaleString("en-IN")}</span>
            </div>
        </Link>
    )
}