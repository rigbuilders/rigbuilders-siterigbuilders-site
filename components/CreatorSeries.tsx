"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";
import { FaVideo, FaLayerGroup, FaFilm } from "react-icons/fa";

const tiers = [
  { title: "CREATOR 5", tag: "STREAMER", desc: "Single-PC Streaming. NVENC Optimized.", icon: <FaVideo /> },
  { title: "CREATOR 7", tag: "EDITOR", desc: "4K scrubbing & heavy multitasking.", icon: <FaLayerGroup /> },
  { title: "CREATOR 9", tag: "STUDIO", desc: "3D Rendering & Cinema 8K Workflow.", icon: <FaFilm /> },
];

export default function CreatorSeries() {
  return (
    <section className="relative py-24 bg-rb-surface overflow-hidden border-t border-rb-line">
      
      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* LEFT: IMAGE (Cinematic Showcase) */}
            <div className="relative h-[500px] w-full hidden lg:block rounded-sm overflow-hidden border border-rb-line group">
                <Image 
                    src="/images/homepage/creator series/3.jpg" 
                    alt="Creator Studio" 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-rb-surface via-transparent to-transparent opacity-80" />
                
                {/* Floating Badge */}
                <div className="absolute bottom-8 left-8">
                     <span className="bg-white text-black text-xs font-bold px-3 py-1 uppercase tracking-widest">
                        NVIDIA Studio Ready
                     </span>
                </div>
            </div>

            {/* RIGHT: CONTENT */}
            <div>
                <Reveal>
                    <span className="rb-kicker text-rb-orange block mb-2">
                        Stream. Render. Create.
                    </span>
                    <h2 className="font-orbitron text-4xl md:text-6xl font-black text-white mb-6 uppercase">
                        CREATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-rb-orange to-[#FF8A4D]">SERIES</span>
                    </h2>
                    <p className="text-rb-silver text-lg mb-10 leading-relaxed max-w-xl">
                        Stop compromising. Designed for creators who can't afford render bottlenecks. 
                        Whether you are streaming 1080p60 or rendering 3D scenes, we have a tier for you.
                    </p>

                    {/* Mini Tiers Grid */}
                    <StaggerGrid className="space-y-4 mb-10">
                        {tiers.map((t, i) => (
                            <StaggerItem key={i}>
                                <div className="rb-sheen flex items-center gap-4 p-4 border border-rb-line bg-rb-black hover:border-rb-orange/40 transition-colors rounded-sm">
                                    <div className="text-rb-orange text-xl">{t.icon}</div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-orbitron font-bold text-white">{t.title}</h4>
                                            <span className="text-[9px] bg-white/10 text-rb-silver px-2 rounded uppercase tracking-wider">{t.tag}</span>
                                        </div>
                                        <p className="text-xs text-rb-silver/60 mt-1">{t.desc}</p>
                                    </div>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerGrid>

                    <Link href="/creator">
                        <button className="rb-sheen bg-white text-black hover:bg-rb-orange hover:text-white transition-all px-8 py-4 font-orbitron font-bold uppercase tracking-widest text-sm clip-path-slant">
                            View Studio Rigs
                        </button>
                    </Link>
                </Reveal>
            </div>

        </div>
      </div>
    </section>
  );
}