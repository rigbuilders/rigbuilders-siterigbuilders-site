"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// FIX 1: Changed filenames to break the Next.js cache!
const slides = [
  { id: 1, bg: "/mobile/home/carousel/hero-1.jpg", link: "/ascend" },
  { id: 2, bg: "/mobile/home/carousel/hero-2.jpg", link: "/workpro" },
  { id: 3, bg: "/mobile/home/carousel/hero-3.jpg", link: "/creator" },
  { id: 4, bg: "/mobile/home/carousel/hero-4.jpg", link: "/signature" },
  { id: 5, bg: "/mobile/home/carousel/hero-5.jpg", link: "/products/cpu" },
  { id: 6, bg: "/mobile/home/carousel/hero-6.jpg", link: "/products/gpu" }
];

export default function MobileHeroCarousel() {
  const [active, setActive] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const index = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
    setActive(index);
  };

  return (
    <div className="w-full relative mb-2">
      {/* Scroll Container */}
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
        onScroll={handleScroll}
      >
        {slides.map((s) => (
          <Link 
            key={s.id} 
            href={s.link} 
            className="w-full flex-shrink-0 snap-center relative aspect-[2/3] block active:scale-[0.98] transition-transform duration-300 overflow-hidden"
          >
            <Image 
                src={s.bg} 
                alt={`Slide ${s.id}`} 
                fill 
                className="object-cover object-top z-0" 
                priority={s.id === 1} 
                unoptimized={true} /* FIX 2: Prevents Next.js fromm caching the image while you are testing */
            />
            
            {/* THE MERGING EFFECT */}
            <div className="absolute bottom-0 left-0 w-full h-[45%] bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent z-10 pointer-events-none" />
          </Link>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 absolute bottom-8 w-full z-20 pointer-events-none">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-2.5 rounded-full transition-all duration-300 ${active === i ? 'w-2.5 bg-[#B084FF]' : 'w-2.5 bg-white/30'}`} 
          />
        ))}
      </div>
    </div>
  );
}