"use client";

import { useState } from "react";
import Link from "next/link";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import MotionWrapper from "@/components/mobile/MotionWrapper";
import { FaTimes, FaArrowRight } from "react-icons/fa";
import MobilePageEnd from "@/components/mobile/MobilePageEnd";

// --- DATA CONFIGURATION ---
const categories = [
  { id: "cpu", name: "PROCESSORS", sub: "CORE ARCHITECTURE", image: "/images/Products/cpuv1.jpg" },
  { id: "gpu", name: "GRAPHICS CARD", sub: "VISUAL ENGINES", image: "/images/Products/gpuv1.jpg" },
  { id: "motherboard", name: "MOTHERBOARDS", sub: "SYSTEM FOUNDATION", image: "/images/Products/mobov2.jpg" },
  { id: "memory", name: "MEMORY", sub: "SYSTEM CACHE", image: "/images/Products/ramv2.jpg" },
  { id: "storage", name: "STORAGE", sub: "DATA VAULTS", image: "/images/Products/nvmev2.jpg" },
  { id: "cooler", name: "COOLING", sub: "THERMAL CONTROL", image: "/images/Products/aiov2.jpg" },
  { id: "cabinet", name: "CHASSIS", sub: "ARMOR PLATING", image: "/images/Products/pc cabinetv2.jpg" },
  { id: "psu", name: "POWER", sub: "ENERGY REACTORS", image: "/images/Products/psuv2.jpg" },
];

export default function MobileComponentsHub() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
         
         <div className="flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-[#050505]">
             
             {/* HEADER */}
             <div className="px-6 pt-24 pb-6 bg-[#1A1A1A]/30 border-b border-brand-purple/30 text-center relative z-10 mb-6">
                <h1 className="font-orbitron font-bold text-2xl text-white tracking-widest uppercase">
                    COMPONENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B084FF] to-[#3b82f6]">ECOSYSTEM</span>
                </h1>
                <p className="text-[10px] text-[#A0A0A0] font-saira mt-1 uppercase tracking-widest">Engineer your ultimate machine</p>
             </div>
             
             {/* 2-COLUMN SQUARE GRID */}
             <div className="grid grid-cols-2 gap-3 px-6 pb-12">
                {categories.map((cat, i) => (
                    <MotionWrapper key={cat.id} delay={i * 0.05}>
                        <Link 
                            href={`/m/components/${cat.id}`} 
                            className="group block bg-[#1A1A1A] border border-white/5 hover:border-[#B084FF]/50 rounded-2xl p-3 flex flex-col items-center text-center active:scale-95 transition-all"
                        >
                            {/* SQUARE IMAGE CONTAINER */}
                            <div className="w-full aspect-square bg-[#050505] rounded-xl mb-3 overflow-hidden relative border border-white/5">
                                {/* The image will elegantly cover the square space */}
                                <img 
                                    src={cat.image} 
                                    alt={cat.name} 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
                            </div>
                            
                            {/* TEXT CONTENT */}
                            <h2 className="font-orbitron text-white font-bold text-[11px] mb-1 tracking-wider leading-tight group-hover:text-[#B084FF] transition-colors">
                                {cat.name}
                            </h2>
                            <span className="text-[#A0A0A0] text-[8px] uppercase tracking-widest font-bold">
                                {cat.sub}
                            </span>
                        </Link>
                    </MotionWrapper>
                ))}
             </div>
         </div>
         
         <MobileBottomNav />

         {/* OVERLAYS */}
         {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
         {searchOpen && (
           <div className="absolute inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl rounded-3xl p-6 animate-in zoom-in-95 shadow-2xl border border-brand-purple/20">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-orbitron text-white">Search</h2>
                  <button onClick={() => setSearchOpen(false)} className="text-white text-2xl active:scale-90"><FaTimes/></button>
              </div>
              <GlobalSearch placeholder="Search components..." variant="standard" onSearchSubmit={() => setSearchOpen(false)} className="w-full" />
           </div>
         )}
      </div>
      
    </div>
  )
}