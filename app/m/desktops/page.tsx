"use client";

import { useState } from "react";
import Link from "next/link";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import MotionWrapper from "@/components/mobile/MotionWrapper";
import { FaTimes, FaArrowRight, FaGamepad, FaBriefcase, FaPalette, FaGem } from "react-icons/fa";

export default function MobileDesktopsHub() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const SeriesCard = ({ href, title, desc, icon, color }: any) => (
    <Link href={href} className="relative bg-[#1A1A1A] border border-white/5 hover:border-[#B084FF] rounded-3xl p-6 flex flex-col justify-end h-[220px] overflow-hidden active:scale-95 transition-all mb-5 block">
       <div className={`absolute top-6 left-6 text-5xl opacity-20 ${color}`}>{icon}</div>
       <div className="relative z-10">
          <h2 className="font-orbitron font-bold text-2xl text-white mb-1 tracking-wide">{title}</h2>
          <p className="text-[#A0A0A0] text-xs font-saira mb-4 pr-4">{desc}</p>
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${color}`}>
             <span>Explore Series</span> <FaArrowRight />
          </div>
       </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
         
         <div className="flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-[#121212]">
             <div className="px-6 pt-24 pb-4 bg-[#1A1A1A]/30 mb-6 border-b border-[#4E2C8B]/30 text-center">
                <h1 className="font-orbitron font-bold text-2xl text-white tracking-widest uppercase">PREBUILT <span className="text-[#B084FF]">RIGS</span></h1>
                <p className="text-[10px] text-[#A0A0A0] font-saira mt-1 uppercase tracking-widest">Select your ecosystem</p>
             </div>
             
             <div className="px-6 pb-6">
                <MotionWrapper><SeriesCard href="/m/ascend" title="ASCEND" desc="High FPS E-Sports & AAA Gaming. Precision-tuned for competitive dominance." icon={<FaGamepad/>} color="text-[#B084FF]" /></MotionWrapper>
                <MotionWrapper><SeriesCard href="/m/creator" title="CREATOR" desc="Engineered for rendering, 3D modeling, editing, and boundless creativity." icon={<FaPalette/>} color="text-[#3b82f6]" /></MotionWrapper>
                <MotionWrapper><SeriesCard href="/m/workpro" title="WORKPRO" desc="Maximum productivity, aggressive multitasking, and zero downtime." icon={<FaBriefcase/>} color="text-white" /></MotionWrapper>
                <MotionWrapper delay={0.2}><SeriesCard href="/m/signature" title="SIGNATURE" desc="Premium custom loops, exotic materials, and absolute zero compromises." icon={<FaGem/>} color="text-[#FFD700]" /></MotionWrapper>
             </div>
             <MobileFooter />
         </div>
         
         <MobileBottomNav />

         {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
         {searchOpen && (
           <div className="absolute inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl rounded-3xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between mb-8"><h2 className="text-xl font-orbitron text-white">Search</h2><button onClick={() => setSearchOpen(false)} className="text-white text-2xl"><FaTimes/></button></div>
              <GlobalSearch placeholder="Search systems..." variant="standard" onSearchSubmit={() => setSearchOpen(false)} className="w-full" />
           </div>
         )}
      </div>
    </div>
  )
}