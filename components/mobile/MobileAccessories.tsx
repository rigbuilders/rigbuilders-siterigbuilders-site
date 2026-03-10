"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

const accessories = [
  { id: "keyboard", name: "Keyboards", img: "/images/Accessories/keyboardv2.jpg" },
  { id: "mousepad", name: "Mouse Pads", img: "/images/Accessories/padv2.jpg" },
  { id: "mouse", name: "Mice", img: "/images/Accessories/mousev2.jpg" },
  { id: "combo", name: "Combos", img: "/images/Accessories/combov2.jpg" }
];

export default function MobileAccessories() {
  return (
    <div className="w-full mb-12">
      <div className="px-[30px] mb-4">
        <Link href="/accessories" className="flex justify-between items-end w-full group">
          <h3 className="text-white font-saira font-bold text-[15px] border-b border-brand-purple/50 pb-1">
            Accessories
          </h3>
          <div className="text-white group-hover:text-brand-purple transition-colors pb-1">
            <FaArrowRight className="text-sm" />
          </div>
        </Link>
      </div>

      {/* 2-Column Grid */}
      <div className="px-[30px] grid grid-cols-2 gap-[10px] mb-[10px]">
        {accessories.map((a) => (
          <Link 
            key={a.id} 
            href={`/products/${a.id}`} 
            className="relative aspect-square bg-[#050505] border border-white/10 rounded-xl overflow-hidden active:scale-[0.95] transition-transform"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent z-20" />
            <Image src={a.img} alt={a.name} fill className="object-cover z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/20 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 p-3 font-saira z-20 w-full">
                <h4 className="text-white font-bold text-[13px] leading-tight drop-shadow-md truncate">{a.name}</h4>
            </div>
          </Link>
        ))}
      </div>

      {/* The Wide Monitor Block (Forced to exact 160px height) */}
      <div className="px-[30px]">
        <Link href="/products/monitor" className="block relative w-full h-[160px] bg-[#050505] border border-white/10 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent z-20" />
          <Image src="/images/Accessories/monitorv3.jpg" alt="Monitors" fill className="object-cover z-0" />
        </Link>
      </div>
    </div>
  );
}