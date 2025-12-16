"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaArrowRight } from "react-icons/fa";

// --- DATA CONFIGURATION ---
const categories = [
  { 
    id: "cpu", 
    name: "PROCESSORS", 
    sub: "CORE ARCHITECTURE",
    desc: "Intel Core Ultra & AMD Ryzen",
    image: "/images/Products/cpu.jpg" 
  },
  { 
    id: "gpu", 
    name: "GRAPHICS CARD", 
    sub: "VISUAL ENGINES",
    desc: "NVIDIA RTX & AMD Radeon",
    image: "/images/Products/gpu.jpg" 
  },
  { 
    id: "motherboard", 
    name: "MOTHERBOARDS", 
    sub: "SYSTEM FOUNDATION",
    desc: "Z790, X670 & B650 Chipsets",
    image: "/images/Products/mobo.jpg" 
  },
  { 
    id: "storage", 
    name: "STORAGE", 
    sub: "DATA VAULTS",
    desc: "NVMe Gen4 & Gen5 Solutions",
    image: "/images/Products/nvme.jpg" 
  },
  { 
    id: "cabinet", 
    name: "CHASSIS", 
    sub: "ARMOR PLATING",
    desc: "Mid-Tower, Full-Tower & ITX",
    // Handling space in filename safely
    image: "/images/Products/pc cabinet.jpg" 
  },
  { 
    id: "psu", 
    name: "POWER", 
    sub: "ENERGY REACTORS",
    desc: "Gold & Platinum Modular Units",
    image: "/images/Products/psu.jpg" 
  },
  { 
    id: "memory", 
    name: "MEMORY", 
    sub: "SYSTEM CACHE",
    desc: "High-Bandwidth DDR5 Modules",
    image: "/images/Products/ram.jpg" 
  },
  { 
    id: "cooler", 
    name: "COOLING", 
    sub: "THERMAL CONTROL",
    desc: "AIO Liquid & Air Solutions",
    image: "/images/Products/aio.jpg" 
  },
];

export default function ProductHubPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="pt-32 pb-12 px-6 border-b border-white/5 bg-[#121212] relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <Reveal>
            <h1 className="font-orbitron font-bold text-5xl md:text-6xl text-white mb-4 tracking-tighter">
                COMPONENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">ECOSYSTEM</span>
            </h1>
            <p className="text-brand-silver font-saira tracking-widest uppercase text-sm">
                Engineer your ultimate machine with precision hardware.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CINEMATIC GRID (3 COLUMNS) */}
      <div className="flex-grow w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, index) => (
            <Link 
                key={cat.id} 
                href={`/products/${cat.id}`} 
                className="group relative h-[500px] overflow-hidden border-b border-white/5 md:border-r border-white/5 lg:[&:nth-child(3n)]:border-r-0"
            >
              
              {/* --- 1. BACKGROUND IMAGE --- */}
              <div className="absolute inset-0 w-full h-full">
                <Image 
                    src={cat.image} 
                    alt={cat.name} 
                    fill 
                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500"></div>
                
                {/* Gradient from bottom for text readability */}
                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>

              {/* --- 2. CONTENT LAYER --- */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
                 
                 {/* Floating Border Box */}
                 <div className="absolute inset-8 border border-white/10 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>

                 {/* Text Content */}
                 <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-brand-purple font-bold tracking-[0.3em] text-[10px] uppercase mb-3 block opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                        {cat.sub}
                    </span>
                    <h2 className="font-orbitron text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl">
                        {cat.name}
                    </h2>
                    <p className="text-brand-silver text-xs font-medium uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                        {cat.desc}
                    </p>
                 </div>

                 {/* Button (Slides up) */}
                 <div className="absolute bottom-12 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    <button className="flex items-center gap-3 text-xs font-orbitron font-bold uppercase tracking-widest text-white hover:text-brand-purple transition-colors">
                        Browse Parts <FaArrowRight />
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