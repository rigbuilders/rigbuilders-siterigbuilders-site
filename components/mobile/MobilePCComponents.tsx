"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

const components = [
  { id: "cpu", name: "Processors", img: "/images/Products/cpu.jpg" },
  { id: "motherboard", name: "Motherboards", img: "/images/Products/mobov2.jpg" },
  { id: "storage", name: "Storage", img: "/images/Products/nvme.jpg" },
  { id: "ram", name: "Memory", img: "/images/Products/ramv2.jpg" },
  { id: "cabinet", name: "Chassis", img: "/images/Products/pc cabinetv2.jpg" },
  { id: "cooler", name: "Cooling", img: "/images/Products/aiov2.jpg" }
];

export default function MobilePCComponents() {
  return (
    <div className="w-full mb-12">
      <div className="px-[30px] mb-4">
        <Link href="/products" className="flex justify-between items-end w-full group">
          <h3 className="text-white font-saira font-bold text-[15px] border-b border-brand-purple/50 pb-1">
            PC Components
          </h3>
          <div className="text-white group-hover:text-brand-purple transition-colors pb-1">
            <FaArrowRight className="text-sm" />
          </div>
        </Link>
      </div>

      {/* Changed to 2 columns with 10px gap to lock in the 160px squares */}
      <div className="px-[30px] grid grid-cols-2 gap-[10px] mb-[10px]">
        {components.map((c) => (
          <Link 
            key={c.id} 
            href={`/products/${c.id}`} 
            className="relative aspect-square bg-[#050505] border border-white/10 rounded-xl overflow-hidden active:scale-[0.95] transition-transform"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent z-20" />
            <Image src={c.img} alt={c.name} fill className="object-cover z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/20 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 p-3 font-saira z-20 w-full">
                <h4 className="text-white font-bold text-[13px] leading-tight drop-shadow-md truncate">{c.name}</h4>
            </div>
          </Link>
        ))}
      </div>

      {/* The Wide GPU Block (Forced to exact 160px height to match the squares) */}
      <div className="px-[30px]">
        <Link href="/products/gpu" className="block relative w-full h-[160px] bg-[#050505] border border-white/10 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent z-20" />
          <Image src="/images/Products/gpuv3.jpg" alt="Graphics Cards" fill className="object-cover z-0" />
        </Link>
      </div>
    </div>
  );
}