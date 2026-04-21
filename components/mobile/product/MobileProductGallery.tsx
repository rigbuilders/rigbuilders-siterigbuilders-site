"use client";

import { useState } from "react";
import Link from "next/link";
import { FaHome, FaChevronRight } from "react-icons/fa";

export default function MobileProductGallery({ product }: { product: any }) {
  const rawImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
  const images = rawImages.length > 0 ? rawImages : ["", ""];
  const [activeImg, setActiveImg] = useState(images[0]);

  const isPrebuilt = product.category === 'prebuilt';
  const Sep = () => <FaChevronRight className="shrink-0 text-[#4E2C8B] text-[8px]" />;

  return (
    <div className="w-full pt-24 px-6 pb-4 bg-[#050505]">
       
       {/* 1. FULLY CLICKABLE DYNAMIC BREADCRUMB */}
       <div className="flex items-center gap-2 text-[10px] text-[#A0A0A0] font-bold mb-6 font-saira whitespace-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          
          <Link href="/m" className="flex items-center gap-1 hover:text-white transition-colors shrink-0">
             <FaHome /> Home
          </Link>
          
          <Sep />
          <Link href="/m/products" className="hover:text-white transition-colors shrink-0 capitalize">
             {isPrebuilt ? 'Desktops' : (product.group || 'Shop')}
          </Link>

          {/* Conditional Pathing for Prebuilt vs Components */}
          {isPrebuilt ? (
              <>
                 <Sep />
                 <Link href={`/m/${product.series}`} className="hover:text-white transition-colors shrink-0 capitalize">
                    {product.series}
                 </Link>
                 <Sep />
                 <Link href={`/m/${product.series}/${product.tier}`} className="hover:text-white transition-colors shrink-0 capitalize">
                    {product.series} {product.tier}
                 </Link>
              </>
          ) : (
              <>
                 <Sep />
                 <span className="shrink-0 capitalize">{product.category?.replace('_', ' ') || 'Gear'}</span>
              </>
          )}
          
          <Sep />
          <span className="text-white truncate">{product.name}</span>
       </div>

       {/* 2. MAIN IMAGE VIEWER */}
       <div className="w-full aspect-square bg-[#1A1A1A] rounded-2xl flex items-center justify-center p-6 mb-4 border border-white/5 relative">
          {activeImg ? (
             <img src={activeImg} alt={product.name} className="max-h-full max-w-full object-contain drop-shadow-[0_0_20px_rgba(176,132,255,0.15)]" />
          ) : (
             <span className="text-white/20 font-orbitron text-xs uppercase">No Image</span>
          )}
       </div>

       {/* 3. THUMBNAILS ROW */}
       <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2">
          {images.map((img: string, i: number) => (
             <button 
                key={i} 
                onClick={() => setActiveImg(img)}
                className={`w-[60px] h-[60px] shrink-0 rounded-xl bg-[#1A1A1A] border flex items-center justify-center p-1 transition-all ${activeImg === img ? 'border-[#B084FF]' : 'border-transparent opacity-50 hover:opacity-100'}`}
             >
                {img ? <img src={img} className="max-h-full max-w-full object-contain rounded-lg" /> : <div className="w-full h-full bg-[#121212] rounded-lg"></div>}
             </button>
          ))}
       </div>
    </div>
  );
}