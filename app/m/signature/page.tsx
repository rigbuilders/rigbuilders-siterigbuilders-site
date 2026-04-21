"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import MobileTopNav from "@/components/mobile/MobileTopNav";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import { FaTimes, FaArrowRight } from "react-icons/fa";

export default function MobileSignature() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSig = async () => {
      const { data } = await supabase.from('products').select('*').eq('series', 'signature');
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchSig();
  }, []);

  // Safely extract specs matching the logic from your desktop version
  const getSpec = (specs: any, keys: string[]) => {
    if (!specs) return "TBD";
    for (const key of keys) {
        if (specs[key]) return specs[key];
        if (specs[key.toLowerCase()]) return specs[key.toLowerCase()];
    }
    return "TBD";
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#050505] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
         <MobileTopNav onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => {}} />
         
         <div className="absolute top-24 left-6 z-20 pointer-events-none">
            {/* Added Gradient Text */}
            <h1 className="font-orbitron font-bold text-2xl text-white tracking-widest uppercase drop-shadow-xl">
                SIGNATURE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B084FF] to-[#FFD700]">EDITION</span>
            </h1>
         </div>

         {/* Snap-Y Scroll Container */}
         <div className="flex-grow overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden relative bg-[#050505]">
             {loading ? ( <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div></div> ) : (
                products.map((p, index) => (
                    <div key={p.id} className="w-full h-[750px] snap-center relative flex flex-col justify-end p-6 border-b border-white/10">
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            {p.image_url ? (
                                <img src={p.image_url} className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <div className="w-full h-full bg-[#121212] flex items-center justify-center text-white/10 font-orbitron">NO PREVIEW</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent" />
                        </div>
                        
                        {/* Content Overlay */}
                        <div className="relative z-10">
                            <span className="text-[#FFD700] text-[9px] font-bold uppercase tracking-widest mb-2 block border border-[#FFD700]/30 w-fit px-2 py-1 rounded bg-[#FFD700]/10">
                                Exotic Build 0{index + 1}
                            </span>
                            <h2 className="font-orbitron text-2xl font-bold text-white mb-2 leading-tight">{p.name}</h2>
                            <p className="text-[#A0A0A0] text-[11px] mb-4 line-clamp-2 font-saira leading-relaxed">{p.description}</p>
                            
                            {/* ADDED: Specs Mini-Grid */}
                            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 mb-6 border-l-2 border-[#FFD700] pl-3 bg-black/20 py-2 rounded-r-lg">
                                <div className="text-[9px] text-white truncate"><span className="text-[#FFD700] font-bold uppercase tracking-wider">CPU:</span> {getSpec(p.specs, ["Processor", "CPU", "recipe_cpu"])}</div>
                                <div className="text-[9px] text-white truncate"><span className="text-[#FFD700] font-bold uppercase tracking-wider">GPU:</span> {getSpec(p.specs, ["Graphics Card", "GPU", "recipe_gpu"])}</div>
                                <div className="text-[9px] text-white truncate"><span className="text-[#FFD700] font-bold uppercase tracking-wider">RAM:</span> {getSpec(p.specs, ["Memory", "RAM", "recipe_ram"])}</div>
                                <div className="text-[9px] text-white truncate"><span className="text-[#FFD700] font-bold uppercase tracking-wider">SSD:</span> {getSpec(p.specs, ["Storage", "SSD", "recipe_storage"])}</div>
                                <div className="text-[9px] text-white truncate col-span-2"><span className="text-[#FFD700] font-bold uppercase tracking-wider">OS:</span> {getSpec(p.specs, ["OS", "Operating System", "recipe_os"])}</div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <span className="font-orbitron font-bold text-lg text-white">₹{p.price.toLocaleString("en-IN")}</span>
                                <Link href={`/m/product/${p.id}`} className="bg-white text-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#FFD700] transition-colors flex items-center gap-2 active:scale-95">
                                    Explore <FaArrowRight />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))
             )}
         </div>
         
         <MobileBottomNav />
         {menuOpen && <MobileMenuDrawer onClose={() => setMenuOpen(false)} />}
      </div>
    </div>
    
  )
}