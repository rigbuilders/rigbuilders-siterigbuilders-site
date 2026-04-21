"use client";

import { useState } from "react";
import { FaHome } from "react-icons/fa";

export default function MobileProductGallery({ product }: { product: any }) {
  const images = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
  const displayImages = images.length > 0 ? images : [""];
  const [activeImg, setActiveImg] = useState(displayImages[0]);

  return (
    <div className="w-full pt-24 px-6 pb-2 bg-[#0a0a0a]">
       
       {/* 1. BREADCRUMB */}
       <div className="flex items-center gap-2 text-[10px] text-[#A0A0A0] font-bold mb-6 font-saira whitespace-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <FaHome className="shrink-0" /> <span className="shrink-0">Home</span>
          <span className="text-[#4E2C8B] shrink-0">{'>'}</span> <span className="shrink-0 capitalize">{product.group || 'Shop'}</span>
          <span className="text-[#4E2C8B] shrink-0">{'>'}</span> <span className="shrink-0 capitalize">{product.category || 'Gear'}</span>
          <span className="text-[#4E2C8B] shrink-0">{'>'}</span> <span className="text-white truncate">{product.name}</span>
       </div>

       {/* 2. MAIN IMAGE VIEWER */}
       <div className="w-full aspect-square bg-[#1A1A1A] rounded-2xl flex items-center justify-center p-6 mb-4 relative">
          {activeImg ? (
             <img src={activeImg} alt={product.name} className="max-h-full max-w-full object-contain drop-shadow-[0_0_20px_rgba(176,132,255,0.1)] transition-opacity duration-300" />
          ) : (
             <span className="text-white/20 font-orbitron text-xs">NO IMAGE</span>
          )}
       </div>

       {/* 3. THUMBNAILS ROW */}
       <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2">
          {displayImages.map((img: string, i: number) => (
             <button 
                key={i} 
                onClick={() => setActiveImg(img)}
                className={`w-[60px] h-[60px] shrink-0 rounded-xl bg-[#1A1A1A] border flex items-center justify-center p-2 transition-all ${activeImg === img ? 'border-[#B084FF]' : 'border-transparent opacity-50 hover:opacity-100'}`}
             >
                {img ? <img src={img} className="max-h-full max-w-full object-contain" /> : <span className="text-[8px] text-white/20">BLANK</span>}
             </button>
          ))}
          {/* Renders a blank placeholder if there is only 1 image to match the visual style */}
          {displayImages.length === 1 && displayImages[0] !== "" && (
              <div className="w-[60px] h-[60px] shrink-0 rounded-xl bg-[#1A1A1A] opacity-20 flex items-center justify-center"></div>
          )}
       </div>
    </div>
  );
}