"use client";

import Link from "next/link";
import MotionWrapper from "@/components/mobile/MotionWrapper";

const DATA: Record<string, any[]> = {
  cpu: [
    { id: "intel", brand: "Intel", title: "CORE PERFORMANCE", img: "/images/landing/cpu-intel.jpg", color: "from-blue-600/80", text: "text-blue-400", link: "?brand=Intel" },
    { id: "amd", brand: "AMD", title: "RYZEN POWER", img: "/images/landing/cpu-amd.jpg", color: "from-red-600/80", text: "text-red-500", link: "?brand=AMD" }
  ],
  gpu: [
    { id: "nvidia", brand: "NVIDIA", title: "GEFORCE RTX", img: "/images/landing/gpu-nvidia.jpg", color: "from-green-600/80", text: "text-green-500", link: "?maker=NVIDIA" },
    { id: "amd", brand: "AMD", title: "RADEON RX", img: "/images/landing/gpu-amd.jpg", color: "from-red-600/80", text: "text-red-500", link: "?maker=AMD" }
  ],
  motherboard: [
    { id: "amd-mobo", brand: "AMD PLATFORMS", title: "AM5 & AM4", img: "/images/landing/cpu-amd.jpg", color: "from-red-600/80", text: "text-red-500", link: "?maker=AMD" },
    { id: "intel-mobo", brand: "INTEL PLATFORMS", title: "LGA 1700/1851", img: "/images/landing/cpu-intel.jpg", color: "from-blue-600/80", text: "text-blue-400", link: "?maker=Intel" }
  ]
};

export default function MobileCategoryLanding({ category }: { category: string }) {
  const sections = DATA[category.toLowerCase()];
  if (!sections) return null;

  return (
    <div className="flex flex-col min-h-full w-full pt-20">
      {sections.map((s, i) => (
        <MotionWrapper key={s.id} delay={i * 0.1} className="flex-1 w-full min-h-[350px] relative">
            <Link href={`/m/components/${category}${s.link}`} className="absolute inset-0 block border-b border-white/10 active:scale-[0.98] transition-transform overflow-hidden">
                <div className="absolute inset-0 bg-[#050505]">
                    <img src={s.img} alt={s.brand} className="w-full h-full object-cover opacity-50" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${s.color} via-[#050505]/60 to-transparent opacity-90`} />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center pb-12 z-10">
                    <h3 className={`font-orbitron font-bold text-[10px] tracking-[0.2em] mb-1 ${s.text}`}>{s.title}</h3>
                    <h2 className="font-orbitron font-black text-4xl text-white drop-shadow-2xl uppercase mb-4">{s.brand}</h2>
                    <span className="border border-white/30 px-6 py-2 font-orbitron font-bold text-[9px] uppercase tracking-[0.2em] rounded bg-black/40 backdrop-blur-sm text-white">Select Maker</span>
                </div>
            </Link>
        </MotionWrapper>
      ))}
    </div>
  );
}