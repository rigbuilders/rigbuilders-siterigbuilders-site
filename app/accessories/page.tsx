"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaArrowRight } from "react-icons/fa";

// --- DATA CONFIGURATION ---
const accessoryCategories = [
  { 
    id: "monitor", 
    name: "DISPLAYS", 
    sub: "HIGH REFRESH DISPLAYS",
    image: "/images/Accessories/monitor.jpg",
    colSpan: false 
  },
  { 
    id: "keyboard", 
    name: "KEYBOARDS", 
    sub: "MECHANICAL PRECISION",
    image: "/images/Accessories/keyboard.jpg",
    colSpan: false 
  },
  { 
    id: "mouse", 
    name: "MICE", 
    sub: "ESPORTS GRADE SENSORS",
    image: "/images/Accessories/mouse.jpg",
    colSpan: false 
  },
  { 
    id: "combo", 
    name: "COMBOS", 
    sub: "UNIFIED ARSENAL",
    image: "/images/Accessories/combo.jpg",
    colSpan: false 
  },
  { 
    id: "mousepad", 
    name: "PADS", 
    sub: "GLIDE OPTIMIZED MATS",
    image: "/images/Accessories/pad.jpg",
    colSpan: false 
  },
  { 
    id: "usb", 
    name: "STORAGE", 
    sub: "PORTABLE DRIVES",
    image: "/images/Accessories/usb.jpg",
    colSpan: false 
  },
];

export default function AccessoriesPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="pt-[50px] pb-12 px-6 border-b border-white/5 bg-[#121212] relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <Reveal>
            <h1 className="font-orbitron font-bold text-5xl md:text-6xl text-white mb-4 tracking-tighter">
                PERIPHERAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">ARMORY</span>
            </h1>
            <p className="text-brand-silver font-saira tracking-widest uppercase text-sm">
                Complete your battlestation with tactical precision gear.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CINEMATIC GRID */}
      <div className="flex-grow w-full">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {accessoryCategories.map((cat, index) => (
            <Link key={cat.id} href={`/products/${cat.id}`} className="group relative h-[400px] lg:h-[500px] overflow-hidden border-b border-white/5 md:border-r md:odd:border-r-white/5 md:even:border-r-0">
              
              {/* --- 1. BACKGROUND IMAGE (OPTIMIZED) --- */}
              <div className="absolute inset-0 w-full h-full">
                <Image 
                    src={cat.image} 
                    alt={cat.name} 
                    fill 
                    // 🟢 PERFORMANCE UPGRADE:
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index < 2} // Loads top 2 images instantly
                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                />
                
                {/* Dark Overlay (Fades slightly on hover) */}
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500"></div>
                
                {/* Gradient from bottom for text readability */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>

              {/* --- 2. CONTENT LAYER --- */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
                 
                 {/* Floating Border Box */}
                 <div className="absolute inset-8 border border-white/10 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>

                 {/* Text Content */}
                 <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-brand-purple font-bold tracking-[0.3em] text-xs uppercase mb-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                        {cat.sub}
                    </span>
                    <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
                        {cat.name}
                    </h2>
                 </div>

                 {/* Button (Slides up) */}
                 <div className="absolute bottom-12 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    <button className="flex items-center gap-3 text-sm font-orbitron font-bold uppercase tracking-widest text-white hover:text-brand-purple transition-colors">
                        Explore Collection <FaArrowRight />
                    </button>
                 </div>
              </div>

              {/* --- 3. HOVER ACCENTS --- */}
              {/* Top Line */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-purple to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
              
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}