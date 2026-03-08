"use client";

import Link from "next/link";
import { FaChevronRight, FaMicrochip } from "react-icons/fa";

interface ChipsetHubProps {
  category: string;
  maker: string;
  series: string | null;
  products: any[];
}

export default function ChipsetHub({ category, maker, series, products }: ChipsetHubProps) {
  
  // 1. Extract what series and models ACTUALLY exist in your database for this Maker
  const availableSeries = Array.from(new Set(products
      .filter(p => p.specs?.chipset_maker === maker && p.specs?.chipset_series)
      .map(p => p.specs?.chipset_series)
  ));

  const availableModels = Array.from(new Set(products
      .filter(p => p.specs?.chipset_maker === maker && p.specs?.chipset_series === series && p.specs?.chipset)
      .map(p => p.specs?.chipset)
  ));

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0A0A0A] flex flex-col items-center pt-20 px-6 relative z-10">
      
      {/* Background Accents */}
      <div className={`absolute top-0 right-0 w-[600px] h-[600px] blur-[150px] pointer-events-none opacity-20 ${maker === 'NVIDIA' ? 'bg-green-500' : maker === 'AMD' ? 'bg-red-500' : 'bg-blue-500'}`} />

      <div className="text-center mb-16 relative z-10">
        <span className="text-brand-silver text-xs font-bold tracking-[0.3em] uppercase mb-4 block">
            Select Series
        </span>
        <h1 className="font-orbitron text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-4">
            <FaMicrochip className={maker === 'NVIDIA' ? 'text-green-500' : maker === 'AMD' ? 'text-red-500' : 'text-blue-500'} />
            {maker} <span className="opacity-30">{category === 'gpu' ? 'GRAPHICS' : 'PLATFORMS'}</span>
        </h1>
      </div>

      {/* STEP 1: CHOOSE SERIES (If not selected yet) */}
      {!series && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
              {availableSeries.map((s: any) => (
                  <Link 
                      key={s} 
                      href={`/products/${category}?maker=${maker}&series=${encodeURIComponent(s)}`}
                      className="group bg-[#121212] border border-white/10 hover:border-brand-purple p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 shadow-2xl relative overflow-hidden"
                  >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <h3 className="font-orbitron text-2xl font-bold text-white mb-2 relative z-10">{s}</h3>
                      <div className="flex items-center gap-2 text-brand-silver text-sm uppercase tracking-widest mt-6 relative z-10 group-hover:text-white transition-colors">
                          View Models <FaChevronRight className="text-brand-purple" />
                      </div>
                  </Link>
              ))}
          </div>
      )}

      {/* STEP 2: CHOOSE CHIPSET MODEL (If series IS selected) */}
      {series && (
          <div className="w-full max-w-5xl relative z-10">
              <div className="flex items-center gap-2 text-brand-silver text-sm mb-8">
                  <Link href={`/products/${category}?maker=${maker}`} className="hover:text-white">Series</Link>
                  <FaChevronRight size={10} />
                  <span className="text-white font-bold">{series}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {availableModels.map((model: any) => (
                      <Link 
                          key={model} 
                          href={`/products/${category}?chipset=${encodeURIComponent(model)}`}
                          className="group bg-[#151515] border border-white/5 hover:border-white p-6 transition-all duration-300 flex justify-between items-center"
                      >
                          <span className="font-orbitron font-bold text-lg text-white">{model}</span>
                          <span className="w-8 h-8 rounded bg-white/5 group-hover:bg-white flex items-center justify-center transition-colors">
                              <FaChevronRight className="text-white/50 group-hover:text-black" size={12} />
                          </span>
                      </Link>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
}