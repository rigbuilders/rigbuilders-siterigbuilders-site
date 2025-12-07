"use client";

import Navbar from "@/components/Navbar";
import CheckoutButton from "@/components/CheckoutButton"; // <--- IMPORTED HERE
import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link"; 

// --- 1. MOCK DATABASE ---
const COMPONENT_DATA = {
  motherboards: [
    { id: "m1", name: "MSI B450M Pro-VDH", price: 6500, socket: "AM4", memory: "DDR4" },
    { id: "m2", name: "ASUS ROG Strix B550-F", price: 16500, socket: "AM4", memory: "DDR4" },
    { id: "m3", name: "Gigabyte B650 Gaming X", price: 18000, socket: "AM5", memory: "DDR5" },
    { id: "m4", name: "MSI MAG Z790 Tomahawk", price: 28000, socket: "LGA1700", memory: "DDR5" },
  ],
  cpus: [
    { id: "c1", name: "AMD Ryzen 5 5600X", price: 14500, socket: "AM4" },
    { id: "c2", name: "AMD Ryzen 7 5800X3D", price: 28000, socket: "AM4" },
    { id: "c3", name: "AMD Ryzen 5 7600X", price: 21000, socket: "AM5" },
    { id: "c4", name: "AMD Ryzen 7 7800X3D", price: 36000, socket: "AM5" },
    { id: "c5", name: "Intel Core i5-13600K", price: 29000, socket: "LGA1700" },
    { id: "c6", name: "Intel Core i7-14700K", price: 38000, socket: "LGA1700" },
  ],
  gpus: [
    { id: "g1", name: "NVIDIA RTX 3060 12GB", price: 26000 },
    { id: "g2", name: "NVIDIA RTX 4060 Ti", price: 38000 },
    { id: "g3", name: "NVIDIA RTX 4070 Super", price: 62000 },
    { id: "g4", name: "NVIDIA RTX 4090", price: 185000 },
  ],
  ram: [
    { id: "r1", name: "16GB (8x2) Corsair Vengeance DDR4 3200MHz", price: 4200, type: "DDR4" },
    { id: "r2", name: "32GB (16x2) G.Skill Ripjaws DDR4 3600MHz", price: 7500, type: "DDR4" },
    { id: "r3", name: "32GB (16x2) XPG Lancer DDR5 6000MHz", price: 10500, type: "DDR5" },
    { id: "r4", name: "64GB (32x2) G.Skill Trident Z5 DDR5 6400MHz", price: 22000, type: "DDR5" },
  ],
  storage: [
    { id: "s1", name: "500GB WD Blue SN580 NVMe", price: 3800 },
    { id: "s2", name: "1TB Samsung 980 Pro NVMe", price: 8500 },
    { id: "s3", name: "2TB WD Black SN850X", price: 15500 },
  ],
  psu: [
    { id: "p1", name: "Deepcool PM650D (650W Gold)", price: 4800 },
    { id: "p2", name: "Corsair RM750e (750W Gold)", price: 9500 },
    { id: "p3", name: "MSI MPG A1000G (1000W Gold)", price: 16000 },
  ],
  cabinet: [
    { id: "cab1", name: "Ant Esports ICE-100", price: 3500 },
    { id: "cab2", name: "Lian Li Lancool 216", price: 8500 },
    { id: "cab3", name: "NZXT H9 Flow", price: 16000 },
  ],
  aio: [
    { id: "a1", name: "Stock Air Cooler", price: 0 },
    { id: "a2", name: "Deepcool AG400 Air Cooler", price: 2000 },
    { id: "a3", name: "Deepcool LS720 360mm AIO", price: 11000 },
    { id: "a4", name: "NZXT Kraken Elite 360", price: 24000 },
  ],
  os: [
    { id: "o1", name: "Windows 10 Pro (Trial)", price: 0 },
    { id: "o2", name: "Windows 11 Pro (Retail Key)", price: 1200 },
  ],
};

// --- 2. CONFIGURATOR CONTENT ---

function ConfiguratorContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); 

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Initial State
  const [selection, setSelection] = useState({
    motherboard: COMPONENT_DATA.motherboards[2], 
    cpu: COMPONENT_DATA.cpus[2],                 
    gpu: COMPONENT_DATA.gpus[2],
    ram: COMPONENT_DATA.ram[2],                  
    storage: COMPONENT_DATA.storage[1],
    psu: COMPONENT_DATA.psu[1],
    cabinet: COMPONENT_DATA.cabinet[1],
    aio: COMPONENT_DATA.aio[1],
    os: COMPONENT_DATA.os[0],
  });

  // Filter Logic
  const availableCPUs = useMemo(() => {
    return COMPONENT_DATA.cpus.filter(cpu => cpu.socket === selection.motherboard.socket);
  }, [selection.motherboard]);

  const availableRAM = useMemo(() => {
    return COMPONENT_DATA.ram.filter(ram => ram.type === selection.motherboard.memory);
  }, [selection.motherboard]);

  // Handler
  const handleSelect = (category: string, item: any) => {
    setSelection((prev) => {
      const newState = { ...prev, [category]: item };
      if (category === "motherboard") {
         const firstValidCPU = COMPONENT_DATA.cpus.find(c => c.socket === item.socket);
         if (firstValidCPU) newState.cpu = firstValidCPU;
         const firstValidRAM = COMPONENT_DATA.ram.find(r => r.type === item.memory);
         if (firstValidRAM) newState.ram = firstValidRAM;
      }
      return newState;
    });
  };

  const totalPrice = Object.values(selection).reduce((acc, item) => acc + item.price, 0);

  // Handle Form Submit (Manual Order Request)
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSuccess(true);
  };

  return (
    <div className="pt-24 pb-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-80px)]">
      
      {/* LEFT COLUMN: Preview & Summary */}
      <div className="lg:col-span-1 bg-[#1A1A1A] rounded-xl border border-white/5 flex flex-col p-6 h-full overflow-hidden">
         <div className="grow flex items-center justify-center relative mb-6">
            <div className={`w-48 h-64 rounded-lg border-2 border-dashed border-[#4E2C8B] flex items-center justify-center text-center p-4`}>
              <div className="space-y-2">
                <p className="font-orbitron font-bold text-white">{selection.cabinet.name}</p>
                <p className="text-xs text-[#A0A0A0]">+ {selection.gpu.name}</p>
                <p className="text-xs text-[#A0A0A0]">+ {selection.aio.name}</p>
              </div>
            </div>
         </div>
         
         <div className="mt-6 bg-[#121212] p-4 rounded-lg border border-white/10">
           <p className="text-xs text-[#A0A0A0] uppercase tracking-wide">Total Estimate</p>
           <p className="text-3xl font-orbitron font-bold text-white mt-1 mb-4">₹{totalPrice.toLocaleString("en-IN")}</p>
           
           {/* --- PAYMENT BUTTON ADDED HERE --- */}
           <CheckoutButton amount={totalPrice} />
           
           <p className="text-[10px] text-center text-[#A0A0A0] mt-3">
             Secure payment via Razorpay
           </p>
         </div>
      </div>

      {/* RIGHT COLUMN: Selectors */}
      <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-20">
        <h1 className="font-orbitron text-3xl font-bold text-white mb-6">Configure Your Rig</h1>
        
        <Section title="Motherboard" description="Platform" selectedId={selection.motherboard.id}>
          {COMPONENT_DATA.motherboards.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.motherboard.id === item.id} onClick={() => handleSelect("motherboard", item)} tag={`${item.socket} / ${item.memory}`} />
          ))}
        </Section>
        
        <Section title="Processor (CPU)" description={`Compatible with ${selection.motherboard.socket}`} selectedId={selection.cpu.id}>
          {availableCPUs.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.cpu.id === item.id} onClick={() => handleSelect("cpu", item)} />
          ))}
        </Section>

        <Section title="Graphics Card (GPU)" description="Performance" selectedId={selection.gpu.id}>
          {COMPONENT_DATA.gpus.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.gpu.id === item.id} onClick={() => handleSelect("gpu", item)} />
          ))}
        </Section>

        <Section title="Memory (RAM)" description={`Compatible with ${selection.motherboard.memory}`} selectedId={selection.ram.id}>
          {availableRAM.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.ram.id === item.id} onClick={() => handleSelect("ram", item)} />
          ))}
        </Section>
        
        <Section title="Storage" description="NVMe SSD" selectedId={selection.storage.id}>
          {COMPONENT_DATA.storage.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.storage.id === item.id} onClick={() => handleSelect("storage", item)} />
          ))}
        </Section>

        <Section title="Power Supply" description="PSU" selectedId={selection.psu.id}>
          {COMPONENT_DATA.psu.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.psu.id === item.id} onClick={() => handleSelect("psu", item)} />
          ))}
        </Section>

        <Section title="Cabinet" description="Case" selectedId={selection.cabinet.id}>
          {COMPONENT_DATA.cabinet.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.cabinet.id === item.id} onClick={() => handleSelect("cabinet", item)} />
          ))}
        </Section>

        <Section title="Cooling" description="AIO / Air" selectedId={selection.aio.id}>
          {COMPONENT_DATA.aio.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.aio.id === item.id} onClick={() => handleSelect("aio", item)} />
          ))}
        </Section>
        
        <Section title="OS" description="Windows" selectedId={selection.os.id}>
          {COMPONENT_DATA.os.map((item) => (
             <OptionCard key={item.id} item={item} isSelected={selection.os.id === item.id} onClick={() => handleSelect("os", item)} />
          ))}
        </Section>
      </div>

    </div>
  );
}

// --- HELPER COMPONENTS ---
function Section({ title, description, children }: any) {
  return (
    <div className="bg-[#1A1A1A]/50 rounded-lg p-6 border border-white/5">
      <div className="mb-4">
        <h3 className="text-white font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-sm text-[#A0A0A0]">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

function OptionCard({ item, isSelected, onClick, tag }: any) {
  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer p-4 rounded border transition-all flex justify-between items-center group
        ${isSelected ? "bg-[#4E2C8B]/20 border-[#4E2C8B]" : "bg-[#121212] border-white/5 hover:border-white/20"}
      `}
    >
      <div>
        <p className={`font-saira text-sm font-medium ${isSelected ? "text-white" : "text-[#D0D0D0]"}`}>
          {item.name}
        </p>
        {tag && <span className="text-[10px] uppercase text-[#A0A0A0] bg-white/5 px-2 py-0.5 rounded mt-1 inline-block">{tag}</span>}
      </div>
      <span className={`text-xs font-bold ${isSelected ? "text-[#4E2C8B]" : "text-[#A0A0A0]"}`}>
        {item.price === 0 ? "FREE" : `+ ₹${item.price.toLocaleString("en-IN")}`}
      </span>
    </div>
  );
}

export default function ConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      <Suspense fallback={<div className="p-20 text-center text-white">Loading Configurator...</div>}>
        <ConfiguratorContent />
      </Suspense>
    </main>
  );
}