"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaMicrochip, FaMemory, FaArrowRight } from "react-icons/fa";

// --- UPDATED DATA WITH LAYOUT LOGIC ---
const desktops = [
  { 
    id: 1, 
    name: "Ascend Series", 
    tagline: "RISE ABOVE THE ORDINARY",
    description: "The gateway to elite gaming. Engineered for high-refresh rate 1440p gaming with pure aesthetic focus.",
    series: "Ascend Series", 
    cpu: "AMD", 
    gpu: "NVIDIA", 
    price: 145000, 
    image: "/images/Desktops/ascend.jpg", 
    layout: "square", // SPLIT VIEW (Right Image)
    route: "/ascend" 
  },
  { 
    id: 3, 
    name: "WorkPro Series", 
    tagline: "INDUSTRIAL GRADE PERFORMANCE",
    description: "Built for stability. Optimized for CAD, 3D Rendering, and Data Science workflows where failure is not an option.",
    series: "WorkPro Series", 
    cpu: "AMD", 
    gpu: "AMD", 
    price: 85000, 
    image: "/images/Desktops/workpro.jpg", 
    layout: "landscape", // STACKED VIEW (Top Image)
    route: "/workpro" 
  },
  { 
    id: 4, 
    name: "Creator Series", 
    tagline: "IMAGINATION UNLEASHED",
    description: "Color accurate, silent, and powerful. The perfect canvas for video editors, streamers, and digital artists.",
    series: "Creator Series", 
    cpu: "Intel", 
    gpu: "NVIDIA", 
    price: 180000, 
    image: "/images/Desktops/creator.jpg", 
    layout: "square", // SPLIT VIEW (Right Image)
    route: "/creator" 
  },
  { 
    id: 5, 
    name: "Signature Series", 
    tagline: "THE PINNACLE OF ENGINEERING",
    description: "Limited edition chassis, custom loop liquid cooling, and top-binned silicon. The ultimate flex.",
    series: "Signature Series", 
    cpu: "Intel", 
    gpu: "NVIDIA", 
    price: 350000, 
    image: "/images/Desktops/signature.jpg", 
    layout: "landscape", // STACKED VIEW (Top Image)
    route: "/signature" 
  },
];

