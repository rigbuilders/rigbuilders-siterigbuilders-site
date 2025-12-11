"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { FaChevronDown, FaChevronUp, FaInfoCircle, FaCheck, FaWindows, FaLinux } from "react-icons/fa";

export default function ConfiguratorPage() {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);

  // Selection State
  const [selections, setSelections] = useState({
    cpu: null as any,
    motherboard: null as any,
    gpu: null as any,
    ram: null as any,
    storage: null as any,
    cooler: null as any,
    psu: null as any,
    cabinet: null as any,
    osPrimary: null as any,
    osSecondary: null as any,
  });

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (data) {
        setInventory(data.map(p => ({
            ...p,
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category === "memory" ? "ram" : p.category, 
            brand: p.brand,
            image: p.image_url, 
            inStock: p.in_stock,
            // CRITICAL: Pull specs to top level for filtering
            socket: p.specs?.socket,
            memory_type: p.specs?.memory_type,
            wattage: p.specs?.wattage,
            form_factor: p.specs?.form_factor,
            ...p.specs 
        })));
      }
      setLoading(false);
    };
    fetchInventory();
  }, []);

  // --- SMART FILTERING LOGIC ---
  const data = useMemo(() => {
    const all = {
        cpus: inventory.filter(p => p.category === 'cpu'),
        gpus: inventory.filter(p => p.category === 'gpu'),
        mobos: inventory.filter(p => p.category === 'motherboard'),
        rams: inventory.filter(p => p.category === 'ram'),
        storages: inventory.filter(p => p.category === 'storage'),
        psus: inventory.filter(p => p.category === 'psu'),
        coolers: inventory.filter(p => p.category === 'cooler'),
        cabinets: inventory.filter(p => p.category === 'cabinet'),
        osList: inventory.filter(p => p.category === 'os'),
    };

    // FILTER: Motherboards must match CPU Socket
    if (selections.cpu?.socket) {
        all.mobos = all.mobos.filter(m => m.socket === selections.cpu.socket);
    }

    // FILTER: RAM must match Motherboard Type (DDR4/DDR5)
    if (selections.motherboard?.memory_type) {
        all.rams = all.rams.filter(r => r.memory_type === selections.motherboard.memory_type);
    }

    return all;
  }, [inventory, selections.cpu, selections.motherboard]);

  // Calculations
  const totalPrice = Object.values(selections).reduce((acc, item) => acc + (item?.price || 0), 0);
  
  // Power Calc: Sum of wattages + 100W buffer
  const totalTDP = (selections.cpu?.wattage || 0) + 
                   (selections.gpu?.wattage || 0) + 
                   100; 
  
  const psuWattage = selections.psu?.wattage || 0;
  const isPowerSufficient = selections.psu ? psuWattage >= totalTDP : true;

  const handleSelect = (category: keyof typeof selections, item: any) => {
    setSelections(prev => {
        // If changing CPU, clear Mobo if socket mismatches
        const newSel = { ...prev, [category]: prev[category]?.id === item.id ? null : item };
        
        if (category === 'cpu' && prev.motherboard && prev.motherboard.socket !== item.socket) {
            newSel.motherboard = null; // Reset incompatible board
            newSel.ram = null; // Reset RAM cascade
        }
        return newSel;
    });
  };

  const handleAddToCart = () => {
    const customBuild = {
        id: `custom-${Date.now()}`,
        name: "Custom Configured PC",
        price: totalPrice,
        image: selections.cabinet?.image || "/icons/navbar/products/Desktops.png",
        category: "Custom Build",
        quantity: 1,
        specs: selections 
    };
    addToCart(customBuild);
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron">Loading Engine...</div>;

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      
      <div className="flex-grow pt-28 pb-12 px-4 md:px-8 2xl:px-[100px]">
        <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT SIDEBAR */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6">
                
                {/* Cabinet Preview */}
                {selections.cabinet && (
                    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                        <div className="relative w-full h-[250px]">
                            {selections.cabinet.image ? (
                                <Image src={selections.cabinet.image} alt={selections.cabinet.name} fill className="object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 font-orbitron text-2xl">{selections.cabinet.name}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Build Summary */}
                <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
                    <h2 className="font-orbitron font-bold text-xl mb-6 text-white uppercase">Build Summary</h2>
                    
                    {/* Power Calculator */}
                    <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] uppercase tracking-wider text-brand-silver">Power Consumption</span>
                            <span className={`font-bold ${!isPowerSufficient ? "text-red-500" : "text-brand-purple"}`}>
                                {totalTDP}W <span className="text-white/40">/ {psuWattage}W</span>
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${!isPowerSufficient ? "bg-red-500" : "bg-brand-purple"}`}
                                style={{ width: `${Math.min((totalTDP / (psuWattage || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        {!isPowerSufficient && selections.psu && (
                            <p className="text-[10px] text-red-400 mt-2 flex items-center gap-2"><FaInfoCircle /> PSU wattage too low!</p>
                        )}
                    </div>

                    {/* Summary List */}
                    <div className="space-y-3 mb-6 text-sm">
                        <SummaryRow label="Processor" item={selections.cpu} />
                        <SummaryRow label="Motherboard" item={selections.motherboard} />
                        <SummaryRow label="Memory" item={selections.ram} />
                        <SummaryRow label="Graphics Card" item={selections.gpu} />
                        <SummaryRow label="Storage" item={selections.storage} />
                        <SummaryRow label="Cooling" item={selections.cooler} />
                        <SummaryRow label="Power Supply" item={selections.psu} />
                        <SummaryRow label="Cabinet" item={selections.cabinet} />
                        <SummaryRow label="Primary OS" item={selections.osPrimary} />
                        {selections.osSecondary && <SummaryRow label="Secondary OS" item={selections.osSecondary} />}
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-brand-silver">Total</span>
                            <span className="text-3xl font-bold font-orbitron text-white">₹{totalPrice.toLocaleString("en-IN")}</span>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            disabled={!selections.cpu || !selections.motherboard}
                            className="w-full py-4 bg-white text-black font-bold font-orbitron uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-4">
                <CollapsibleSection title="1. Processor" selected={selections.cpu?.name}>
                    <Grid items={data.cpus} selectedId={selections.cpu?.id} onSelect={(i: any) => handleSelect('cpu', i)} />
                </CollapsibleSection>

                <CollapsibleSection title="2. Motherboard" selected={selections.motherboard?.name}>
                    <Grid items={data.mobos} selectedId={selections.motherboard?.id} onSelect={(i: any) => handleSelect('motherboard', i)} />
                    {!selections.cpu && <p className="text-xs text-brand-silver px-6 pb-4">Select a Processor first to see compatible boards.</p>}
                </CollapsibleSection>

                <CollapsibleSection title="3. Memory" selected={selections.ram?.name}>
                    <Grid items={data.rams} selectedId={selections.ram?.id} onSelect={(i: any) => handleSelect('ram', i)} />
                    {!selections.motherboard && <p className="text-xs text-brand-silver px-6 pb-4">Select a Motherboard first to see compatible RAM.</p>}
                </CollapsibleSection>

                <CollapsibleSection title="4. Graphics Card" selected={selections.gpu?.name}>
                    <Grid items={data.gpus} selectedId={selections.gpu?.id} onSelect={(i: any) => handleSelect('gpu', i)} />
                </CollapsibleSection>

                <CollapsibleSection title="5. Storage" selected={selections.storage?.name}>
                    <Grid items={data.storages} selectedId={selections.storage?.id} onSelect={(i: any) => handleSelect('storage', i)} />
                </CollapsibleSection>

                <CollapsibleSection title="6. Cooling System" selected={selections.cooler?.name}>
                    <Grid items={data.coolers} selectedId={selections.cooler?.id} onSelect={(i: any) => handleSelect('cooler', i)} />
                </CollapsibleSection>

                <CollapsibleSection title="7. Power Supply" selected={selections.psu?.name}>
                    <Grid items={data.psus} selectedId={selections.psu?.id} onSelect={(i: any) => handleSelect('psu', i)} />
                </CollapsibleSection>

                <CollapsibleSection title="8. PC Cabinet" selected={selections.cabinet?.name}>
                    <Grid items={data.cabinets} selectedId={selections.cabinet?.id} onSelect={(i: any) => handleSelect('cabinet', i)} />
                </CollapsibleSection>

                {/* ADVANCED OS SECTION */}
                <CollapsibleSection title="9. Operating System" selected={selections.osPrimary?.name}>
                    <OperatingSystemSelector 
                        allOs={data.osList}
                        primaryOs={selections.osPrimary}
                        secondaryOs={selections.osSecondary}
                        setPrimaryOs={(i: any) => setSelections(prev => ({ ...prev, osPrimary: i }))}
                        setSecondaryOs={(i: any) => setSelections(prev => ({ ...prev, osSecondary: i }))}
                    />
                </CollapsibleSection>
            </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}

// --- REUSED SUB-COMPONENTS ---
const SummaryRow = ({ label, item }: any) => (
    <div className="flex justify-between items-start text-xs">
        <span className="text-brand-silver w-1/3">{label}</span>
        <span className={`w-2/3 text-right truncate ${item ? "text-white" : "text-white/20 italic"}`}>
            {item ? item.name : "Not Selected"}
        </span>
    </div>
);

const CollapsibleSection = ({ title, selected, children }: any) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full px-6 py-5 flex justify-between items-center bg-[#151515] hover:bg-[#1A1A1A] transition-colors border-b border-white/5">
                <div className="text-left"><h3 className="font-orbitron font-bold text-white uppercase text-sm md:text-base">{title}</h3>{selected && <p className="text-xs text-brand-purple mt-1 truncate max-w-[200px] md:max-w-md">{selected}</p>}</div>
                <div className="text-brand-silver">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {isOpen && <div className="p-6">{children}</div>}
        </div>
    );
};

const OperatingSystemSelector = ({ allOs, primaryOs, secondaryOs, setPrimaryOs, setSecondaryOs }: any) => {
    const [tab, setTab] = useState<"windows" | "linux" | "dual">("windows");
    const winOs = allOs.filter((o: any) => o.name.toLowerCase().includes("windows"));
    const linuxOs = allOs.filter((o: any) => !o.name.toLowerCase().includes("windows"));

    const handleSingleSelect = (os: any) => {
        const newItem = primaryOs?.id === os.id ? null : os;
        setPrimaryOs(newItem);
        setSecondaryOs(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-white/10">
                {["windows", "linux", "dual"].map((t) => (
                    <button key={t} onClick={() => setTab(t as any)} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${tab === t ? "border-brand-purple text-white" : "border-transparent text-brand-silver hover:text-white"}`}>{t === "dual" ? "Dual Boot" : t}</button>
                ))}
            </div>
            {tab === "windows" && <Grid items={winOs} selectedId={primaryOs?.id} onSelect={handleSingleSelect} />}
            {tab === "linux" && <Grid items={linuxOs} selectedId={primaryOs?.id} onSelect={handleSingleSelect} />}
            {tab === "dual" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2"><h4 className="text-brand-purple font-bold text-xs uppercase flex items-center gap-2"><FaWindows /> Primary Slot</h4><div className="h-60 overflow-y-auto custom-scrollbar border border-white/10 rounded p-2">{winOs.map((os: any) => (<MiniOsCard key={os.id} item={os} isSelected={primaryOs?.id === os.id} onClick={() => setPrimaryOs(primaryOs?.id === os.id ? null : os)} />))}</div></div>
                    <div className="space-y-2"><h4 className="text-orange-400 font-bold text-xs uppercase flex items-center gap-2"><FaLinux /> Secondary Slot</h4><div className="h-60 overflow-y-auto custom-scrollbar border border-white/10 rounded p-2">{linuxOs.map((os: any) => (<MiniOsCard key={os.id} item={os} isSelected={secondaryOs?.id === os.id} onClick={() => setSecondaryOs(secondaryOs?.id === os.id ? null : os)} />))}</div></div>
                </div>
            )}
        </div>
    );
};

const MiniOsCard = ({ item, isSelected, onClick }: any) => (
    <div onClick={onClick} className={`cursor-pointer p-3 rounded flex justify-between items-center transition-all border mb-2 ${isSelected ? "bg-brand-purple text-white border-brand-purple" : "bg-white/5 text-brand-silver border-transparent hover:bg-white/10"}`}>
        <span className="text-xs font-saira">{item.name}</span><span className="text-xs font-bold opacity-70">₹{item.price.toLocaleString("en-IN")}</span>
    </div>
);

const Grid = ({ items, selectedId, onSelect }: any) => {
    if (items.length === 0) return <div className="text-center text-brand-silver text-sm py-4">No items available in this category.</div>;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => (
                <div key={item.id} onClick={() => { if (item.category === 'os' || item.inStock) { onSelect(item); } }} className={`relative p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between min-h-[140px] group ${selectedId === item.id ? "bg-brand-purple/10 border-brand-purple" : (item.category !== 'os' && !item.inStock) ? "bg-black/20 border-white/5 opacity-50 cursor-not-allowed" : "bg-[#121212] border-white/10 hover:border-white/30 hover:bg-[#151515]"}`}>
                    <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">{item.brand || "Software"}</span>{selectedId === item.id && <div className="text-brand-purple"><FaCheck /></div>}</div>
                    <div><h4 className="font-bold text-sm text-white mb-1 leading-tight">{item.name}</h4><div className="text-[10px] text-brand-silver mb-3">
                        {item.socket ? `Socket: ${item.socket}` : item.wattage ? `Power: ${item.wattage}W` : item.category === 'os' ? "License Key" : ""}
                    </div></div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5"><span className="font-bold text-white">{item.price === 0 ? "FREE" : `₹${item.price.toLocaleString("en-IN")}`}</span>{item.category !== 'os' && !item.inStock && (<span className="text-[9px] font-bold text-red-500 uppercase px-2 py-1 bg-red-500/10 rounded">Out of Stock</span>)}</div>
                </div>
            ))}
        </div>
    );
};