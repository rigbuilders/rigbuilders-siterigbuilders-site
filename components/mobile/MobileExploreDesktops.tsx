"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

const desktops = [
  { id: "ascend", name: "Ascend", img: "/mobile/home/desktops/1.jpg" },
  { id: "workpro", name: "WorkPro", img: "/mobile/home/desktops/2.jpg" },
  { id: "creator", name: "Creator", img: "/mobile/home/desktops/3.jpg" }
];

export default function MobileExploreDesktops() {
  return (
    <div className="w-full mt-4 mb-8">
      
      <div className="px-[30px] mb-4">
        <Link href="/desktops" className="flex justify-between items-end w-full group">
          <h3 className="text-white font-saira font-bold text-[15px] border-b border-brand-purple/50 pb-1">
            Explore Desktops
          </h3>
          <div className="text-white group-hover:text-brand-purple transition-colors pb-1">
            <FaArrowRight className="text-sm" />
          </div>
        </Link>
      </div>

      {/* Horizontal Scroll Track - Gap set to 10px to perfectly match the grid spacing below */}
      <div className="flex overflow-x-auto gap-[10px] px-[30px] scroll-pl-[30px] pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* The 3 Square Cards (160x160) */}
        {desktops.map((d) => (
          <Link 
            key={d.id} 
            href={`/${d.id}`} 
            className="flex-shrink-0 w-[160px] h-[160px] bg-[#050505] border border-white/10 rounded-2xl snap-start hover:border-brand-purple transition-colors relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent z-20" />
            <Image src={d.img} alt={d.name} fill className="object-cover z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/30 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 p-4 font-saira z-20">
                <h4 className="text-white font-bold text-[16px] leading-tight drop-shadow-md">{d.name}</h4>
                <span className="text-brand-purple text-[10px] uppercase font-bold tracking-widest drop-shadow-md">Series</span>
            </div>
          </Link>
        ))}

        {/* The Merged Signature Rectangular Card (330x160) */}
        <Link 
            href="/signature" 
            className="flex-shrink-0 w-[330px] h-[160px] bg-[#050505] border border-white/10 rounded-2xl snap-start hover:border-brand-purple transition-colors relative overflow-hidden group"
        >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent z-20" />
            <Image src="/images/homepage/signature.jpg" alt="Signature Series" fill className="object-cover z-0" />
        </Link>
        
        {/* Invisible spacer so the Signature card clears the right padding */}
        <div className="w-[20px] flex-shrink-0" />
      </div>
    </div>
  );
}