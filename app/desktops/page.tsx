"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Reveal } from "@/components/ui/MotionWrappers";
import { HoverScale } from "@/components/ui/MotionWrappers";

// --- MOCK DATA FOR DESKTOPS ---
// Note: Signature Edition is marked with isWide: true for layout logic
// Added 'route' property to link to existing pages
const desktops = [
  { id: 1, name: "Ascend Series", series: "Ascend Series", cpu: "AMD", gpu: "NVIDIA", price: 145000, image: "/images/ascend.png", route: "/ascend" },
  { id: 3, name: "WorkPro Series", series: "WorkPro Series", cpu: "AMD", gpu: "AMD", price: 85000, image: "/images/workpro.png", route: "/workpro" },
  { id: 4, name: "Creator Series", series: "Creator Series", cpu: "Intel", gpu: "NVIDIA", price: 180000, image: "/images/creator.png", route: "/creator" },
  { id: 5, name: "Signature Series", series: "Signature Series", cpu: "Intel", gpu: "NVIDIA", price: 350000, image: "/images/signature.png", isWide: true, route: "/signature" },
];

// --- FILTER SECTION COMPONENT ---
const FilterGroup = ({ title, options, selected, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Reveal>
    <div className="mb-6 border-b border-white/10 pb-4">
      <div 
        className="flex justify-between items-center cursor-pointer mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-orbitron text-lg font-bold text-white uppercase tracking-wide">{title}</h3>
        <span className="text-brand-purple font-bold text-xl">{isOpen ? "-" : "+"}</span>
      </div>
      
      {isOpen && (
        <div className="space-y-2">
          {options.map((opt: string) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 border border-white/30 rounded-sm flex items-center justify-center transition-all ${selected.includes(opt) ? "bg-brand-purple border-brand-purple" : "group-hover:border-white"}`}>
                 {selected.includes(opt) && <span className="text-white text-xs">✓</span>}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={selected.includes(opt)}
                onChange={() => onChange(opt)}
              />
              <span className={`text-sm font-saira ${selected.includes(opt) ? "text-white" : "text-brand-silver group-hover:text-white"}`}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
    </Reveal>
  );
};

export default function DesktopsPage() {
  // --- STATE ---
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedCPU, setSelectedCPU] = useState<string[]>([]);
  const [selectedGPU, setSelectedGPU] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);

  // --- HANDLERS ---
  const toggleFilter = (item: string, list: string[], setList: Function) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  // --- FILTER LOGIC ---
  const filteredDesktops = useMemo(() => {
    return desktops.filter((pc) => {
      if (selectedSeries.length > 0 && !selectedSeries.includes(pc.series)) return false;
      if (selectedCPU.length > 0 && !selectedCPU.includes(pc.cpu)) return false;
      if (selectedGPU.length > 0 && !selectedGPU.includes(pc.gpu)) return false;
      
      if (selectedPrice.length > 0) {
        const matchesPrice = selectedPrice.some((range) => {
          if (range === "Under ₹70K") return pc.price < 70000;
          if (range === "₹70K - ₹150K") return pc.price >= 70000 && pc.price <= 150000;
          if (range === "₹150K - ₹220K") return pc.price > 150000 && pc.price <= 220000;
          if (range === "Above ₹220K") return pc.price > 220000;
          return false;
        });
        if (!matchesPrice) return false;
      }
      return true;
    });
  }, [selectedSeries, selectedCPU, selectedGPU, selectedPrice]);

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      <div className="pt-32 pb-12 px-[80px] 2xl:px-[100px] max-w-[1920px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* --- LEFT SIDEBAR (FILTERS) --- */}
          <aside className="w-full lg:w-1/4 h-fit sticky top-28">
            <div className="mb-8 border-b border-white/20 pb-4">
               <h2 className="font-orbitron text-xl text-white">Sort by :</h2>
            </div>

            <FilterGroup 
              title="Series" 
              options={["Ascend Series", "WorkPro Series", "Creator Series", "Signature Series"]} 
              selected={selectedSeries}
              onChange={(val: string) => toggleFilter(val, selectedSeries, setSelectedSeries)}
            />

            <FilterGroup 
              title="CPU" 
              options={["AMD", "Intel"]} 
              selected={selectedCPU}
              onChange={(val: string) => toggleFilter(val, selectedCPU, setSelectedCPU)}
            />

            <FilterGroup 
              title="GPU" 
              options={["NVIDIA", "AMD"]} 
              selected={selectedGPU}
              onChange={(val: string) => toggleFilter(val, selectedGPU, setSelectedGPU)}
            />

            <FilterGroup 
              title="Pricing" 
              options={["Under ₹70K", "₹70K - ₹150K", "₹150K - ₹220K", "Above ₹220K"]} 
              selected={selectedPrice}
              onChange={(val: string) => toggleFilter(val, selectedPrice, setSelectedPrice)}
            />
          </aside>

          {/* --- RIGHT GRID (PRODUCTS) --- */}
          <div className="w-full lg:w-3/4">
             <div className="mb-6 flex justify-between items-center">
                <span className="text-brand-silver text-sm">Showing {filteredDesktops.length} results</span>
             </div>

             {/* Grid Container */}
          
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredDesktops.map((pc) => (
                   <div 
                     key={pc.id} 
                     // Conditional Class: If 'isWide' is true, span full width (col-span-3)
                     className={`bg-[#1A1A1A] border border-white/5 p-6 flex flex-col items-center hover:border-brand-purple/50 transition-all group h-[500px] relative
                        ${(pc as any).isWide ? "xl:col-span-3 md:col-span-2" : ""}
                     `}
                   >
                      
                      {/* Series Title */}
                      <div className="w-full text-left mb-4">
                         <h3 className="font-orbitron text-2xl font-bold text-white uppercase leading-none">{pc.series.split(" ")[0]}</h3>
                         <span className="font-orbitron text-lg text-brand-silver uppercase tracking-widest">SERIES</span>
                      </div>

                      {/* Image Placeholder */}
                      <div className="w-full h-full bg-black/40 border border-white/5 mb-6 flex items-center justify-center relative overflow-hidden">
                         <span className="text-brand-silver/20 font-orbitron text-4xl font-bold -rotate-45 select-none">{pc.cpu}</span>
                         <div className="absolute bottom-2 right-2 flex gap-1">
                            <span className="text-[10px] bg-brand-purple px-1 font-bold text-black">{pc.cpu}</span>
                            <span className="text-[10px] bg-brand-blue px-1 font-bold text-black">{pc.gpu}</span>
                         </div>
                      </div>

                     {/* Buy Button */}
                      <div className="mt-auto w-full">
                         {/* FIX: Link to the specific series page instead of generic ID */}
                         <Link href={(pc as any).route || `/desktops/${pc.id}`}>
                            <button className="w-full border border-white/30 text-white py-2 font-orbitron text-sm tracking-wider hover:bg-white hover:text-black transition-all uppercase">
                               BUY NOW
                            </button>
                         </Link>
                      </div>

                   </div>
                ))}
             </div>
             
             {filteredDesktops.length === 0 && (
                <div className="w-full py-20 text-center border border-dashed border-white/10 text-brand-silver">
                   No desktops match your filters.
                </div>
             )}
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
}