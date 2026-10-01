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
    <section className="relative py-24 bg-rb-surface overflow-hidden border-t border-rb-line">
      
      {/* Background: Clean Corporate Abstract */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <Image 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
            alt="Corporate Office" 
            fill 
            className="object-cover grayscale"
         />
      </div>
      
      {/* Ember "Security" Tint */}
      {/*<div className="absolute inset-0 bg-gradient-to-r from-rb-surface via-[#E24410]/5 to-rb-surface" /> */}

      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px] relative z-10">
        
        <Reveal className="mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="font-saira text-rb-orange-deep tracking-[0.2em] text-xs font-bold uppercase block mb-2">
              Enterprise Solutions
            </span>
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white uppercase">
              WORK<span className="text-rb-orange-deep">PRO</span> SERIES
            </h2>
            <p className="text-rb-silver mt-4 max-w-xl text-lg">
              Security is our motto. Built for the corporate environment where stability, data integrity, and uptime are non-negotiable.
            </p>
          </div>
          <Link href="/workpro" className="hidden md:flex items-center gap-2 text-rb-orange-deep border-b border-rb-orange-deep/50 pb-1 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            View Enterprise Catalog
          </Link>
        </Reveal>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((item, i) => (
            <StaggerItem key={i} className="h-full">
               <Link href={item.link} className="group block h-full">
                 <div className="rb-card rb-sheen p-8 h-full bg-rb-black border border-rb-line hover:border-rb-orange-deep/50 transition-all duration-300 flex flex-col">

                    <div className="flex justify-between items-start mb-6">
                       <div className="text-rb-orange-deep text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                       </div>
                       <span className="bg-rb-orange-deep/10 text-rb-orange-deep text-[10px] font-bold px-2 py-1 rounded border border-rb-orange-deep/20 uppercase">
                          {item.badge}
                       </span>
                    </div>

                    <h3 className="font-orbitron text-2xl font-bold text-white mb-1 group-hover:text-rb-orange-deep transition-colors">
                        {item.title}
                    </h3>
                    <span className="text-[10px] text-rb-silver uppercase tracking-widest font-bold block mb-4">
                        {item.role}
                    </span>

                    <p className="text-rb-silver/70 text-sm leading-relaxed mb-6 flex-grow">
                        {item.desc}
                    </p>

                    <div className="flex items-center gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className="h-[1px] w-8 bg-rb-orange-deep" />
                        <span className="text-[10px] text-rb-orange-deep font-bold uppercase">EXPLORE</span>
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