"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignaturePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignature = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('series', 'signature');
      
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchSignature();
  }, []);

  return (
    <main className="min-h-screen bg-brand-black text-white font-saira">
      <Navbar />
      
      {/* HERO: The Masterpiece (Untouched) */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-6 border-b border-white/5 relative overflow-hidden bg-brand-black">
        {/* Purple Glow for Signature Brand */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-brand-purple/10 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <p className="font-saira text-brand-purple uppercase tracking-[0.3em] mb-4 text-xs md:text-sm font-bold">The Flagship Experience</p>
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-7xl text-white mb-6">
            SIGNATURE <span className="text-brand-purple">EDITION</span>
          </h1>
          <p className="font-saira text-brand-silver text-base md:text-xl max-w-2xl mx-auto px-4 leading-relaxed">
            A commissioned masterpiece. Custom cable themes, thermal certification, and signed by the builder.
          </p>
        </div>
      </section>

      {/* NEW: SIGNATURE COLLECTION GRID */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-b border-white/5">
        <h2 className="font-orbitron text-2xl md:text-3xl mb-12 text-white font-bold text-center uppercase">Available Commissions</h2>
        
        {loading ? (
            <div className="text-center text-brand-silver font-orbitron animate-pulse">Loading Masterpieces...</div>
        ) : products.length === 0 ? (
            <div className="text-center text-brand-silver border border-dashed border-white/10 py-12 rounded bg-white/5">
                No Signature builds available at this moment.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((p) => (
                    <div key={p.id} className="bg-[#1A1A1A] border border-white/5 p-6 flex flex-col group hover:border-brand-purple/50 transition-all duration-500 rounded-xl">
                        <Link href={`/product/${p.id}`} className="block h-80 bg-black/40 mb-6 flex items-center justify-center relative overflow-hidden rounded-lg">
                            {p.image_url ? (
                                <Image 
                                    src={p.image_url} 
                                    alt={p.name} 
                                    fill 
                                    className="object-contain group-hover:scale-105 transition-transform duration-500" 
                                />
                            ) : (
                                <span className="text-white/20 font-orbitron text-xl">{p.name}</span>
                            )}
                            {/* Signature Badge */}
                            <div className="absolute top-4 right-4 bg-brand-purple text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-full">
                                Signature
                            </div>
                        </Link>
                        
                        <div className="mb-4">
                            <h3 className="font-orbitron text-xl font-bold text-white mb-2 group-hover:text-brand-purple transition-colors">{p.name}</h3>
                            <p className="text-brand-silver text-xs line-clamp-2 min-h-[2.5em]">{p.description || "High-performance custom flagship build."}</p>
                        </div>
                        
                        {/* Premium Specs List */}
                        <div className="text-xs text-brand-silver space-y-2 mb-8 bg-black/20 p-4 rounded border border-white/5">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span>CPU</span> <span className="text-white font-bold">{p.specs?.["Processor"] || "TBD"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span>GPU</span> <span className="text-white font-bold">{p.specs?.["Graphics Card"] || "TBD"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>RAM</span> <span className="text-white font-bold">{p.specs?.["Memory"] || "TBD"}</span>
                            </div>
                        </div>

                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
                            <span className="font-bold text-xl text-white font-orbitron">₹{p.price.toLocaleString("en-IN")}</span>
                            <Link href={`/product/${p.id}`} className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-brand-purple hover:text-white transition-all rounded">
                                View Build
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      {/* THE PACKAGE SECTION (Untouched except button removal) */}
      <section className="py-12 md:py-20 px-6 bg-brand-black">
        <div className="max-w-5xl mx-auto text-center">
           <h2 className="font-orbitron text-2xl md:text-3xl mb-12 text-white font-bold">WHAT IS IN THE BOX?</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
              {/* Feature 1 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">01. Thermal Report</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">Every rig comes with a printed thermal stress-test certificate (Cinebench, 3DMark) proving stability before it ships.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">02. Builder's Signature</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">Signed verification card by the specific engineer who built, tuned, and cable-managed your machine.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">03. Custom Cables</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">Hand-trained cables in our signature Matte Black & Deep Purple color theme. No loose wires.</p>
              </div>
              
              {/* Feature 4 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">04. Build Log</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">A personal QR code linking to high-res photos of your specific build process, from parts to final testing.</p>
              </div>
           </div>
           
           {/* Button Removed Here */}
        </div>
      </section>
      <Footer />
    </main>
  );
}