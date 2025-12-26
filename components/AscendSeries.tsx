"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";
import { FaCrosshairs, FaGamepad, FaTrophy } from "react-icons/fa";

const tiers = [
  {
    tier: "5",
    title: "ASCEND 5",
    subtitle: "COMPETITIVE STANDARD",
    desc: "Engineered for high-FPS E-Sports titles. Dominate Valorant and CS2 without dropping a frame.",
    icon: <FaCrosshairs />,
    target: "1080p / 240Hz",
    link: "/ascend/5"
  },
  {
    tier: "7",
    title: "ASCEND 7",
    subtitle: "HIGH FIDELITY",
    desc: "The sweet spot for AAA gaming. Experience Cyberpunk and COD in stunning 1440p detail.",
    icon: <FaGamepad />,
    target: "1440p / 165Hz",
    link: "/ascend/7"
  },
  {
    tier: "9",
    title: "ASCEND 9",
    subtitle: "THE APEX",
    desc: "4K Ray Tracing mastery. The ultimate machine for enthusiasts who demand the absolute best.",
    icon: <FaTrophy />,
    target: "4K / Ultimate",
    link: "/ascend/9"
  }
];

export default function AscendSeries() {
  return (
    <section className="relative py-24 bg-[#121212] overflow-hidden border-t border-white/5">
      
      {/* Cinematic Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <Image 
            src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2000&auto=format&fit=crop" 
            alt="Gaming Atmosphere" 
            fill 
            className="object-cover"
         />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#121212]/50 to-[#121212]" />

      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px] relative z-10">
        
        <Reveal className="mb-16">
          <span className="font-saira text-brand-white tracking-[0.2em] text-xs font-bold uppercase block mb-2">
            The Gaming Lineup
          </span>
          <h2 className="font-orbitron text-4xl md:text-5xl font-black text-white uppercase">
            CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4E2C8B] to-[#924dbf]">WEAPON</span>
          </h2>
        </Reveal>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((item) => (
            <StaggerItem key={item.tier} className="h-full">
              <Link href={item.link} className="group block h-full">
                <div className="relative h-full bg-[#0a0a0a] border border-white/5 p-8 overflow-hidden hover:border-brand-purple/50 transition-all duration-500 rounded-sm">
                  
                  {/* Hover Glow */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-purple to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Icon Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-brand-purple text-2xl bg-brand-purple/10 p-3 rounded border border-brand-purple/20">
                        {item.icon}
                    </div>
                    <span className="font-orbitron font-bold text-white/20 text-4xl group-hover:text-white/10 transition-colors">
                        {item.tier}
                    </span>
                  </div>

                  <h3 className="font-orbitron text-2xl font-bold text-white mb-1 group-hover:text-brand-purple transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-brand-silver uppercase tracking-widest font-bold block mb-4">
                    {item.subtitle}
                  </span>

                  <p className="text-brand-silver/70 text-sm leading-relaxed mb-8 min-h-[60px]">
                    {item.desc}
                  </p>

                  {/* Footer Stats */}
                  <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                    <span className="text-xs text-brand-silver font-bold">TARGET</span>
                    <span className="text-xs text-white font-orbitron tracking-wider">{item.target}</span>
                  </div>

                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>

      </div>
    </section>
  );
}