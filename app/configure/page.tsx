"use client";

import Navbar from "@/components/Navbar";
import { useConfigurator } from "../hooks/useConfigurator";
import { Suspense, useState } from "react";
import { OS } from "../data/types";

// --- MAIN CONTENT ---
function ConfiguratorContent() {
  const { selections, setters, data, stats } = useConfigurator();

  return (
    <div className="pt-24 pb-10 max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-80px)]">
      
      {/* LEFT COLUMN: Summary */}
      <div className="lg:col-span-1 bg-brand-charcoal rounded-xl border border-white/5 flex flex-col p-6 h-auto order-1 lg:sticky lg:top-24">
         <h2 className="font-orbitron font-bold text-xl text-white mb-6">Build Summary</h2>
         
         {/* Power Meter */}
         <div className="mb-8 p-4 bg-brand-black rounded-lg border border-white/10">
            <div className="flex justify-between items-end mb-2">
                <span className="text-brand-silver text-xs uppercase tracking-wider">Estimated Power</span>
                <div className="text-right">
                    <span className={`text-xl font-bold ${stats.powerStats.totalTDP > (selections.psu?.wattage || 0) ? "text-red-500" : "text-brand-blue"}`}>
                        {stats.powerStats.totalTDP}W
                    </span>
                    <span className="text-brand-silver/50 text-xs ml-1">/ {selections.psu?.wattage || 0}W PSU</span>
                </div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${stats.powerStats.totalTDP > (selections.psu?.wattage || 0) ? "bg-red-500" : "bg-brand-blue"}`}
                    style={{ width: `${Math.min((stats.powerStats.totalTDP / (selections.psu?.wattage || 1)) * 100, 100)}%` }}
                ></div>
            </div>
         </div>

         {/* List */}
         <div className="space-y-4 text-sm font-saira grow">
            <SummaryItem label="CPU" value={selections.cpu?.name || "Select Processor"} warn={!selections.cpu} />
            <SummaryItem label="Cooler" value={selections.cooler?.name || "Select Cooler"} />
            <SummaryItem label="Motherboard" value={selections.mobo?.name || "Select Board"} warn={selections.cpu && !selections.mobo} />
            <SummaryItem label="RAM" value={selections.ram?.name || "Select RAM"} />
            <SummaryItem label="GPU" value={selections.gpu?.name || "Select GPU"} />
            <SummaryItem label="Storage" value={selections.storage?.name || "Select Storage"} />
            <SummaryItem label="Case" value={selections.cabinet?.name || "Select Case"} />
            <SummaryItem label="PSU" value={selections.psu?.name || "Select PSU"} warn={stats.powerStats.totalTDP > 0 && !selections.psu} />
            
            <div className="border-t border-white/5 pt-2 mt-2">
                <SummaryItem label="OS 1" value={selections.primaryOS?.name || "None"} />
                {selections.secondaryOS && <SummaryItem label="OS 2" value={selections.secondaryOS.name} />}
            </div>
         </div>

         <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-brand-silver uppercase">Total Estimate</p>
            <p className="text-3xl font-orbitron font-bold text-white">₹{stats.totalPrice.toLocaleString("en-IN")}</p>
         </div>
      </div>

      {/* RIGHT COLUMN: Selectors */}
      <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-20 order-2">
        
        <Section title="Processor" description="Determines your Platform">
          <NoneCard isSelected={selections.cpu === null} onClick={() => setters.setCPU(null)} />
          {data.cpus.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selections.cpu?.id === item.id} onClick={() => setters.setCPU(item)} tag={item.socket} />
          ))}
        </Section>

        <Section title="Cooling" description="AIO or Air Cooler">
          <NoneCard isSelected={selections.cooler === null} onClick={() => setters.setCooler(null)} />
          {data.coolers.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selections.cooler?.id === item.id} onClick={() => setters.setCooler(item)} warn={!item.isSufficient} tag={!item.isSufficient ? "Too Weak" : "Compatible"} />
          ))}
        </Section>

        <Section title="Motherboard" description={`Compatible with ${selections.cpu?.socket || "selected CPU"}`}>
          {!selections.cpu ? (
            <p className="text-brand-silver/50 text-center py-4 italic">Please select a Processor first to see compatible motherboards.</p>
          ) : (
            <>
              <NoneCard isSelected={selections.mobo === null} onClick={() => setters.setMobo(null)} />
              {data.motherboards.length === 0 ? <p className="text-red-400 text-sm">No compatible boards found.</p> :
                data.motherboards.map((item) => (
                    <OptionCard key={item.id} item={item} isSelected={selections.mobo?.id === item.id} onClick={() => setters.setMobo(item)} tag={item.formFactor} />
                ))
              }
            </>
          )}
        </Section>

        <Section title="Memory" description="RAM">
          <NoneCard isSelected={selections.ram === null} onClick={() => setters.setRAM(null)} />
          {data.rams.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selections.ram?.id === item.id} onClick={() => setters.setRAM(item)} />
          ))}
        </Section>

        <Section title="Graphics" description="GPU">
          <NoneCard isSelected={selections.gpu === null} onClick={() => setters.setGPU(null)} />
          {data.gpus.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selections.gpu?.id === item.id} onClick={() => setters.setGPU(item)} />
          ))}
        </Section>

        <Section title="Storage" description="SSD">
          <NoneCard isSelected={selections.storage === null} onClick={() => setters.setStorage(null)} />
          {data.storages.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selections.storage?.id === item.id} onClick={() => setters.setStorage(item)} />
          ))}
        </Section>

        <Section title="Cabinet" description="PC Case">
          <NoneCard isSelected={selections.cabinet === null} onClick={() => setters.setCabinet(null)} />
          {data.cabinets.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selections.cabinet?.id === item.id} onClick={() => setters.setCabinet(item)} warn={!item.isCompatible || !item.isGpuFit} tag={!item.isCompatible ? "Mobo Won't Fit" : (!item.isGpuFit ? "GPU Too Long" : "Fits")} />
          ))}
        </Section>

        <Section title="Power Supply" description="PSU">
          <NoneCard isSelected={selections.psu === null} onClick={() => setters.setPSU(null)} />
          {data.psus.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selections.psu?.id === item.id} onClick={() => setters.setPSU(item)} tag={item.wattage + "W"} recommended={item.isRecommended} warn={!item.isCompatible} />
          ))}
        </Section>

        <OperatingSystemSection 
            allOs={data.osList} 
            primaryOs={selections.primaryOS} 
            setPrimaryOs={setters.setPrimaryOS}
            secondaryOs={selections.secondaryOS}
            setSecondaryOs={setters.setSecondaryOS}
        />

      </div>
    </div>
  );
}

// --- COMPONENTS ---

function NoneCard({ isSelected, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className={`cursor-pointer p-4 rounded border transition-all flex justify-between items-center group
                ${isSelected ? "bg-white/10 border-white/30" : "bg-transparent border-dashed border-white/10 hover:border-white/30"}
            `}
        >
            <span className={`text-sm font-saira ${isSelected ? "text-white" : "text-brand-silver/50"}`}>
                Not Required / Remove
            </span>
            <span className="text-xs text-brand-silver/30">₹0</span>
        </div>
    )
}

function OperatingSystemSection({ allOs, primaryOs, setPrimaryOs, secondaryOs, setSecondaryOs }: any) {
  const [activeTab, setActiveTab] = useState<string | null>(null); 
  const [activeWinSeries, setActiveWinSeries] = useState<"Home" | "Pro" | null>(null);

  const toggleTab = (tab: string) => setActiveTab(activeTab === tab ? null : tab);
  
  const handleSingleSelect = (os: OS | null) => {
    setPrimaryOs(os);
    setSecondaryOs(null);
  };

  const winHome = allOs.filter((os: OS) => os.family === "Windows" && os.series === "Home");
  const winPro = allOs.filter((os: OS) => os.family === "Windows" && os.series === "Pro");
  const linuxList = allOs.filter((os: OS) => os.family === "Linux");

  return (
    <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div>
                <h3 className="text-white font-bold uppercase tracking-wider">Operating System</h3>
                <p className="text-sm text-brand-silver/70">Select your Primary OS or Dual Boot Config</p>
            </div>
            {/* Master Clear Button for OS */}
            {(primaryOs || secondaryOs) && (
                <button onClick={() => handleSingleSelect(null)} className="text-xs text-red-400 hover:text-red-300 underline">
                    Clear Selection
                </button>
            )}
        </div>

        {/* 1. WINDOWS 11 */}
        <div>
            <button onClick={() => toggleTab("windows")} className="w-full text-left p-4 hover:bg-white/5 flex justify-between items-center text-white font-orbitron">
                <span>1. Windows 11</span>
                <span>{activeTab === "windows" ? "▼" : "▶"}</span>
            </button>
            {activeTab === "windows" && (
                <div className="p-4 bg-brand-black/50 border-y border-white/5 pl-8 space-y-4">
                     <div>
                        <button onClick={() => setActiveWinSeries(activeWinSeries === "Home" ? null : "Home")} className="text-brand-silver hover:text-white text-sm font-bold flex items-center gap-2 mb-2">
                           {activeWinSeries === "Home" ? "▼" : "▶"} Windows 11 Home
                        </button>
                        {activeWinSeries === "Home" && (
                            <div className="grid gap-2 pl-4">
                                {winHome.map((os: OS) => (
                                    <MiniOsCard key={os.id} item={os} isSelected={primaryOs?.id === os.id && !secondaryOs} onClick={() => handleSingleSelect(os)} />
                                ))}
                            </div>
                        )}
                     </div>
                     <div>
                        <button onClick={() => setActiveWinSeries(activeWinSeries === "Pro" ? null : "Pro")} className="text-brand-silver hover:text-white text-sm font-bold flex items-center gap-2 mb-2">
                           {activeWinSeries === "Pro" ? "▼" : "▶"} Windows 11 Pro
                        </button>
                        {activeWinSeries === "Pro" && (
                            <div className="grid gap-2 pl-4">
                                {winPro.map((os: OS) => (
                                    <MiniOsCard key={os.id} item={os} isSelected={primaryOs?.id === os.id && !secondaryOs} onClick={() => handleSingleSelect(os)} />
                                ))}
                            </div>
                        )}
                     </div>
                </div>
            )}
        </div>

        {/* 2. LINUX */}
        <div className="border-t border-white/5">
            <button onClick={() => toggleTab("linux")} className="w-full text-left p-4 hover:bg-white/5 flex justify-between items-center text-white font-orbitron">
                <span>2. Linux (Top 10)</span>
                <span>{activeTab === "linux" ? "▼" : "▶"}</span>
            </button>
            {activeTab === "linux" && (
                <div className="p-4 bg-brand-black/50 border-t border-white/5 pl-8 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {linuxList.map((os: OS) => (
                         <MiniOsCard key={os.id} item={os} isSelected={primaryOs?.id === os.id && !secondaryOs} onClick={() => handleSingleSelect(os)} />
                    ))}
                </div>
            )}
        </div>

        {/* 3. DUAL OS */}
        <div className="border-t border-white/5">
            <button onClick={() => toggleTab("dual")} className="w-full text-left p-4 hover:bg-white/5 flex justify-between items-center text-white font-orbitron">
                <span>3. Dual OS Config</span>
                <span>{activeTab === "dual" ? "▼" : "▶"}</span>
            </button>
            {activeTab === "dual" && (
                <div className="p-4 bg-brand-black/50 border-t border-white/5 space-y-6">
                    <div>
                        <h4 className="text-brand-purple text-sm font-bold mb-3 uppercase tracking-wider">Slot 1 (Primary)</h4>
                        <div className="h-40 overflow-y-auto custom-scrollbar border border-white/10 rounded p-2">
                            {allOs.map((os: OS) => (
                                <MiniOsCard key={`s1-${os.id}`} item={os} isSelected={primaryOs?.id === os.id} onClick={() => setPrimaryOs(os)} compact />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-brand-blue text-sm font-bold mb-3 uppercase tracking-wider">Slot 2 (Secondary)</h4>
                        <div className="h-40 overflow-y-auto custom-scrollbar border border-white/10 rounded p-2">
                             {allOs.map((os: OS) => (
                                <MiniOsCard key={`s2-${os.id}`} item={os} isSelected={secondaryOs?.id === os.id} onClick={() => setSecondaryOs(os)} compact />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}

function MiniOsCard({ item, isSelected, onClick, compact }: any) {
    return (
        <div 
            onClick={onClick}
            className={`cursor-pointer p-3 rounded flex justify-between items-center transition-colors border ${
                isSelected ? "bg-brand-purple text-white border-brand-purple" : "bg-white/5 text-brand-silver border-transparent hover:bg-white/10"
            } ${compact ? "mb-1" : ""}`}
        >
            <span className="text-sm font-saira">{item.name}</span>
            <span className="text-xs font-bold opacity-70">
                {item.price === 0 ? "FREE" : `₹${item.price.toLocaleString("en-IN")}`}
            </span>
        </div>
    )
}

function SummaryItem({ label, value, warn }: any) {
    return (
        <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-brand-silver">{label}</span>
            <span className={`text-right font-medium ${warn ? "text-brand-burgundy" : "text-white"}`}>{value}</span>
        </div>
    )
}

function Section({ title, description, children }: any) {
  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/5">
      <div className="mb-4">
        <h3 className="text-white font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-sm text-brand-silver/70">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

function OptionCard({ item, isSelected, onClick, tag, recommended, warn }: any) {
  let borderColor = "border-white/5 hover:border-white/20";
  let bgColor = "bg-brand-black";

  if (isSelected) {
    borderColor = "border-brand-purple";
    bgColor = "bg-brand-purple/20";
  } else if (recommended) {
    borderColor = "border-brand-blue/50";
  } else if (warn) {
    borderColor = "border-brand-burgundy/50";
    bgColor = "bg-brand-burgundy/10 opacity-60";
  }

  return (
    <div onClick={onClick} className={`cursor-pointer p-4 rounded border transition-all flex justify-between items-center ${bgColor} ${borderColor}`}>
      <div>
        <p className={`font-saira text-sm font-medium ${isSelected ? "text-white" : "text-brand-silver"}`}>{item.name}</p>
        <div className="flex gap-2 mt-1">
            {tag && <span className="text-[10px] uppercase text-brand-silver/70 bg-white/5 px-2 py-0.5 rounded inline-block">{tag}</span>}
            {recommended && <span className="text-[10px] uppercase text-brand-black bg-brand-blue px-2 py-0.5 rounded inline-block font-bold">Recommended</span>}
            {warn && <span className="text-[10px] uppercase text-white bg-brand-burgundy px-2 py-0.5 rounded inline-block font-bold">Warning</span>}
        </div>
      </div>
      <span className={`text-xs font-bold ${isSelected ? "text-brand-purple" : "text-brand-silver/50"}`}>
        ₹{item.price.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

export default function ConfiguratorPage() {
  return (
    <main className="min-h-screen bg-brand-black text-white font-saira">
      <Navbar />
      <Suspense fallback={<div className="pt-32 text-center text-white">Loading Engine...</div>}>
        <ConfiguratorContent />
      </Suspense>
    </main>
  );
}