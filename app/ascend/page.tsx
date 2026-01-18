"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaCrosshairs, FaBolt, FaCrown, FaArrowRight, FaStar } from "react-icons/fa";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ascend Series | High-Performance Gaming PCs", 
  description: "High-performance gaming PCs in India with powerful CPUs, GPUs, and clean builds by Rig Builders",
};

export default function AscendPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* --- HERO HEADER --- */}
      <section className="pt-20 pb-20 px-6 border-b border-white/5 bg-[#1A1A1A] relative overflow-hidden">
        {/* Gaming Ambient Glow (Purple for Ascend) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <Reveal>
            <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6 tracking-tighter">
              ASCEND <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-pink-500">SERIES</span>
            </h1>
            <p className="text-brand-silver text-lg max-w-2xl mx-auto font-saira tracking-wide">
              Precision-tuned for competitive dominance. Choose your performance bracket.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- CONTENT AREA (List Layout) --- */}
      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-16 relative z-10">
        
        {/* ASCEND 5 */}
        <Link href="/ascend/5" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-brand-purple">
                    
                    {/* Background Number Watermark */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-brand-purple/[0.05] transition-colors duration-500">
                        05
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        {/* Icon: Crosshairs for E-Sports */}
                        <div className="text-brand-purple text-2xl bg-brand-purple/10 p-4 rounded-full border border-brand-purple/20 group-hover:bg-brand-purple group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <FaCrosshairs />
                        </div>
                        {/* Title */}
                        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-brand-purple transition-colors">
                            ASCEND LEVEL 5
                        </h2>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            1080p Competitive Dominance. High FPS architecture optimized for E-Sports titles like Valorant, CS2, and Apex Legends.
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Deploy System</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

        {/* SEPARATOR */}
        <div className="w-full h-[1px] bg-white/5" />

        {/* ASCEND 7 (Best Seller) */}
        <Link href="/ascend/7" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-white">
                    
                     {/* Background Number */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-white/[0.05] transition-colors duration-500">
                        07
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        {/* Icon: Bolt for Power/Speed */}
                        <div className="text-white text-2xl bg-white/10 p-4 rounded-full border border-white/20 group-hover:bg-white group-hover:text-black group-hover:scale-110 transition-all duration-300">
                            <FaBolt />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-white transition-colors">
                                ASCEND LEVEL 7
                            </h2>
                            {/* Best Seller Badge */}
                            <span className="w-fit flex items-center gap-2 bg-brand-purple/20 border border-brand-purple/30 text-brand-purple px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                <FaStar size={10} /> Best Seller
                            </span>
                        </div>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            1440p Sweet Spot. The perfect balance of power and value for modern AAA titles and streaming capabilities.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Deploy System</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

        {/* SEPARATOR */}
        <div className="w-full h-[1px] bg-white/5" />

        {/* ASCEND 9 */}
        <Link href="/ascend/9" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-brand-purple">
                    
                    {/* Background Number */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-brand-purple/[0.05] transition-colors duration-500">
                        09
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        {/* Icon: Crown for King Tier */}
                        <div className="text-brand-purple text-2xl bg-brand-purple/10 p-4 rounded-full border border-brand-purple/20 group-hover:bg-brand-purple group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <FaCrown />
                        </div>
                        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-brand-purple transition-colors">
                            ASCEND LEVEL 9
                        </h2>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            4K Ultra Performance. No compromises. Pure silicon power for enthusiasts who demand max settings.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Deploy System</span>
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