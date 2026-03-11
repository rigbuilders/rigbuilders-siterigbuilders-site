"use client";

import { useState } from "react";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import { FaTimes } from "react-icons/fa";
import MobileHeroCarousel from "@/components/mobile/MobileHeroCarousel";
import MobileExploreDesktops from "@/components/mobile/MobileExploreDesktops";

import MobilePCComponents from "@/components/mobile/MobilePCComponents";
import MobileAccessories from "@/components/mobile/MobileAccessories";
import MobileWhyChooseUs from "@/components/mobile/MobileWhyChooseUs";
import MobileCommission from "@/components/mobile/MobileCommission";
import MobileBrandCarousel from "@/components/mobile/MobileBrandCarousel";
import MobileGoogleReviews from "@/components/mobile/MobileGoogleReviews";
import MobileFooter from "@/components/mobile/MobileFooter";

export default function MobileSandbox() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    // The Desktop Background
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">

      {/* THE VIRTUAL PHONE FRAME (iPhone 14 Pro Size) */}
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
        
        <MobileTopNav 
          onOpenMenu={() => setMenuOpen(true)} 
          onOpenSearch={() => setSearchOpen(true)} 
        />

        {/* FIX 1: Replaced 'custom-scrollbar' with native hidden scrollbar classes. 
            This stops the chunky desktop scrollbar from eating up your column width! 
        */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative bg-[#121212]">
            
            {/* FIX 2: Removed 'pb-32' and the empty 'h-40' div at the bottom! */}
            <div className="w-full">
                <MobileHeroCarousel />
                <MobileExploreDesktops />
                <MobilePCComponents />
                <MobileAccessories />
                <MobileBrandCarousel />
                <MobileCommission />
                <MobileWhyChooseUs />
                <MobileGoogleReviews />
                <MobileFooter />
            </div>
        </div>

        <MobileBottomNav />

        {/* OVERLAYS (Now trapped inside the phone) */}
        {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
        
        {/* SEARCH DRAWER */}
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
  );
}