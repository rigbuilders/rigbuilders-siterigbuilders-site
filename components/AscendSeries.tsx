"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";

const levels = [
  {
    level: "5",
    title: "ASCEND LEVEL 5",
    desc: "The E-Sports Standard. Crushes Valorant, CS2, and Apex Legends at 144+ FPS.",
    link: "/ascend/5",
    badge: "E-SPORTS READY"
  },
  {
    level: "7",
    title: "ASCEND LEVEL 7",
    desc: "The 1440p Sweet Spot. Max out AAA titles with high settings and smooth framerates.",
    link: "/ascend/7",
    badge: "1440P BEAST"
  },
  {
    level: "9",
    title: "ASCEND LEVEL 9",
    desc: "4K Ultra Dominance. Ray Tracing ON. DLSS ON. The ultimate rig for enthusiasts.",
    link: "/ascend/9",
    badge: "4K RAY TRACING"
  }
];

export default function AscendSeries() {
  return (
    <section className="relative py-24 bg-[#121212] overflow-hidden border-t border-white/5">
      
      {/* 1. CINEMATIC BACKGROUND (New Working URL) */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
         <Image 
            // New Stable URL: Abstract Dark Tech/Hardware
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop" 
            alt="Gaming Tech Background" 
            fill 
            className="object-cover"
         />
      </div>

      {/* 2. GRADIENT FADE */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-transparent to-[#121212]" />
      <div className="absolute inset-0 bg-brand-purple/5 mix-blend-overlay" /> 

      {/* Decorative Crosshair */}
      <div className="absolute top-10 right-10 opacity-20 hidden md:block z-20">
         <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="white">
            <path d="M50 0V100M0 50H100" strokeWidth="1"/>
            <circle cx="50" cy="50" r="30" strokeWidth="1"/>
         </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <Reveal className="text-center mb-16">
          <p className="font-saira text-brand-purple tracking-[0.3em] text-sm font-bold mb-4 uppercase">
            Frame-Perfect Performance
          </p>
          <h2 className="font-orbitron text-4xl md:text-6xl font-black text-white mb-6 uppercase italic">
            DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4E2C8B] to-[#924dbf]">LOBBY</span>
          </h2>
          <p className="text-brand-silver max-w-2xl mx-auto text-lg leading-relaxed text-shadow-sm">
            Stop blaming lag. The Ascend Series is precision-tuned for high refresh rates and low latency. 
            From 1080p competitive to 4K immersion, choose your weapon.
          </p>
        </Reveal>

        {/* Cards Grid */}
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {levels.map((item) => (
            <StaggerItem key={item.level} className="h-full">
              <Link href={item.link} className="block h-full group">
                <div className="rb-card p-8 h-full flex flex-col items-center text-center hover:border-brand-purple/50 transition-all duration-300 relative overflow-hidden bg-[#121212]/80 backdrop-blur-sm">
                  
                  {/* Level Number Glow */}
                  <div className="relative w-16 h-16 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-brand-purple blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative w-full h-full rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center z-10">
                        <span className="font-orbitron text-3xl font-bold text-white">{item.level}</span>
                    </div>
                  </div>

                  <h3 className="font-orbitron text-xl font-bold text-white mb-4 group-hover:text-brand-purple transition-colors relative z-10">
                    {item.title}
                  </h3>
                  
                  <p className="text-brand-silver text-sm leading-relaxed mb-8 flex-grow relative z-10">
                    {item.desc}
                  </p>

                  <div className="w-full relative z-10">
                    <div className="rb-btn-primary py-3 px-6 rounded text-sm uppercase tracking-wider w-full font-bold">
                      View Series
                    </div>
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute top-4 right-4 bg-brand-purple/20 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-brand-purple border border-brand-purple/30 uppercase tracking-wide">
                      {item.badge}
                    </div>
                  )}

                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>

      </div>
    </section>
  );
}