"use client";

import { useState } from "react";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import SeriesCard from "@/components/mobile/series/SeriesCard";
import MotionWrapper from "@/components/mobile/MotionWrapper";
import { FaVideo, FaLayerGroup, FaFilm, FaTimes } from "react-icons/fa";

export default function MobileCreator() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
         
         <div className="flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-[#121212]">
             <div className="px-6 pt-24 pb-4 border-b border-pink-500/30 bg-[#1A1A1A]/30 mb-6">
                <span className="font-saira text-pink-500 tracking-[0.2em] text-[10px] font-bold uppercase block mb-1">Stream. Render. Create.</span>
                <h1 className="font-orbitron font-bold text-3xl text-white mb-2 tracking-wide">
                    CREATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">SERIES</span>
                </h1>
                <p className="text-[12px] text-[#A0A0A0] font-saira">Stop compromising. Designed for creators who can't afford render bottlenecks.</p>
             </div>
             
             <div className="px-6 flex flex-col gap-5 mb-12">
                <MotionWrapper><SeriesCard href="/m/creator/5" number="05" icon={<FaVideo/>} title="LEVEL 5" badge="STREAMER" description="Single-PC Streaming. NVENC Optimized." colorClass="text-pink-500"/></MotionWrapper>
                <MotionWrapper><SeriesCard href="/m/creator/7" number="07" icon={<FaLayerGroup/>} title="LEVEL 7" badge="EDITOR" description="4K scrubbing & heavy multitasking." colorClass="text-purple-400"/></MotionWrapper>
                <MotionWrapper><SeriesCard href="/m/creator/9" number="09" icon={<FaFilm/>} title="LEVEL 9" badge="STUDIO" description="3D Rendering & Cinema 8K Workflow." colorClass="text-pink-500"/></MotionWrapper>
             </div>
             <MobileFooter />
         </div>
         
         <MobileBottomNav />

         {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
         {searchOpen && (
           <div className="absolute inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl rounded-3xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between mb-8"><h2 className="text-xl font-orbitron text-white">Search</h2><button onClick={() => setSearchOpen(false)} className="text-white text-2xl"><FaTimes/></button></div>
              <GlobalSearch placeholder="Search Creator Series..." variant="standard" onSearchSubmit={() => setSearchOpen(false)} className="w-full" />
           </div>
         )}
      </div>
    </div>
  )
}