"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaArrowRight, FaMicrochip, FaMemory, FaHdd, FaBolt } from "react-icons/fa";

export default function SignaturePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignature = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('series', 'signature')
        .order('price', { ascending: false });
      
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchSignature();
  }, []);

  // Helper to safely get specs (checks multiple casing/keys)
  const getSpec = (specs: any, keys: string[]) => {
    if (!specs) return "TBD";
    for (const key of keys) {
        if (specs[key]) return specs[key];
        if (specs[key.toLowerCase()]) return specs[key.toLowerCase()];
    }
    return "TBD";
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* --- HERO: THE MASTERPIECE (Unchanged) --- */}
      <section className="pt-20 pb-20 px-6 border-b border-white/5 relative overflow-hidden bg-[#121212]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-brand-purple/20 via-transparent to-transparent blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Reveal>
            <p className="font-saira text-brand-purple uppercase tracking-[0.4em] mb-6 text-xs md:text-sm font-bold">
                The Flagship Experience
            </p>
            <h1 className="font-orbitron font-black text-5xl md:text-8xl text-white mb-8 tracking-tighter">
              SIGNATURE <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-amber-400">EDITION</span>
            </h1>
            <p className="font-saira text-brand-silver text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Commissioned Masterpieces. Hand-signed by the builder, custom cable themes, and thermal certification. 
              These are not just computers; they are statement pieces.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- SIGNATURE SHOWCASE (Natural Merge Layout) --- */}
      <div className="flex flex-col">
        {loading ? (
             <div className="h-[50vh] flex flex-col items-center justify-center text-brand-purple animate-pulse">
                <div className="text-xl font-orbitron mb-2 tracking-widest">LOADING ARCHIVES</div>
             </div>
        ) : products.length === 0 ? (
             <div className="py-24 text-center border-b border-white/5">
                <p className="text-brand-silver">No Signature commissions available currently.</p>
             </div>
        ) : (
            products.map((product, index) => {
                const isEven = index % 2 === 0; // Zig-Zag Logic
                
                return (
                    <section key={product.id} className="min-h-[90vh] flex items-center border-b border-white/5 relative overflow-hidden group">
                        
                        {/* Background Gradient for Section Depth */}
                        <div className={`absolute top-0 w-[50%] h-full bg-gradient-to-r from-brand-purple/5 to-transparent blur-3xl pointer-events-none ${isEven ? 'right-0' : 'left-0'}`} />

                        <div className={`w-full max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 items-center`}>
                            
                            {/* --- CONTENT SIDE --- */}
                            <div className={`order-2 ${isEven ? 'lg:order-1' : 'lg:order-2'} px-6 md:px-12 lg:px-24 py-20 relative z-10`}>
                                <Reveal>
                                    <div className="relative">
                                        {/* Decorative ID Number */}
                                        <span className="text-[6rem] md:text-[10rem] font-bold font-orbitron text-white/[0.03] absolute -top-16 -left-8 select-none pointer-events-none">
                                            0{index + 1}
                                        </span>

                                        <span className="text-brand-purple font-bold tracking-[0.2em] text-sm uppercase mb-4 block">
                                            Signature Collection
                                        </span>
                                        
                                        <h2 className="font-orbitron text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                                            {product.name}
                                        </h2>
                                        
                                        <p className="text-brand-silver text-lg leading-relaxed mb-10 max-w-xl">
                                            {product.description || "A pinnacle of engineering. Designed for those who demand the absolute limit of performance and aesthetics."}
                                        </p>

                                        {/* SPECS GRID (Dynamic Keys) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12 border-t border-b border-white/5 py-10">
                                            
                                            {/* CPU */}
                                            <div className="flex items-start gap-4">
                                                <FaMicrochip className="text-brand-purple text-xl mt-1 shrink-0" />
                                                <div>
                                                    <span className="block text-[10px] uppercase text-brand-silver tracking-wider mb-1">Processor</span>
                                                    <span className="text-white font-bold text-sm md:text-base leading-tight block">
                                                        {getSpec(product.specs, ["Processor", "CPU", "recipe_cpu"])}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* GPU */}
                                            <div className="flex items-start gap-4">
                                                <FaBolt className="text-brand-purple text-xl mt-1 shrink-0" />
                                                <div>
                                                    <span className="block text-[10px] uppercase text-brand-silver tracking-wider mb-1">Graphics</span>
                                                    <span className="text-white font-bold text-sm md:text-base leading-tight block">
                                                        {getSpec(product.specs, ["Graphics Card", "GPU", "Graphics", "recipe_gpu"])}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* RAM */}
                                            <div className="flex items-start gap-4">
                                                <FaMemory className="text-brand-purple text-xl mt-1 shrink-0" />
                                                <div>
                                                    <span className="block text-[10px] uppercase text-brand-silver tracking-wider mb-1">Memory</span>
                                                    <span className="text-white font-bold text-sm md:text-base leading-tight block">
                                                        {getSpec(product.specs, ["Memory", "RAM", "recipe_ram"])}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Storage */}
                                            <div className="flex items-start gap-4">
                                                <FaHdd className="text-brand-purple text-xl mt-1 shrink-0" />
                                                <div>
                                                    <span className="block text-[10px] uppercase text-brand-silver tracking-wider mb-1">Storage</span>
                                                    <span className="text-white font-bold text-sm md:text-base leading-tight block">
                                                        {getSpec(product.specs, ["Storage", "SSD", "recipe_storage"])}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PRICE & ACTION */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                                            <div>
                                                <span className="block text-xs text-brand-silver uppercase tracking-widest mb-1">Commission Price</span>
                                                <span className="font-orbitron text-4xl font-bold text-white">₹{product.price.toLocaleString("en-IN")}</span>
                                            </div>
                                            
                                            <Link href={`/product/${product.id}`}>
                                                <button className="px-8 py-4 bg-white text-black font-orbitron font-bold text-sm uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-brand-purple/50 flex items-center gap-3">
                                                    Inspect Build <FaArrowRight />
                                                </button>
                                            </Link>
                                        </div>

                                    </div>
                                </Reveal>
                            </div>

                            {/* --- IMAGE SIDE (NO BLOCK) --- */}
                            <div className={`relative h-[60vh] lg:h-[90vh] w-full order-1 ${isEven ? 'lg:order-2' : 'lg:order-1'} overflow-hidden`}>
                                <Reveal delay={0.2} className="h-full w-full">
                                    
                                    {/* 1. The Glow Behind (Natural Merge) */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-purple/20 blur-[150px] rounded-full" />
                                    
                                    {/* 2. The Image */}
                                    {product.image_url ? (
                                        <div className="relative w-full h-full">
                                            <Image 
                                                src={product.image_url} 
                                                alt={product.name}
                                                fill
                                                className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] scale-90 group-hover:scale-100 transition-transform duration-[1.5s] ease-out"
                                                priority={index === 0}
                                            />
                                            
                                            {/* 3. Gradient overlay at bottom to blend with section border */}
                                            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-orbitron text-white/10 text-4xl">CONFIDENTIAL</span>
                                        </div>
                                    )}
                                </Reveal>
                            </div>

                        </div>
                    </section>
                );
            })
        )}
      </div>

      {/* --- PACKAGE INCLUSIONS (Unchanged) --- */}
      <section className="py-24 px-6 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-6xl mx-auto">
           <Reveal>
             <h2 className="font-orbitron text-3xl md:text-4xl mb-16 text-white font-bold text-center">
                 SIGNATURE <span className="text-brand-purple">PRIVILEGES</span>
             </h2>
           </Reveal>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                  { id: "01", title: "Thermal Certification", desc: "Every rig comes with a printed thermal stress-test certificate (Cinebench, 3DMark) proving stability." },
                  { id: "02", title: "Builder's Signature", desc: "Signed verification card by the specific engineer who built, tuned, and cable-managed your machine." },
                  { id: "03", title: "Bespoke Cabling", desc: "Hand-trained cables in our signature Matte Black & Deep Purple color theme. Zero loose wires." },
                  { id: "04", title: "Digital Build Log", desc: "A personal QR code linking to high-res photos of your specific build process, from parts to final testing." }
              ].map((feature, i) => (
                  <Reveal key={i} delay={i * 0.1}>
                    <div className="p-8 border border-white/5 bg-[#121212] hover:border-brand-purple/50 transition-all duration-300 h-full group">
                        <span className="block text-brand-purple font-orbitron font-bold text-xl mb-4 opacity-50 group-hover:opacity-100">{feature.id}</span>
                        <h3 className="text-white font-orbitron font-bold mb-3 text-lg">{feature.title}</h3>
                        <p className="text-sm text-brand-silver/60 leading-relaxed group-hover:text-brand-silver transition-colors">{feature.desc}</p>
                    </div>
                  </Reveal>
              ))}
           </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}