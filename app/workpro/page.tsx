"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaCode, FaDraftingCompass, FaBrain, FaArrowRight, FaStar } from "react-icons/fa";

export default function WorkProPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* --- HERO HEADER --- */}
      <section className="pt-20 pb-20 px-6 border-b border-white/5 bg-[#1A1A1A] relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/5 blur-[150px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <Reveal>
            <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6 tracking-tighter">
              WORKPRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">SERIES</span>
            </h1>
            <p className="text-brand-silver text-lg max-w-2xl mx-auto font-saira tracking-wide">
              Precision-engineered workstations. Designed for stability, rendering, and heavy computation.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- CONTENT AREA (List Layout) --- */}
      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-16 relative z-10">
        
        {/* WORKPRO 5 */}
        <Link href="/workpro/5" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-brand-purple">
                    
                    {/* Background Number Watermark */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-brand-purple/[0.05] transition-colors duration-500">
                        05
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        {/* Icon */}
                        <div className="text-brand-purple text-2xl bg-brand-purple/10 p-4 rounded-full border border-brand-purple/20 group-hover:bg-brand-purple group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <FaCode />
                        </div>
                        {/* Title */}
                        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-brand-purple transition-colors">
                            WORKPRO 5
                        </h2>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            Efficient Office & Entry Productivity. Optimized for coding, financial modeling, and heavy multitasking.
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Explore Series</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

        {/* SEPARATOR */}
        <div className="w-full h-[1px] bg-white/5" />

        {/* WORKPRO 7 (Best Seller) */}
        <Link href="/workpro/7" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-brand-blue">
                    
                     {/* Background Number */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-brand-blue/[0.05] transition-colors duration-500">
                        07
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        <div className="text-brand-blue text-2xl bg-brand-blue/10 p-4 rounded-full border border-brand-blue/20 group-hover:bg-brand-blue group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <FaDraftingCompass />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-brand-blue transition-colors">
                                WORKPRO 7
                            </h2>
                            {/* Best Seller Badge */}
                            <span className="w-fit flex items-center gap-2 bg-brand-blue/20 border border-brand-blue/30 text-brand-blue px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                <FaStar size={10} /> Best Seller
                            </span>
                        </div>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            Engineering & Content Creation. The standard for 4K Video Editing, 3D Modeling, and CAD workflows.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Explore Series</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

        {/* SEPARATOR */}
        <div className="w-full h-[1px] bg-white/5" />

        {/* WORKPRO 9 */}
        <Link href="/workpro/9" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-brand-purple">
                    
                    {/* Background Number */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-brand-purple/[0.05] transition-colors duration-500">
                        09
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        <div className="text-brand-purple text-2xl bg-brand-purple/10 p-4 rounded-full border border-brand-purple/20 group-hover:bg-brand-purple group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <FaBrain />
                        </div>
                        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-brand-purple transition-colors">
                            WORKPRO 9
                        </h2>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            Data Science & AI Training. Unmatched computational power for deep learning and heavy simulation.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Explore Series</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

      </div>

      <Footer />
    </main>
  );
}