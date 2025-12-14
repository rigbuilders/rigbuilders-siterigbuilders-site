"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const brands = [
  "amd.png",
  "aorus.png",
  "asus.png",
  "corsair.png",
  "crucial.png",
  "deepcool.png",
  "gigabyte.png",
  "intel.png",
  "logitech.png",
  "nvidia.png",
  "lian li.png",
  "kingston.png",
  "ant esports.png",
  "msi.png",
  "nzxt.png",
  "samsung.png",
  "western digital.png"
];

export default function BrandCarousel() {
  // Duplicate the array to ensure seamless infinite scrolling
  const duplicatedBrands = [...brands, ...brands];

  return (
    <section className="w-full bg-[#121212] border-t border-white/5 py-10 overflow-hidden relative">
      
      {/* 1. Header / Label */}
      <div className="text-center mb-8">
        <p className="font-saira text-brand-silver/100 text-m font-bold tracking-[0.3em] uppercase">
          BRANDS WE TRUST
        </p>
      </div>

      {/* 2. Gradient Masks (The "Cinematic Fade" Effect) */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#121212] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#121212] to-transparent z-10 pointer-events-none" />

      {/* 3. The Infinite Track */}
      <div className="flex">
        <motion.div
          className="flex gap-8 md:gap-10 items-center px-8"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            duration: 60, // Adjust speed (higher = slower)
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {duplicatedBrands.map((brand, index) => (
            <div 
              key={`${brand}-${index}`} 
              className="relative w-32 h-16 md:w-40 md:h-20 flex-shrink-0 group flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-40 hover:opacity-100"
            >
              <Image
                src={`/icons/homepage carousel/${brand}`}
                alt={brand.replace(".png", "")}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100px, 160px"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}