// --- REUSABLE FILTER COMPONENT ---
const FilterGroup = ({ title, options, selected, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-8 border-b border-white/10 pb-6">
      <div 
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
        <span className="text-brand-purple font-light text-xl">{isOpen ? "−" : "+"}</span>
      </div>
      
      {isOpen && (
        <div className="space-y-3">
          {options.map((opt: string) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group hover:pl-1 transition-all">
              <div className={`w-3 h-3 border border-white/30 flex items-center justify-center transition-all ${selected.includes(opt) ? "bg-brand-purple border-brand-purple" : "group-hover:border-white"}`}>
                 {selected.includes(opt) && <div className="w-1.5 h-1.5 bg-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={selected.includes(opt)}
                onChange={() => onChange(opt)}
              />
              <span className={`text-xs font-saira uppercase tracking-wider ${selected.includes(opt) ? "text-white" : "text-brand-silver group-hover:text-white"}`}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DesktopsPage() {
  // --- STATE ---
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedCPU, setSelectedCPU] = useState<string[]>([]);
  const [selectedGPU, setSelectedGPU] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);

  const toggleFilter = (item: string, list: string[], setList: Function) => {
    if (list.includes(item)) setList(list.filter((i) => i !== item));
    else setList([...list, item]);
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
      
      {/* HEADER SECTION */}
      <section className="pt-[50px] pb-12 px-[80px] 2xl:px-[100px] border-b border-white/5">
        <h1 className="font-orbitron text-5xl font-bold uppercase tracking-tighter mb-2">Desktops</h1>
        <p className="text-brand-silver font-saira tracking-wide">Cinematic Performance. Precision Engineering.</p>
      </section>

      <div className="flex flex-col lg:flex-row min-h-screen">
          
        {/* --- LEFT SIDEBAR (STICKY) --- */}
        <aside className="w-full lg:w-[300px] xl:w-[350px] border-r border-white/5 p-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-[#0A0A0A]">
            <div className="mb-10 pt-4">
                <span className="text-[10px] text-brand-purple font-bold tracking-[0.2em] uppercase block mb-2">Configuration</span>
                <h2 className="font-orbitron text-2xl text-white">FILTERS</h2>
            </div>

            <FilterGroup 
                title="Series" 
                options={["Ascend Series", "WorkPro Series", "Creator Series", "Signature Series"]} 
                selected={selectedSeries}
                onChange={(val: string) => toggleFilter(val, selectedSeries, setSelectedSeries)}
            />

            <FilterGroup 
                title="Platform" 
                options={["AMD", "Intel"]} 
                selected={selectedCPU}
                onChange={(val: string) => toggleFilter(val, selectedCPU, setSelectedCPU)}
            />

            <FilterGroup 
                title="Graphics" 
                options={["NVIDIA", "AMD"]} 
                selected={selectedGPU}
                onChange={(val: string) => toggleFilter(val, selectedGPU, setSelectedGPU)}
            />

            <FilterGroup 
                title="Budget" 
                options={["Under ₹70K", "₹70K - ₹150K", "₹150K - ₹220K", "Above ₹220K"]} 
                selected={selectedPrice}
                onChange={(val: string) => toggleFilter(val, selectedPrice, setSelectedPrice)}
            />
        </aside>

        {/* --- RIGHT CONTENT (SCROLLABLE SECTIONS) --- */}
        <div className="flex-1 bg-[#121212]">
            <div className="p-4 lg:p-0">
                <div className="py-6 px-8 flex justify-between items-center border-b border-white/5 bg-[#121212]/90 backdrop-blur sticky top-0 z-10 lg:hidden">
                    <span className="text-brand-silver text-xs font-bold uppercase tracking-widest">Results: {filteredDesktops.length}</span>
                </div>

                {filteredDesktops.length === 0 ? (
                    <div className="h-[50vh] flex flex-col items-center justify-center text-brand-silver border border-dashed border-white/10 m-8 rounded-2xl">
                        <span className="font-orbitron text-2xl mb-2">NO SIGNALS FOUND</span>
                        <p className="text-sm">Adjust your filters to locate a system.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredDesktops.map((pc, index) => (
                            <Reveal key={pc.id}>
                                {/* --- CONDITIONAL LAYOUT RENDERER --- */}
                                
                                {pc.layout === "square" ? (
                                    // --- LAYOUT A: SPLIT (Square Image) ---
                                    <div className={`group relative w-full min-h-[600px] flex flex-col md:flex-row border-b border-white/5 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                                        
                                        {/* TEXT HALF */}
                                        <div className="w-full md:w-1/2 p-12 xl:p-20 flex flex-col justify-center relative bg-gradient-to-br from-[#121212] to-[#0d0d0d]">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            
                                            <span className="text-brand-purple font-bold tracking-[0.3em] text-xs uppercase mb-4 flex items-center gap-2">
                                                <span className="w-8 h-[1px] bg-brand-purple"></span>
                                                {pc.series}
                                            </span>
                                            
                                            <h2 className="font-orbitron text-4xl xl:text-6xl font-bold text-white mb-2 leading-tight">
                                                {pc.name.split(" ")[0]}
                                            </h2>
                                            <h3 className="font-orbitron text-xl text-white/40 mb-8">{pc.tagline}</h3>
                                            
                                            <p className="text-brand-silver font-saira leading-relaxed max-w-md mb-8">
                                                {pc.description}
                                            </p>

                                            <div className="flex gap-4 mb-10">
                                                <span className="bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold uppercase flex items-center gap-2 text-white/80">
                                                    <FaMicrochip className="text-brand-purple" /> {pc.cpu}
                                                </span>
                                                <span className="bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold uppercase flex items-center gap-2 text-white/80">
                                                    <FaMemory className="text-brand-blue" /> {pc.gpu}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-8 mt-auto">
                                                <span className="font-orbitron text-2xl font-bold text-white">₹{pc.price.toLocaleString("en-IN")}</span>
                                                <Link href={pc.route} className="flex-1">
                                                    <button className="group/btn relative overflow-hidden px-8 py-4 border border-white/30 text-white font-orbitron text-sm font-bold uppercase tracking-widest w-full hover:bg-white hover:text-black transition-all">
                                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                                            Buy Now <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </span>
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* IMAGE HALF */}
                                        <div className="w-full md:w-1/2 relative min-h-[400px] md:min-h-full overflow-hidden">
                                            <div className="absolute inset-0 bg-brand-purple/20 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-700"></div>
                                            <Image 
                                                src={pc.image} 
                                                alt={pc.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
                                            />
                                        </div>
                                    </div>

                                ) : (
                                    // --- LAYOUT B: STACKED (Landscape Image) ---
                                    <div className="group relative w-full border-b border-white/5 bg-[#0A0A0A]">
                                        
                                        {/* TOP IMAGE SECTION */}
                                        <div className="w-full h-[400px] xl:h-[500px] relative overflow-hidden border-b border-white/5">
                                             <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10 opacity-80"></div>
                                             <Image 
                                                src={pc.image} 
                                                alt={pc.name}
                                                fill
                                                className="object-cover object-center group-hover:scale-105 transition-transform duration-[2s] ease-out"
                                            />
                                            {/* Floating Title on Image */}
                                            <div className="absolute bottom-8 left-8 xl:left-12 z-20">
                                                <h2 className="font-orbitron text-5xl xl:text-7xl font-bold text-white mb-2 tracking-tight drop-shadow-xl">{pc.name.split(" ")[0]}</h2>
                                                <span className="text-brand-purple font-bold tracking-[0.3em] text-sm uppercase bg-black/50 backdrop-blur px-3 py-1">
                                                    {pc.series}
                                                </span>
                                            </div>
                                        </div>

                                        {/* BOTTOM CONTENT SECTION */}
                                        <div className="p-12 xl:p-16 flex flex-col xl:flex-row gap-12 items-start xl:items-center justify-between">
                                            <div className="max-w-2xl">
                                                <h3 className="font-orbitron text-2xl text-white mb-4">{pc.tagline}</h3>
                                                <p className="text-brand-silver font-saira leading-relaxed text-lg mb-6">
                                                    {pc.description}
                                                </p>
                                                <div className="flex gap-4">
                                                    <span className="text-xs font-bold uppercase text-white/50 border border-white/10 px-3 py-1">{pc.cpu} Architecture</span>
                                                    <span className="text-xs font-bold uppercase text-white/50 border border-white/10 px-3 py-1">{pc.gpu} Graphic Engine</span>
                                                </div>
                                            </div>

                                            <div className="w-full xl:w-auto flex flex-col items-end gap-6 min-w-[300px]">
                                                <div className="text-right">
                                                    <p className="text-brand-silver text-xs uppercase tracking-widest mb-1">Starting Configuration</p>
                                                    <p className="font-orbitron text-4xl font-bold text-white">₹{pc.price.toLocaleString("en-IN")}</p>
                                                </div>
                                                <Link href={pc.route} className="w-full">
                                                    <button className="w-full bg-white text-black py-4 font-orbitron text-sm font-bold uppercase tracking-[0.2em] hover:bg-brand-purple hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(78,44,139,0.6)]">
                                                        Buy now
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Reveal>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}