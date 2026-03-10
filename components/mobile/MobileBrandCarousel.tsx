"use client";

import Image from "next/image";

const brands = [
  "amd", "ant esports", "aorus", "asus", "corsair", "crucial", 
  "deepcool", "gigabyte", "intel", "kingston", "lian li", 
  "logitech", "msi", "nvidia", "nzxt", "samsung", "western digital"
];

export default function MobileBrandCarousel() {
  return (
    <div className="w-full border-y border-brand-purple/20 bg-[#0A0A0A] py-6 my-12 relative overflow-hidden flex flex-col items-center">
      
      {/* Inline style for the infinite scroll to keep your tailwind config clean */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 30s linear infinite; }
      `}} />

      <h3 className="text-[10px] font-orbitron font-bold text-white tracking-widest uppercase mb-6 z-10">
        Brands We Trust
      </h3>

      {/* The Scrolling Track */}
      <div className="w-full relative flex items-center overflow-hidden h-[40px]">
        {/* Left Gradient Fade */}
        <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-[#0A0A0A] to-transparent z-10" />
        
        {/* Moving Container (Repeated twice for seamless loop) */}
        <div className="flex animate-scroll w-max">
            {[...brands, ...brands].map((brand, i) => (
                <div key={i} className="relative h-[50px] w-[100px] flex-shrink-0 mx-4 grayscale opacity-100">
                    <Image 
                        src={`/icons/homepage carousel/${brand}.png`} 
                        alt={brand} 
                        fill 
                        className="object-contain" 
                    />
                </div>
            ))}
        </div>

        {/* Right Gradient Fade */}
        <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-[#0A0A0A] to-transparent z-10" />
      </div>
    </div>
  );
}