"use client";

import Link from "next/link";
import { FaChevronRight, FaMicrochip } from "react-icons/fa";
import MotionWrapper from "@/components/mobile/MotionWrapper";

export default function MobileChipsetHub({ category, maker, series, products }: any) {
  const availableSeries = Array.from(new Set(products.filter((p:any) => p.specs?.chipset_maker === maker && p.specs?.chipset_series).map((p:any) => p.specs?.chipset_series)));
  const availableModels = Array.from(new Set(products.filter((p:any) => p.specs?.chipset_maker === maker && p.specs?.chipset_series === series && p.specs?.chipset).map((p:any) => p.specs?.chipset)));
  const color = maker === 'NVIDIA' ? 'text-green-500' : maker === 'AMD' ? 'text-red-500' : 'text-[#3b82f6]';

  return (
    <div className="min-h-full bg-[#050505] flex flex-col items-center pt-28 px-6 pb-20 relative z-10">
      <div className="text-center mb-10 w-full">
        <span className="text-[#A0A0A0] text-[10px] font-bold tracking-[0.3em] uppercase mb-2 block">Select {series ? 'Model' : 'Series'}</span>
        <h1 className="font-orbitron text-3xl font-black text-white uppercase flex items-center justify-center gap-3">
            <FaMicrochip className={color} /> {maker}
        </h1>
      </div>

      {!series ? (
          <div className="flex flex-col gap-4 w-full">
              {availableSeries.map((s: any, i: number) => (
                  <MotionWrapper key={s as string} delay={i * 0.05}>
                      <Link href={`/m/components/${category}?maker=${maker}&series=${encodeURIComponent(s as string)}`} className="bg-[#1A1A1A] border border-white/10 p-6 rounded-2xl flex justify-between items-center active:scale-95 transition-transform">
                          <h3 className="font-orbitron text-lg font-bold text-white">{s as string}</h3>
                          <FaChevronRight className="text-[#B084FF]" />
                      </Link>
                  </MotionWrapper>
              ))}
          </div>
      ) : (
          <div className="flex flex-col gap-3 w-full">
              {availableModels.map((model: any, i: number) => (
                  <MotionWrapper key={model as string} delay={i * 0.05}>
                      <Link href={`/m/components/${category}?chipset=${encodeURIComponent(model as string)}`} className="bg-[#1A1A1A] border border-white/5 p-5 rounded-xl flex justify-between items-center active:scale-95 transition-transform">
                          <span className="font-orbitron font-bold text-sm text-white">{model as string}</span>
                          <FaChevronRight className="text-white/30" size={12} />
                      </Link>
                  </MotionWrapper>
              ))}
          </div>
      )}
    </div>
  );
}