"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import MobileCategoryLanding from "@/components/mobile/category/MobileCategoryLanding";
import MobileChipsetHub from "@/components/mobile/category/MobileChipsetHub";
import MobileProductCard from "@/components/mobile/shop/MobileProductCard";
import MobileFooter from "@/components/mobile/MobileFooter";
import { FaTimes } from "react-icons/fa";

export default function MobileCategoryClient({ category }: { category: string }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const pMaker = searchParams.get('maker');
  const pSeries = searchParams.get('series');
  const pChipset = searchParams.get('chipset');
  const pBrand = searchParams.get('brand');

  const showLanding = ['gpu', 'motherboard', 'cpu'].includes(category) && !pMaker && !pChipset && !pBrand;
  const showHub = ['gpu', 'motherboard'].includes(category) && pMaker && !pChipset;

  useEffect(() => {
    if (showLanding) return setLoading(false);
    
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('category', category);
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [category, showLanding]);

  const gridProducts = products.filter(p => {
      if (pChipset && p.specs?.chipset !== pChipset) return false;
      if (pBrand && p.brand !== pBrand) return false;
      return true;
  });

  return (
    // FULL SCREEN VIEWPORT WRAPPER
   <div className="relative h-[100dvh] w-full bg-[#121212] flex flex-col font-saira overflow-hidden">
         
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
         
         <div className="flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-[#050505] flex flex-col">
             
             {showLanding ? (
                 <MobileCategoryLanding category={category} />
             ) : showHub ? (
                 <MobileChipsetHub category={category} maker={pMaker!} series={pSeries} products={products} />
             ) : (
                 <div className="pt-24 px-6 pb-6">
                     <div className="mb-6 flex justify-between items-center border-b border-white/5 pb-4">
                         <h1 className="font-orbitron font-bold text-xl text-white uppercase tracking-wider">{pChipset || pBrand || category}</h1>
                         <span className="text-[10px] text-[#B084FF] font-bold bg-[#B084FF]/10 px-2 py-1 rounded">{gridProducts.length} Items</span>
                     </div>
                     
                     {loading ? ( <div className="text-center py-10"><div className="w-8 h-8 border-2 border-[#B084FF] border-t-transparent rounded-full animate-spin mx-auto"></div></div> ) : (
                         <div className="grid grid-cols-2 gap-3">
                             {gridProducts.map(p => <MobileProductCard key={p.id} product={p} />)}
                         </div>
                     )}
                 </div>
             )}

             <div className="mt-auto w-full pb-28 flex flex-col">
                 <MobileFooter />
             </div>
         </div>
         
         {/* FIXED BOTTOM NAV */}
         <div className="fixed bottom-0 left-0 w-full px-6 z-[90] pointer-events-none">
             <div className="pointer-events-auto">
                 <MobileBottomNav />
             </div>
         </div>

         {/* OVERLAYS */}
         {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
         {searchOpen && (
           <div className="fixed inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl rounded-3xl p-6 animate-in zoom-in-95 shadow-2xl border border-brand-purple/20">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-orbitron text-white">Search</h2>
                  <button onClick={() => setSearchOpen(false)} className="text-white text-2xl active:scale-90"><FaTimes/></button>
              </div>
              <GlobalSearch placeholder={`Search ${category}...`} variant="standard" onSearchSubmit={() => setSearchOpen(false)} className="w-full" />
           </div>
         )}
    </div>
  );
}