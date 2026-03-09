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
      
      {/* HEADER: Exactly 30px from left, Link wrapped correctly so arrow works */}
      <div className="px-[20px] mb-4">
        <Link href="/desktops" className="flex justify-between items-end w-full group">
          <h3 className="text-white font-saira font-bold text-[15px] border-b border-brand-purple/50 pb-1">
            Explore Desktops
          </h3>
          <div className="text-white group-hover:text-brand-purple transition-colors pb-1">
            <FaArrowRight className="text-sm" />
          </div>
        </Link>
      </div>

      {/* CARDS: Added scroll-pl-[30px] so it always snaps exactly in line with the header text */}
      <div className="flex overflow-x-auto gap-4 px-[20px] scroll-pl-[30px] pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {desktops.map((d) => (
          <Link 
            key={d.id} 
            href={`/${d.id}`} 
            // Made the entire card a perfect square
            className="flex-shrink-0 w-[160px] aspect-square bg-[#050505] border border-white/10 rounded-2xl snap-start hover:border-brand-purple transition-colors relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent z-20" />
            
            {/* The image now completely fills the entire square box */}
            <Image src={d.img} alt={d.name} fill className="object-cover z-0" />
            
            {/* Dark gradient overlay so the text is readable over the image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/30 to-transparent z-10" />
            
            {/* Floating Text at the bottom inside the box */}
            <div className="absolute bottom-0 left-0 p-4 font-saira z-20">
                <h4 className="text-white font-bold text-[16px] leading-tight drop-shadow-md">{d.name}</h4>
                <span className="text-brand-purple text-[10px] uppercase font-bold tracking-widest drop-shadow-md">Series</span>
            </div>
          </Link>
        ))}
        
        {/* Invisible spacer so the final card doesn't touch the right edge of the phone */}
        <div className="w-[14px] flex-shrink-0" />
      </div>
    </div>
  );
}