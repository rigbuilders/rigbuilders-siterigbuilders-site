"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";

export default function CreatorSeries() {
  return (
    <section className="relative py-24 bg-[#121212] overflow-hidden border-t border-white/5">
      
      {/* 1. CINEMATIC BACKGROUND IMAGE (Local File) */}
      <div className="absolute inset-0 pointer-events-none">
         <Image 
            src="/images/homepage/creator series/3.jpg" 
            alt="Creator Studio Background" 
            fill 
            // 'object-right' keeps the focus on the right side of the image
            className="object-cover object-right opacity-60"
            priority
         />
      </div>

      {/* 2. PHOTOSHOP-STYLE MASKING (Gradients) */}
      
      {/* Left-to-Right Fade: Solid black on left (under text), transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212] to-transparent lg:via-[#121212]/80" />
      
      {/* Bottom Fade: Blends the image into the footer/next section */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#121212]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content (Left Side - Sitting on top of the solid gradient) */}
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

            {/* Right Side: Empty to let the image shine through */}
            <div className="hidden lg:block"></div>
        </div>

      </div>
    </section>
  );
}