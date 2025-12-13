"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";

export default function CreatorSeries() {
  return (
    <section className="relative py-24 bg-[#121212] overflow-hidden border-t border-white/5">
      
      {/* 1. CINEMATIC BACKGROUND IMAGE (Fixed Link) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <Image 
            // Reliable Unsplash ID for a Neon/Streamer setup
            src="https://images.unsplash.com/photo-1616588589676-60b30c3c1681?q=80&w=2070&auto=format&fit=crop" 
            alt="Creator Studio Background" 
            fill 
            className="object-cover"
         />
      </div>

      {/* 2. GRADIENT FADE (The "WorkPro" Effect) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#121212]/40 to-[#121212]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-[#121212]/50" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
                <Reveal>
                    <p className="font-saira text-purple-400 tracking-[0.2em] text-sm font-bold mb-2">STREAM. RENDER. CREATE.</p>
                    <h2 className="font-orbitron text-5xl md:text-6xl font-bold text-white mb-6">
                    CREATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">SERIES</span>
                    </h2>
                    <p className="text-brand-silver text-lg mb-8 leading-relaxed max-w-xl">
                    Stop compromising. The Creator Series is engineered to handle 4K video editing and 1080p60 streaming simultaneously. 
                    Zero dropped frames. Zero render bottlenecks.
                    </p>

                    <StaggerGrid className="grid grid-cols-2 gap-4 mb-10 max-w-md">
                        <StaggerItem className="rb-card p-4 text-center border-white/5 bg-black/50 backdrop-blur-md">
                            <span className="block font-bold text-white text-xl">NVENC</span>
                            <span className="text-xs text-gray-400">Stream Encoding</span>
                        </StaggerItem>
                        <StaggerItem className="rb-card p-4 text-center border-white/5 bg-black/50 backdrop-blur-md">
                            <span className="block font-bold text-white text-xl">STUDIO</span>
                            <span className="text-xs text-gray-400">Drivers Pre-Installed</span>
                        </StaggerItem>
                    </StaggerGrid>

                    <Link href="/creator">
                        <button className="rb-btn-primary px-8 py-4 rounded font-bold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-purple-500/40">
                            VIEW Series
                        </button>
                    </Link>
                </Reveal>
            </div>

            {/* Right Side: Abstract Visual / Clean Space */}
            <div className="hidden lg:block">
                {/* We leave this empty to let the background image shine through, 
                    or add a floating 3D element here later. */}
            </div>
        </div>

      </div>
    </section>
  );
}