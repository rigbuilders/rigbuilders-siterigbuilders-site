"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaChevronDown, FaChevronUp, FaInfoCircle, FaCheck, FaWindows, FaLinux, FaSave, FaShoppingCart, FaDesktop, FaKeyboard, FaMouse } from "react-icons/fa";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { toast } from "sonner";
import { generateSpecSheetPDF } from "@/utils/generatePdf";

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  image: string;
  inStock: boolean;
  // Specs
  socket?: string;
  memory_type?: string;
  wattage?: number;
  length_mm?: number;      // GPU Length
  max_gpu_length_mm?: number; // Cabinet Clearance
  form_factor?: string;
  isCompatible?: boolean;  // Dynamic Flag
  compatibilityMsg?: string;
}

export default function ConfiguratorPage() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // SELECTION STATE
  const [selections, setSelections] = useState({
    cpu: null as Product | null,
    motherboard: null as Product | null,
    gpu: null as Product | null,
    ram: null as Product | null,
    storage: null as Product | null,
    cooler: null as Product | null,
    psu: null as Product | null,
    cabinet: null as Product | null,
    monitor: null as Product | null,
    keyboard: null as Product | null,
    mouse: null as Product | null,
    combo: null as Product | null,
    osPrimary: null as Product | null,
    osSecondary: null as Product | null,
  });

  // 1. FETCH DATA & USER
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase.from('products').select('*');
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
            ...p.specs
        })));
      }
      setLoading(false);
    };
    init();
  }, []);

  // 2. FILTERING LOGIC (The Brain)
  const data = useMemo(() => {
    const getCat = (cat: string) => inventory.filter(p => p.category === cat);

    let gpus = getCat('gpu');
    let mobos = getCat('motherboard');
    let rams = getCat('ram');
    let cabinets = getCat('cabinet'); // Defined here so we can filter it below

    // --- COMPATIBILITY CHECKS ---

    // A. CPU <-> Motherboard (Socket)
    if (selections.cpu?.socket) {
        mobos = mobos.map(m => ({
            ...m,
            isCompatible: m.socket === selections.cpu?.socket,
            compatibilityMsg: m.socket !== selections.cpu?.socket ? `Requires ${selections.cpu?.socket} socket` : undefined
        }));
    }

    // B. Motherboard <-> RAM (DDR4/DDR5)
    if (selections.motherboard?.memory_type) {
        rams = rams.map(r => ({
            ...r,
            isCompatible: r.memory_type === selections.motherboard?.memory_type,
            compatibilityMsg: r.memory_type !== selections.motherboard?.memory_type ? `Requires ${selections.motherboard?.memory_type}` : undefined
        }));
    }

    // C. Cabinet <-> GPU (If Cabinet selected first -> Filter GPUs)
    if (selections.cabinet?.max_gpu_length_mm) {
        const maxLen = selections.cabinet.max_gpu_length_mm;
        gpus = gpus.map(g => ({
            ...g,
            isCompatible: (g.length_mm || 0) <= maxLen,
            compatibilityMsg: (g.length_mm || 0) > maxLen ? `Too long (${g.length_mm}mm > ${maxLen}mm)` : undefined
        }));
    }

    // D. GPU <-> Cabinet (If GPU selected first -> Filter Cabinets)
    if (selections.gpu?.length_mm) {
        const gpuLen = selections.gpu.length_mm;
        cabinets = cabinets.map(c => ({
            ...c,
            // Default 400mm if data missing to allow compatibility
            isCompatible: (c.max_gpu_length_mm || 400) >= gpuLen,
            compatibilityMsg: (c.max_gpu_length_mm || 400) < gpuLen ? `Too small (Max ${c.max_gpu_length_mm}mm)` : undefined
        }));
    }

    return {
        cpus: getCat('cpu'),
        gpus: gpus,
        mobos: mobos,
        rams: rams,
        storages: getCat('storage'),
        psus: getCat('psu'),
        coolers: getCat('cooler'),
        cabinets: cabinets, // Returns the filtered list
        monitors: inventory.filter(p => p.category === 'monitor' || p.category === 'display'),
        keyboards: inventory.filter(p => p.category === 'keyboard'),
        mice: inventory.filter(p => p.category === 'mouse'),
        combos: inventory.filter(p => p.category === 'combo'),
        osList: inventory.filter(p => p.category === 'os'),
    };
  }, [inventory, selections.cpu, selections.motherboard, selections.cabinet, selections.gpu]);

  // 3. CALCULATIONS
  const totalPrice = Object.values(selections).reduce((acc, item) => acc + (item?.price || 0), 0);
  
  const totalTDP = useMemo(() => {
    let total = 0;
    if (selections.cpu) total += selections.cpu.wattage || 65;
    if (selections.gpu) total += selections.gpu.wattage || 0;
    if (selections.motherboard) total += 50;
    if (selections.ram) total += 15;
    if (selections.storage) total += 10;
    if (selections.cooler) total += 10;
    return total > 0 ? total + 100 : 0; 
  }, [selections]);

  const psuWattage = selections.psu?.wattage || 0;
  const isPowerSufficient = selections.psu ? psuWattage >= totalTDP : true;

  // 4. HANDLERS
  const handleSelect = (category: keyof typeof selections, item: Product) => {
    setSelections(prev => {
        const newSel = { ...prev, [category]: prev[category]?.id === item.id ? null : item };
        
        // Auto-Reset logic
        if (category === 'cpu' && prev.motherboard && prev.motherboard.socket !== item.socket) {
            newSel.motherboard = null; 
            newSel.ram = null; 
        }
        if (category === 'motherboard' && prev.ram && prev.ram.memory_type !== item.memory_type) {
            newSel.ram = null;
        }
        if (category === 'combo' && item) {
            newSel.keyboard = null;
            newSel.mouse = null;
        }
        if ((category === 'mouse' || category === 'keyboard') && item) {
            newSel.combo = null;
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
    router.push("/cart");
  };

  const handleSaveConfiguration = async () => {
    if (!user) {
        toast.error("Access Denied", { description: "You must be logged in to save configurations." });
        router.push("/signin");
        return;
    }
    
    setSaving(true);
    
    // Create the payload
    const configData = {
        user_id: user.id,
        name: `${selections.cpu?.name || 'Custom'} + ${selections.gpu?.name || 'Build'}`,
        specs: selections,
        total_price: totalPrice
    };

    const { error } = await supabase.from('saved_configurations').insert(configData);

    if (error) {
        console.error("Supabase Error:", error);
        toast.error("Failed to Save", { 
            description: error.message || "Could not save to your dashboard." 
        });
    } else {
        toast.success("Configuration Saved", { 
            description: "You can view this build in your User Dashboard." 
        });
    }
    
    setSaving(false);
  };

  return (
    // FIX: Changed overflow-hidden to overflow-x-hidden for Sticky support
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-x-hidden">
      
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />

      <Navbar />
      
      <div className="flex-grow pt-12 pb-12 px-4 md:px-8 2xl:px-[100px] relative z-10">
        <Reveal>
            <h1 className="font-orbitron text-4xl font-bold mb-8 text-white uppercase tracking-wide text-center lg:text-left">
                System <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">Configurator</span>
            </h1>
        </Reveal>

        <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            
            {/* --- LEFT: SUMMARY (Sticky) --- */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">
                <Reveal delay={0.2}>
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
                        
                        <div className="relative w-full h-[250px] mb-6 flex items-center justify-center bg-black/20 rounded-lg overflow-hidden border border-white/5">
                            {selections.cabinet?.image ? (
                                <Image src={selections.cabinet.image} alt="Cabinet" fill className="object-contain p-4" />
                            ) : (
                                <div className="text-white/20 font-orbitron text-xl">Select Cabinet</div>
                            )}
                        </div>

                        <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] uppercase tracking-wider text-brand-silver">TDP Estimate</span>
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
                                <p className="text-[10px] text-red-400 mt-2 flex items-center gap-2 animate-pulse">
                                    <FaInfoCircle /> Upgrade PSU Required
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 mb-6 text-xs max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            <SummaryRow label="Processor" item={selections.cpu} />
                            <SummaryRow label="Motherboard" item={selections.motherboard} />
                            <SummaryRow label="Memory" item={selections.ram} />
                            <SummaryRow label="Graphics Card" item={selections.gpu} />
                            <SummaryRow label="Storage" item={selections.storage} />
                            <SummaryRow label="Cooling" item={selections.cooler} />
                            <SummaryRow label="Power Supply" item={selections.psu} />
                            <SummaryRow label="Cabinet" item={selections.cabinet} />
                            <div className="border-t border-white/5 my-2"></div>
                            <SummaryRow label="Monitor" item={selections.monitor} />
                            {selections.combo ? (
                                <SummaryRow label="Combo" item={selections.combo} />
                            ) : (
                                <>
                                  <SummaryRow label="Keyboard" item={selections.keyboard} />
                                  <SummaryRow label="Mouse" item={selections.mouse} />
                                </>
                            )}
                            <SummaryRow label="OS" item={selections.osPrimary} />
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-brand-silver text-sm">Total Estimate</span>
                                <span className="text-3xl font-bold font-orbitron text-white">₹{totalPrice.toLocaleString("en-IN")}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {/* SAVE CONFIG: Redirects guests to signin, Saves for users */}
                                <button 
                                    onClick={() => {
                                        if (!user) {
                                            router.push("/signin");
                                        } else {
                                            handleSaveConfiguration();
                                        }
                                    }}
                                    disabled={saving} 
                                    className="col-span-1 py-4 bg-white/5 border border-white/10 text-white font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1"
                                >
                                    <FaSave className="text-sm" />
                                    {user ? (saving ? "Saving..." : "Save Config") : "Login to Save"}
                                </button>

                                {/* ADD TO CART */}
                                <button onClick={handleAddToCart} disabled={!selections.cpu || !selections.motherboard} className="col-span-1 py-4 bg-brand-purple text-white font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-brand-purple/80 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:grayscale">
                                    <FaShoppingCart className="text-sm" />
                                    Add to Cart
                                </button>

                                {/* DOWNLOAD PDF */}
                                <button 
                                   onClick={() => {
                                      // Check if at least one component is selected
                                      const hasSelection = Object.values(selections).some(item => item !== null);

                                      if (!hasSelection) {
                                          toast.error("Selection Empty", { 
                                              description: "Please select at least one component to generate the PDF." 
                                          });
                                          return;
                                      }

                                      // Construct config object for PDF generator
                                      const pdfData = {
                                           id: "custom",
                                           name: "Custom Configuration",
                                           total_price: totalPrice,
                                           specs: selections 
                                      };
                                      generateSpecSheetPDF(pdfData);
                                   }} 
                                   className="col-span-2 py-3 bg-[#121212] border border-white/20 text-brand-silver hover:text-white hover:border-white font-bold font-orbitron uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                     <span>↓</span> Download Specification PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>

            {/* --- RIGHT: CONFIGURATOR --- */}
            <div className="lg:col-span-8 space-y-4">
                <StaggerGrid className="flex flex-col gap-4">
                    
                    <StaggerItem><CollapsibleSection title="1. Processor" selected={selections.cpu?.name}><Grid items={data.cpus} selectedId={selections.cpu?.id} onSelect={(i: any) => handleSelect('cpu', i)} /></CollapsibleSection></StaggerItem>
                    
                    <StaggerItem><CollapsibleSection title="2. Motherboard" selected={selections.motherboard?.name}><Grid items={data.mobos} selectedId={selections.motherboard?.id} onSelect={(i: any) => handleSelect('motherboard', i)} warning={!selections.cpu ? "Select CPU first" : undefined} /></CollapsibleSection></StaggerItem>
                    
                    <StaggerItem><CollapsibleSection title="3. Memory (RAM)" selected={selections.ram?.name}><Grid items={data.rams} selectedId={selections.ram?.id} onSelect={(i: any) => handleSelect('ram', i)} warning={!selections.motherboard ? "Select Motherboard first" : undefined} /></CollapsibleSection></StaggerItem>
                    
                    {/* GPU: Removed generic warning string */}
                    <StaggerItem><CollapsibleSection title="4. Graphics Card" selected={selections.gpu?.name}><Grid items={data.gpus} selectedId={selections.gpu?.id} onSelect={(i: any) => handleSelect('gpu', i)} /></CollapsibleSection></StaggerItem>
                    
                    <StaggerItem><CollapsibleSection title="5. Storage" selected={selections.storage?.name}><Grid items={data.storages} selectedId={selections.storage?.id} onSelect={(i: any) => handleSelect('storage', i)} /></CollapsibleSection></StaggerItem>
                    
                    <StaggerItem><CollapsibleSection title="6. Cooling" selected={selections.cooler?.name}><Grid items={data.coolers} selectedId={selections.cooler?.id} onSelect={(i: any) => handleSelect('cooler', i)} /></CollapsibleSection></StaggerItem>
                    
                    <StaggerItem><CollapsibleSection title="7. Power Supply" selected={selections.psu?.name}><Grid items={data.psus} selectedId={selections.psu?.id} onSelect={(i: any) => handleSelect('psu', i)} /></CollapsibleSection></StaggerItem>
                    
                    {/* CABINET: Added helpful warning if GPU is already selected */}
                    <StaggerItem><CollapsibleSection title="8. Cabinet" selected={selections.cabinet?.name}><Grid items={data.cabinets} selectedId={selections.cabinet?.id} onSelect={(i: any) => handleSelect('cabinet', i)} warning={selections.gpu ? `Showing cabinets compatible with ${selections.gpu.name}` : undefined} /></CollapsibleSection></StaggerItem>

                    <div className="py-4 flex items-center gap-4 opacity-50">
                        <div className="h-[1px] bg-white/20 flex-grow"></div>
                        <span className="font-orbitron text-sm uppercase tracking-widest text-brand-silver">Accessories & Software</span>
                        <div className="h-[1px] bg-white/20 flex-grow"></div>
                    </div>

                    <StaggerItem><CollapsibleSection title="9. Monitor" icon={<FaDesktop />} selected={selections.monitor?.name}><Grid items={data.monitors} selectedId={selections.monitor?.id} onSelect={(i: any) => handleSelect('monitor', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="10. Keyboard & Mouse Combo" icon={<FaKeyboard />} selected={selections.combo?.name}><Grid items={data.combos} selectedId={selections.combo?.id} onSelect={(i: any) => handleSelect('combo', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="11. Keyboard (Individual)" icon={<FaKeyboard />} selected={selections.keyboard?.name}><Grid items={data.keyboards} selectedId={selections.keyboard?.id} onSelect={(i: any) => handleSelect('keyboard', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="12. Mouse (Individual)" icon={<FaMouse />} selected={selections.mouse?.name}><Grid items={data.mice} selectedId={selections.mouse?.id} onSelect={(i: any) => handleSelect('mouse', i)} /></CollapsibleSection></StaggerItem>

                    <StaggerItem>
                        <CollapsibleSection title="13. Operating System" selected={selections.osPrimary?.name}>
                            <OperatingSystemSelector 
                                allOs={data.osList}
                                primaryOs={selections.osPrimary}
                                secondaryOs={selections.osSecondary}
                                setPrimaryOs={(i: any) => setSelections(prev => ({ ...prev, osPrimary: i }))}
                                setSecondaryOs={(i: any) => setSelections(prev => ({ ...prev, osSecondary: i }))}
                            />
                        </CollapsibleSection>
                    </StaggerItem>

                </StaggerGrid>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// --- SUB-COMPONENTS ---

const SummaryRow = ({ label, item }: { label: string, item: any }) => (
    <div className="flex justify-between items-start">
        <span className="text-brand-silver w-1/3">{label}</span>
        <span className={`w-2/3 text-right truncate ${item ? "text-white" : "text-white/20 italic"}`}>
            {item ? item.name : "-"}
        </span>
    </div>
);

const CollapsibleSection = ({ title, selected, children, icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-6 py-5 flex justify-between items-center transition-all ${isOpen ? "bg-white/5" : "bg-transparent hover:bg-white/5"}`}
            >
                <div className="flex items-center gap-4 text-left">
                    {icon && <span className="text-brand-purple text-lg">{icon}</span>}
                    <div>
                        <h3 className="font-orbitron font-bold text-white uppercase text-sm md:text-base tracking-wider">{title}</h3>
                        {selected && !isOpen && <p className="text-xs text-brand-purple mt-1 truncate max-w-[200px] font-saira">{selected}</p>}
                    </div>
                </div>
                <div className="text-brand-silver">
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </div>
            </button>
            {isOpen && <div className="p-6 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">{children}</div>}
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
                    <button key={t} onClick={() => setTab(t as any)} 
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 
                        ${tab === t ? "border-brand-purple text-white" : "border-transparent text-brand-silver hover:text-white"}`}
                    >
                        {t === "dual" ? "Dual Boot" : t}
                    </button>
                ))}
            </div>
            {tab === "windows" && <Grid items={winOs} selectedId={primaryOs?.id} onSelect={handleSingleSelect} />}
            {tab === "linux" && <Grid items={linuxOs} selectedId={primaryOs?.id} onSelect={handleSingleSelect} />}
            {tab === "dual" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <h4 className="text-brand-purple font-bold text-xs uppercase flex items-center gap-2"><FaWindows /> Primary Slot</h4>
                        <div className="h-60 overflow-y-auto custom-scrollbar border border-white/10 rounded p-2">
                            {winOs.map((os: any) => (<MiniOsCard key={os.id} item={os} isSelected={primaryOs?.id === os.id} onClick={() => setPrimaryOs(primaryOs?.id === os.id ? null : os)} />))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-orange-400 font-bold text-xs uppercase flex items-center gap-2"><FaLinux /> Secondary Slot</h4>
                        <div className="h-60 overflow-y-auto custom-scrollbar border border-white/10 rounded p-2">
                            {linuxOs.map((os: any) => (<MiniOsCard key={os.id} item={os} isSelected={secondaryOs?.id === os.id} onClick={() => setSecondaryOs(secondaryOs?.id === os.id ? null : os)} />))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MiniOsCard = ({ item, isSelected, onClick }: any) => (
    <div onClick={onClick} className={`cursor-pointer p-3 rounded flex justify-between items-center transition-all border mb-2 ${isSelected ? "bg-brand-purple text-white border-brand-purple" : "bg-white/5 text-brand-silver border-transparent hover:bg-white/10"}`}>
        <span className="text-xs font-saira">{item.name}</span>
        <span className="text-xs font-bold opacity-70">₹{item.price.toLocaleString("en-IN")}</span>
    </div>
);

const Grid = ({ items, selectedId, onSelect, warning }: any) => {
    if (items.length === 0) return <div className="text-center text-brand-silver text-sm py-8 bg-white/5 rounded border border-dashed border-white/10 italic">No compatible items found.</div>;
    
    return (
        <>
            {warning && <div className="mb-4 text-xs text-brand-purple flex items-center gap-2"><FaInfoCircle /> {warning}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: any) => {
                    const isCompatible = item.isCompatible !== false; 
                    const isDisabled = (item.category !== 'os' && !item.inStock) || !isCompatible;
                    
                    return (
                        <div key={item.id} 
                            onClick={() => { if (!isDisabled) onSelect(item); }} 
                            className={`relative p-4 rounded-lg border transition-all flex flex-col justify-between min-h-[100px] group 
                            ${selectedId === item.id 
                                ? "bg-brand-purple/10 border-brand-purple shadow-[0_0_15px_rgba(78,44,139,0.3)]" 
                                : isDisabled 
                                    ? "bg-black/20 border-white/5 opacity-50 cursor-not-allowed grayscale" 
                                    : "bg-[#121212] border-white/10 hover:border-white/30 hover:bg-[#151515] cursor-pointer"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">{item.brand || "Part"}</span>
                                {selectedId === item.id && <div className="text-brand-purple"><FaCheck /></div>}
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-sm text-white mb-1 leading-tight">{item.name}</h4>
                                <div className="text-[10px] text-brand-silver mb-3 space-y-1">
                                    {!isCompatible && (
                                        <div className="text-red-400 font-bold flex items-center gap-1 mt-2">
                                            <FaInfoCircle size={10} /> {item.compatibilityMsg || "Incompatible"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <span className="font-bold text-white">{item.price === 0 ? "FREE" : `₹${item.price.toLocaleString("en-IN")}`}</span>
                                {item.category !== 'os' && !item.inStock && (<span className="text-[9px] font-bold text-red-500 uppercase px-2 py-1 bg-red-500/10 rounded">Out of Stock</span>)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};