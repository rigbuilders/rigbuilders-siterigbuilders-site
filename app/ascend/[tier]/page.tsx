"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AscendTierPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = use(params);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTier = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('series', 'ascend')
        .eq('tier', tier);
      
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchTier();
  }, [tier]);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      <div className="pt-32 pb-12 px-6 border-b border-white/5 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-bold text-4xl text-white mb-2">
            ASCEND <span className="text-brand-purple">LEVEL {tier}</span>
          </h1>
          <p className="text-brand-silver">Expertly crafted configurations for this performance tier.</p>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full">
        {loading ? (
            <div className="text-center text-brand-silver">Loading systems...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((p) => (
                    <div key={p.id} className="bg-[#1A1A1A] border border-white/5 p-6 flex flex-col group hover:border-brand-purple/50 transition-all">
                        <Link href={`/product/${p.id}`} className="block h-64 bg-black/40 mb-6 flex items-center justify-center relative">
                            {p.image_url ? <img src={p.image_url} className="max-h-full object-contain" /> : <span className="text-white/20 font-orbitron">{p.name}</span>}
                        </Link>
                        <h3 className="font-orbitron text-xl font-bold mb-2">{p.name}</h3>
                        
                        {/* MINI SPECS PREVIEW */}
                        <div className="text-xs text-brand-silver space-y-1 mb-6">
                            <p>CPU: <span className="text-white">{p.specs?.["Processor"] || "TBD"}</span></p>
                            <p>GPU: <span className="text-white">{p.specs?.["Graphics Card"] || "TBD"}</span></p>
                            <p>RAM: <span className="text-white">{p.specs?.["Memory"] || "TBD"}</span></p>
                        </div>

                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
                            <span className="font-bold text-lg">₹{p.price.toLocaleString("en-IN")}</span>
                            <Link href={`/product/${p.id}`} className="bg-white text-black px-4 py-2 text-xs font-bold uppercase hover:bg-brand-purple hover:text-white transition-all">
                                View Build
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <Footer />
    </div>
  );
}