"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/MotionWrappers";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#121212]">
      
      {/* 1. CINEMATIC VIDEO BACKGROUND */}
      {/* Note: Replace 'poster' with a high-res screenshot of your video for faster loading */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" /> {/* Overlay to make text readable */}
        <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            poster="/images/homepage/hero/1.jpg"
            className="w-full h-full object-cover opacity-60"
        >
            {/* I'm using a placeholder tech video link here. 
                Later, generate a video with Veo, save as 'public/videos/hero.mp4' and change src below. */}
            <source src="https://cdn.pixabay.com/video/2023/10/22/186115-877660688_large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 2. Ambient Glow (Preserved from previous step) */}
      <div className="rb-hero-glow opacity-40 z-10 mix-blend-overlay" />

      {/* 3. Content */}
      
      <div className="relative z-20 text-center px-6 max-w-5xl mx-auto mt-10">
        <Reveal>
          <div className="inline-block mb-4 md:mb-6 border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full">
             <p className="font-saira text-brand-silver tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-xs font-bold uppercase">
                New: RTX 50-Series Configurations Available
             </p>
          </div>
          
          <h1 className="font-orbitron font-black text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white mb-8 leading-none drop-shadow-2xl">
            COMMISSIONED.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4E2C8B] to-[#924dbf]">
             NOT
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4E2C8B] to-[#924dbf]">
              ASSEMBLED.
            </span>
          </h1>

          <p className="font-saira text-brand-silver text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-shadow-sm">
            India&apos;s premium custom PC brand. Engineered for performance, built with craftsmanship, backed by proof.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/configure">
              <button className="rb-btn-primary px-10 py-4 rounded-none skew-x-[-10deg] border border-transparent shadow-lg hover:shadow-brand-purple/50">
                <span className="block skew-x-[10deg] uppercase tracking-widest text-sm font-bold">
                  Start Configuration
                </span>
              </button>
            </Link>

            <Link href="/signature">
              <button className="px-10 py-4 bg-black/40 backdrop-blur-sm border border-white/20 hover:border-white text-white skew-x-[-10deg] transition-all hover:bg-white/10">
                <span className="block skew-x-[10deg] font-saira font-bold uppercase tracking-widest text-sm">
                  View Signature Edition
                </span>
              </button>
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Scroll Indicator */}
      
    </section>
  );
}