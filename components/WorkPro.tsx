"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";

const features = [
  {
    title: "RENDERING",
    desc: "Optimized for Blender, Cinema 4D, and V-Ray. Multi-core dominance.",
    badge: "THREADRIPPER"
  },
  {
    title: "DATA SCIENCE",
    desc: "Dual GPU configurations for deep learning and AI model training.",
    badge: "DUAL 4090"
  },
  {
    title: "VIDEO EDITING",
    desc: "Scrub 8K footage without proxies. Adobe & DaVinci Resolve tuned.",
    badge: "128GB RAM"
  }
];

export default function WorkPro() {
  return (
    <section className="relative py-24 bg-[#121212] border-t border-white/5 overflow-hidden">
      
      {/* Background Image: Subtle Tech Abstract (UPDATED URL) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <Image 
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000" 
            alt="Server Background" 
            fill 
            className="object-cover grayscale"
         />
      </div>
      
      {/* Blue Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#265DAB]/5 to-[#121212]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <Reveal className="mb-16 md:flex justify-between items-end">
          <div className="max-w-2xl">
            <p className="font-saira text-[#265DAB] tracking-[0.2em] text-sm font-bold mb-2">PROFESSIONAL WORKSTATIONS</p>
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
              WORK<span className="text-[#265DAB]">PRO</span> SERIES
            </h2>
            <p className="text-brand-silver text-lg">
              Stability is not optional. Enterprise-grade components for professionals who can't afford downtime.
            </p>
          </div>
          <Link href="/workpro" className="hidden md:block">
            <button className="text-white border-b border-[#265DAB] pb-1 hover:text-[#265DAB] transition-colors uppercase tracking-widest text-xs font-bold">
              Explore Workstations
            </button>
          </Link>
        </Reveal>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((item, i) => (
            <StaggerItem key={i} className="h-full">
               <div className="rb-card p-8 h-full flex flex-col hover:border-[#265DAB]/50 group cursor-default bg-[#121212]/80 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-6">
                     <h3 className="font-orbitron text-2xl font-bold text-white group-hover:text-[#265DAB] transition-colors">{item.title}</h3>
                     <span className="bg-[#265DAB]/20 text-[#265DAB] text-[10px] font-bold px-2 py-1 rounded border border-[#265DAB]/30">{item.badge}</span>
                  </div>
                  <p className="text-brand-silver text-sm leading-relaxed">{item.desc}</p>
               </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
        
        {/* Mobile Button */}
        <div className="mt-8 md:hidden text-center">
            <Link href="/workpro" className="rb-btn-primary px-6 py-3 rounded text-xs uppercase font-bold tracking-wider inline-block">
                View All Workstations
            </Link>
        </div>

      </div>
    </section>
  );
}