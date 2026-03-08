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
    image: "/images/Products/cpuv1.jpg" 
  },
  { 
    id: "gpu", 
    name: "GRAPHICS CARD", 
    sub: "VISUAL ENGINES",
    desc: "NVIDIA RTX, Intel ARC & AMD Radeon",
    image: "/images/Products/gpuv1.jpg" 
  },
  { 
    id: "motherboard", 
    name: "MOBO", 
    sub: "SYSTEM FOUNDATION",
    desc: "Z790, X670 & B650 Chipsets",
    image: "/images/Products/mobov2.jpg" 
  },
  { 
    id: "storage", 
    name: "STORAGE", 
    sub: "DATA VAULTS",
    desc: "NVMe Gen4 & Gen5 Solutions",
    image: "/images/Products/nvmev2.jpg" 
  },
  { 
    id: "cabinet", 
    name: "CHASSIS", 
    sub: "ARMOR PLATING",
    desc: "Mid-Tower, Full-Tower & ITX",
    image: "/images/Products/pc cabinetv2.jpg" 
  },
  { 
    id: "psu", 
    name: "POWER", 
    sub: "ENERGY REACTORS",
    desc: "Gold & Platinum Modular Units",
    image: "/images/Products/psuv2.jpg" 
  },
  { 
    id: "memory", 
    name: "MEMORY", 
    sub: "SYSTEM CACHE",
    desc: "High-Bandwidth DDR5 Modules",
    image: "/images/Products/ramv2.jpg" 
  },
  { 
    id: "cooler", 
    name: "COOLING", 
    sub: "THERMAL CONTROL",
    desc: "AIO Liquid & Air Solutions",
    image: "/images/Products/aiov2.jpg" 
  },
];

export default function ProductHubClient() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="pt-12 pb-12 px-6 border-b border-white/5 bg-[#121212] relative z-10">
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

      {/* CINEMATIC GRID */}
      <div className="flex-grow w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
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
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/40 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>

              {/* --- 2. CONTENT LAYER --- */}
              <div className="relative z-10 h-full flex flex-col items-center justify-end p-8 text-center pb-12">
                 
                 {/* Floating Border Box */}
                 <div className="absolute inset-8 border border-white/10 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>

                 {/* CENTER POP-UP CONTENT (Sub, Desc, Button) */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex flex-col items-center">
                        <span aria-hidden="true" className="text-brand-purple font-bold tracking-[0.3em] text-[10px] uppercase mb-3 block">
                            {cat.sub}
                        </span>
                        
                        <p className="text-brand-silver text-xs font-medium uppercase tracking-wider mb-6">
                            {cat.desc}
                        </p>

                        <button className="flex items-center gap-3 text-xs font-orbitron font-bold uppercase tracking-widest text-white hover:text-brand-purple transition-colors pointer-events-auto">
                            Browse Parts <FaArrowRight />
                        </button>
                     </div>
                 </div>

                 {/* BOTTOM FIXED CONTENT (Main Title) */}
                 <div className="relative z-10 transform transition-transform duration-500 group-hover:-translate-y-2">
                    <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-2xl">
                        {cat.name}
                    </h2>
                 </div>
                 
              </div>

              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-purple to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
              
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}