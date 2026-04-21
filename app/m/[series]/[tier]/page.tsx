"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import ProductGridCard from "@/components/mobile/series/ProductGridCard";
import MotionWrapper from "@/components/mobile/MotionWrapper";
import { FaTimes } from "react-icons/fa";

// Next.js 15 Dynamic Route Props
export default function MobileTierPage({ params }: { params: Promise<{ series: string, tier: string }> }) {
  const { series, tier } = use(params);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Overlay States
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const fetchTier = async () => {
      // Magically fetches ONLY the products matching the URL (e.g. series='workpro', tier='7')
      const { data } = await supabase.from('products').select('*').eq('series', series).eq('tier', tier);
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchTier();
  }, [series, tier]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
         
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
         
         <div className="flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-[#121212]">
             
             {/* Header */}
             <div className="px-6 pt-24 pb-4 border-b border-[#4E2C8B]/30 bg-[#1A1A1A]/30 mb-6 text-center">
                <h1 className="font-orbitron font-bold text-2xl text-white tracking-widest uppercase">
                  {series} <span className="text-[#B084FF]">LEVEL {tier}</span>
                </h1>
                <p className="text-[10px] text-[#A0A0A0] font-saira mt-1 uppercase tracking-widest">Select your configuration</p>
             </div>

             {/* The 2-Column Product Grid */}
             {loading ? (
                 <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#B084FF] border-t-transparent rounded-full animate-spin"></div></div>
             ) : (
                 <div className="grid grid-cols-2 gap-3 px-6 mb-12">
                     {products.length > 0 ? products.map((p) => (
                         <MotionWrapper key={p.id}>
                             {/* Passes the product to the card, which now links to /m/product/[id] */}
                             <ProductGridCard product={p} tier={tier} />
                         </MotionWrapper>
                     )) : (
                         <div className="col-span-2 text-center text-[#A0A0A0] text-xs py-10 font-saira">No systems available for this tier yet.</div>
                     )}
                 </div>
             )}

             <MobileFooter />
         </div>
         
         <MobileBottomNav />

         {/* OVERLAYS */}
         {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
         
         {searchOpen && (
           <div className="absolute inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl border border-brand-purple/20 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-orbitron text-white">Search</h2>
                 <button onClick={() => setSearchOpen(false)} className="text-white text-2xl active:scale-90"><FaTimes /></button>
              </div>
              <GlobalSearch placeholder="Search configurations..." variant="standard" onSearchSubmit={() => setSearchOpen(false)} className="w-full" />
           </div>
         )}

      </div>
    </div>
  )
}