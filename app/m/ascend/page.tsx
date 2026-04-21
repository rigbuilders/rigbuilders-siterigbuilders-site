"use client";

import { useState } from "react";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import SeriesCard from "@/components/mobile/series/SeriesCard";
import MotionWrapper from "@/components/mobile/MotionWrapper";
import { FaCrosshairs, FaBolt, FaCrown, FaTimes } from "react-icons/fa";

export default function MobileAscend() {
  // FIX: Added the state to control the overlays
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
         
         {/* FIX: Connected the buttons to the state toggles */}
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
         
         <div className="flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-[#121212]">
             <div className="px-6 pt-24 pb-4 border-b border-white/5 bg-[#1A1A1A]/50 mb-6">
                <h1 className="font-orbitron font-bold text-3xl text-white mb-2 tracking-wide">ASCEND <span className="text-[#B084FF]">SERIES</span></h1>
                <p className="text-[12px] text-[#A0A0A0] font-saira">Precision-tuned for competitive dominance. Choose your performance bracket.</p>
             </div>
             
             <div className="px-6 flex flex-col gap-5 mb-12">
                <MotionWrapper><SeriesCard href="/m/ascend/5" number="05" icon={<FaCrosshairs/>} title="LEVEL 5" description="1080p Competitive Dominance. High FPS architecture optimized for E-Sports titles." colorClass="text-[#B084FF]"/></MotionWrapper>
                <MotionWrapper><SeriesCard href="/m/ascend/7" number="07" icon={<FaBolt/>} title="LEVEL 7" badge="Best Seller" description="1440p Sweet Spot. The perfect balance of power and value for modern AAA titles." colorClass="text-white"/></MotionWrapper>
                <MotionWrapper><SeriesCard href="/m/ascend/9" number="09" icon={<FaCrown/>} title="LEVEL 9" description="4K Ultra Performance. No compromises. Pure silicon power for enthusiasts." colorClass="text-[#B084FF]"/></MotionWrapper>
             </div>

             <MobileFooter />
         </div>
         
         <MobileBottomNav />

         {/* FIX: Added the Menu Drawer Overlay */}
         {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
        
         {/* FIX: Added the Search Overlay */}
         {searchOpen && (
           <div className="absolute inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl border border-brand-purple/20 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-orbitron text-white">Search</h2>
                 <button onClick={() => setSearchOpen(false)} className="text-white text-2xl active:scale-90"><FaTimes /></button>
              </div>
              <GlobalSearch 
                 placeholder="Search components..." 
                 variant="standard"
                 onSearchSubmit={() => setSearchOpen(false)}
                 className="w-full"
              />
           </div>
         )}

      </div>
    </div>
  )
}