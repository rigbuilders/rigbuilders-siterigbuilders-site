"use client";

import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";
import { FaShieldAlt, FaBuilding, FaServer } from "react-icons/fa";

const tiers = [
  {
    title: "WORKPRO 5",
    role: "CORPORATE FLEET",
    desc: "Secure, reliable desktops for daily office operations. Optimized for ERP, CRM, and Office Suites.",
    icon: <FaBuilding />,
    badge: "FLEET READY",
    link: "/workpro/5"
  },
  {
    title: "WORKPRO 7",
    role: "EXECUTIVE POWER",
    desc: "Multitasking dominance for financial modeling, huge datasets, and content review. Zero slowdowns.",
    icon: <FaShieldAlt />,
    badge: "DATA SECURE",
    link: "/workpro/7"
  },
  {
    title: "WORKPRO 9",
    role: "INFRASTRUCTURE",
    desc: "Threadripper compute power for local servers, AI training, and heavy rendering tasks.",
    icon: <FaServer />,
    badge: "THREADRIPPER",
    link: "/workpro/9"
  }
];

export default function WorkPro() {
  return (
    <section className="relative py-24 bg-[#121212] overflow-hidden border-t border-white/5">
      
      {/* Background: Clean Corporate Abstract */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <Image 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
            alt="Corporate Office" 
            fill 
            className="object-cover grayscale"
         />
      </div>
      
      {/* Blue "Security" Tint */}
      {/*<div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#265DAB]/5 to-[#121212]" /> */}

      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px] relative z-10">
        
        <Reveal className="mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="font-saira text-[#265DAB] tracking-[0.2em] text-xs font-bold uppercase block mb-2">
              Enterprise Solutions
            </span>
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white uppercase">
              WORK<span className="text-[#265DAB]">PRO</span> SERIES
            </h2>
            <p className="text-brand-silver mt-4 max-w-xl text-lg">
              Security is our motto. Built for the corporate environment where stability, data integrity, and uptime are non-negotiable.
            </p>
          </div>
          <Link href="/workpro" className="hidden md:flex items-center gap-2 text-[#265DAB] border-b border-[#265DAB]/50 pb-1 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            View Enterprise Catalog
          </Link>
        </Reveal>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((item, i) => (
            <StaggerItem key={i} className="h-full">
               <Link href={item.link} className="group block h-full">
                 <div className="rb-card p-8 h-full bg-[#0a0a0a] border border-white/5 hover:border-[#265DAB]/50 transition-all duration-300 flex flex-col">
                    
                    <div className="flex justify-between items-start mb-6">
                       <div className="text-[#265DAB] text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                       </div>
                       <span className="bg-[#265DAB]/10 text-[#265DAB] text-[10px] font-bold px-2 py-1 rounded border border-[#265DAB]/20 uppercase">
                          {item.badge}
                       </span>
                    </div>

                    <h3 className="font-orbitron text-2xl font-bold text-white mb-1 group-hover:text-[#265DAB] transition-colors">
                        {item.title}
                    </h3>
                    <span className="text-[10px] text-brand-silver uppercase tracking-widest font-bold block mb-4">
                        {item.role}
                    </span>
                    
                    <p className="text-brand-silver/70 text-sm leading-relaxed mb-6 flex-grow">
                        {item.desc}
                    </p>

                    <div className="flex items-center gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className="h-[1px] w-8 bg-[#265DAB]" />
                        <span className="text-[10px] text-[#265DAB] font-bold uppercase">EXPLORE</span>
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