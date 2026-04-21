"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import MobileProductGallery from "@/components/mobile/product/MobileProductGallery";
import MobileProductInfo from "@/components/mobile/product/MobileProductInfo";
import MobileProductShowcase from "@/components/mobile/product/MobileProductShowcase";
import MobileProductExtra from "@/components/mobile/product/MobileProductExtra";
import { FaTimes } from "react-icons/fa";

export default function MobileProductClient({ initialProduct, id }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [related, setRelated] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSecondary = async () => {
      const [u, rev, rel] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, price, image_url').eq('category', initialProduct.category).neq('id', id).limit(4)
      ]);
      if (u.data.user) setUser(u.data.user);
      if (rev.data) setReviews(rev.data);
      if (rel.data) setRelated(rel.data);
    };
    fetchSecondary();
  }, [id, initialProduct.category]);

  return (
    // FULL SCREEN VIEWPORT WRAPPER
   <div className="relative h-[100dvh] w-full bg-[#121212] flex flex-col font-saira overflow-hidden">
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
         
         <div className="flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-[#050505] flex flex-col">
            <MobileProductGallery product={initialProduct} />
            <MobileProductInfo product={initialProduct} />
            <MobileProductShowcase product={initialProduct} />
            <MobileProductExtra product={initialProduct} related={related} reviews={reviews} user={user} setReviews={setReviews} />
            
            <div className="mt-auto w-full flex flex-col">
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
           <div className="fixed inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl border border-brand-purple/20 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-orbitron text-white">Search</h2>
                 <button onClick={() => setSearchOpen(false)} className="text-white text-2xl"><FaTimes /></button>
              </div>
              <GlobalSearch placeholder="Search components..." variant="standard" onSearchSubmit={() => setSearchOpen(false)} className="w-full" />
           </div>
         )}
    </div>
  );
}