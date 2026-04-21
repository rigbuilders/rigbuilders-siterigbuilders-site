import Link from "next/link";

export default function MobileProductCard({ product }: { product: any }) {
    // If the product is out of stock, we'll visually dim it out
    const isOOS = !product.in_stock;

    return (
        <Link 
            href={`/m/product/${product.id}`} 
            className={`bg-[#1A1A1A] border border-white/5 hover:border-[#B084FF] rounded-2xl p-4 flex flex-col active:scale-95 transition-all h-[320px] relative ${isOOS ? "opacity-60 grayscale" : ""}`}
        >
            
            {/* Top Right Badge (Shows Brand or Category) */}
            <span className="absolute top-3 right-3 bg-[#B084FF]/20 text-[#B084FF] border border-[#B084FF]/30 text-[8px] font-bold px-2 py-0.5 rounded uppercase z-10 truncate max-w-[80px]">
                {product.brand || product.category}
            </span>

            {/* Product Image Viewer */}
            <div className="w-full h-32 bg-[#050505] rounded-xl mb-4 flex items-center justify-center p-2 border border-white/5 relative overflow-hidden">
                {product.image_url ? (
                    <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="max-h-full object-contain drop-shadow-[0_0_15px_rgba(176,132,255,0.15)]" 
                    />
                ) : (
                    <span className="text-[10px] text-white/20 font-orbitron uppercase">No Image</span>
                )}
            </div>
            
            {/* Product Title (Locked to 2 lines to keep grid perfectly aligned) */}
            <h3 className="font-orbitron font-bold text-white text-[11px] leading-tight mb-2 line-clamp-2 h-[28px]">
                {product.name}
            </h3>
            
            {/* Component Meta Data & Variant Labels */}
            <div className="space-y-1.5 mb-auto font-saira flex flex-col items-start">
                <p className="text-[9px] text-[#A0A0A0] uppercase tracking-wider">
                    {product.category?.replace('_', ' ')}
                </p>
                
                {product.specs?.variant_label && (
                    <span className="inline-block text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white mt-1 border border-white/5">
                        {product.specs.variant_label}
                    </span>
                )}
                
                {isOOS && <p className="text-[9px] text-red-500 font-bold uppercase mt-1">Out of Stock</p>}
            </div>
            
            {/* Price Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="font-orbitron font-bold text-[#B084FF] text-sm tracking-wider">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
            </div>
            
        </Link>
    )
}