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
import MotionWrapper from "@/components/mobile/MotionWrapper";

export default function MobileSandbox() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    // FULL SCREEN VIEWPORT WRAPPER
    <div className="relative h-[100dvh] w-full bg-[#121212] flex flex-col font-saira overflow-hidden">
        
        <MobileTopNav 
          onOpenMenu={() => setMenuOpen(true)} 
          onOpenSearch={() => setSearchOpen(true)} 
        />

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-[#121212] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#B084FF] [&::-webkit-scrollbar-thumb]:rounded-l-full pr-0">
            <div className="w-full pb-">
                <MobileHeroCarousel />
                <MotionWrapper><MobileExploreDesktops /></MotionWrapper>
                <MotionWrapper><MobilePCComponents /></MotionWrapper>
                <MotionWrapper><MobileAccessories /></MotionWrapper>
                <MotionWrapper><MobileBrandCarousel /></MotionWrapper>
                <MotionWrapper><MobileCommission /></MotionWrapper>
                <MotionWrapper><MobileWhyChooseUs /></MotionWrapper>
                <MotionWrapper><MobileGoogleReviews /></MotionWrapper>
                <MotionWrapper><MobileFooter /></MotionWrapper>
            </div>
        </div>

        {/* FIXED BOTTOM NAV (Locked to physical screen) */}
        <div className="fixed bottom-0 left-0 w-full px-6 z-[90] pointer-events-none">
            <div className="pointer-events-auto">
                <MobileBottomNav />
            </div>
        </div>

        {/* OVERLAYS */}
        {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
        
        {/* SEARCH DRAWER */}
        {searchOpen && (
          <div className="fixed inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl border border-brand-purple/20 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
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
  );
}