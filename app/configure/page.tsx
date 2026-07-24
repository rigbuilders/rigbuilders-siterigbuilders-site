"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/MotionWrappers";
import { toast } from "sonner";
import { 
    FaMicrochip, FaServer, FaMemory, FaGamepad, FaHdd, 
    FaFan, FaPlug, FaBox, FaWindows, FaDesktop, FaKeyboard, FaMouse 
} from "react-icons/fa";

// Import modules
import { Product, SelectionState } from "./types";
import { filterInventory, calculateTotals } from "./logic";
import { SummaryPanel, MobileBar, CategoryCard, PremiumSelectionModal } from "./components/ConfigUI";

export default function ConfiguratorPage() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const [mounted, setMounted] = useState(false);

  // New Modal State
  const [activeModal, setActiveModal] = useState<keyof SelectionState | null>(null);

  const [selections, setSelections] = useState<SelectionState>({
    cpu: null, motherboard: null, gpu: null, ram: null, storage: null, 
    cooler: null, psu: null, cabinet: null, monitor: null, keyboard: null, 
    mouse: null, combo: null, osPrimary: null, osSecondary: null,
  });

  // 1. INIT
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setShowMobileBar(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data } = await supabase.from('products').select('*');
      if (data) {
        setInventory(data.map(p => ({
            ...p,
            id: p.id, name: p.name, price: p.price,configurator_name: p.configurator_name,
            category: p.category === "memory" ? "ram" : p.category, 
            brand: p.brand, image: p.image_url, inStock: p.in_stock,
            ...p.specs // Spec fields from DB override top-level
        })));
      }
      setLoading(false);
    };
    init();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. LOGIC
  const data = useMemo(() => filterInventory(inventory, selections), [inventory, selections]);
  const totals = useMemo(() => calculateTotals(selections), [selections]);

  // 3. HANDLERS
  const handleSelect = (category: keyof SelectionState, item: Product) => {
    setSelections(prev => {
        const newSel = { ...prev, [category]: prev[category]?.id === item.id ? null : item };
        // Auto-Reset logic
        if (category === 'cpu' && prev.motherboard && prev.motherboard.socket !== item.socket) { newSel.motherboard = null; newSel.ram = null; }
        if (category === 'motherboard' && prev.ram && prev.ram.memory_type !== item.memory_type) { newSel.ram = null; }
        if (category === 'combo' && item) { newSel.keyboard = null; newSel.mouse = null; }
        if ((category === 'mouse' || category === 'keyboard') && item) { newSel.combo = null; }
        return newSel;
    });
  };

  const handleSave = async () => {
    if (!user) { toast.error("Login Required"); router.push("/signin"); return; }
    setSaving(true);
    const { error } = await supabase.from('saved_configurations').insert({
        user_id: user.id,
        name: `${selections.cpu?.name || 'Custom'} + ${selections.gpu?.name || 'Build'}`,
        specs: selections,
        total_price: totals.totalPrice
    });
    if (error) toast.error(error.message);
    else toast.success("Configuration Saved");
    setSaving(false);
  };

  const handleAddToCart = () => {
    addToCart({
        id: `custom-${Date.now()}`,
        name: "Custom Configured PC",
        price: totals.totalPrice,
        image: selections.cabinet?.image || "/icons/navbar/products/Desktops.png",
        category: "Custom Build",
        quantity: 1,
        specs: selections 
    });
    router.push("/cart");
  };

  // --- Modal Helpers ---
  const getModalTitle = (cat: keyof SelectionState) => {
    const titles: Record<string, string> = {
        cpu: "Processor", motherboard: "Motherboard", ram: "Memory", gpu: "Graphics Card",
        storage: "Storage", cooler: "Cooling", psu: "Power Supply", cabinet: "Cabinet",
        osPrimary: "Operating System", monitor: "Monitor", combo: "Keyboard & Mouse Combo",
        keyboard: "Keyboard", mouse: "Mouse"
    };
    return titles[cat as string] || cat;
  };

  const getModalItems = (cat: keyof SelectionState) => {
    if (cat === 'osPrimary') return data.osList || [];
    const map: Record<string, any[]> = {
        cpu: data.cpus, motherboard: data.mobos, ram: data.rams, gpu: data.gpus,
        storage: data.storages, cooler: data.coolers, psu: data.psus, cabinet: data.cabinets,
        monitor: data.monitors, combo: data.combos, keyboard: data.keyboards, mouse: data.mice
    };
    return map[cat as string] || [];
  };

  const getModalWarning = (cat: keyof SelectionState) => {
    if (cat === 'motherboard' && !selections.cpu) return "Select CPU first to ensure socket compatibility.";
    if (cat === 'ram' && !selections.motherboard) return "Select Motherboard first to ensure DDR type compatibility.";
    if (cat === 'cabinet' && selections.gpu) return `Filtering cases to fit ${selections.gpu.configurator_name || selections.gpu.name}.`;
    return undefined;
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />
      <Navbar />
      
      <div className="flex-grow pt-12 pb-12 px-4 md:px-8 2xl:px-[100px] relative z-10">
        <Reveal><h1 className="font-orbitron text-4xl font-bold mb-8 text-white uppercase tracking-wide text-center lg:text-left">System <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">Configurator</span></h1></Reveal>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative">
            {/* LEFT: SUMMARY */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">
                <Reveal delay={0.2}>
                    <SummaryPanel selections={selections} totals={totals} user={user} onSave={handleSave} onAddToCart={handleAddToCart} saving={saving} />
                </Reveal>
            </div>

            {/* RIGHT: BUILDER GRID */}
            <div className="lg:col-span-8 space-y-12 pb-24">
                
                {/* SECTION 1: PC COMPONENTS */}
                <div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3 mb-6">
                        <h2 className="font-orbitron text-2xl font-bold text-white uppercase tracking-widest">PC Components</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <CategoryCard title="Processor" icon={FaMicrochip} selectedItem={selections.cpu} onClick={() => setActiveModal('cpu')} />
                        <CategoryCard title="Motherboard" icon={FaServer} selectedItem={selections.motherboard} onClick={() => setActiveModal('motherboard')} warning={!selections.cpu ? "Requires CPU" : undefined} />
                        <CategoryCard title="Memory (RAM)" icon={FaMemory} selectedItem={selections.ram} onClick={() => setActiveModal('ram')} warning={!selections.motherboard ? "Requires Mobo" : undefined} />
                        <CategoryCard title="Graphics Card" icon={FaGamepad} selectedItem={selections.gpu} onClick={() => setActiveModal('gpu')} />
                        <CategoryCard title="Storage" icon={FaHdd} selectedItem={selections.storage} onClick={() => setActiveModal('storage')} />
                        <CategoryCard title="Cooling" icon={FaFan} selectedItem={selections.cooler} onClick={() => setActiveModal('cooler')} />
                        <CategoryCard title="Power Supply" icon={FaPlug} selectedItem={selections.psu} onClick={() => setActiveModal('psu')} />
                        <CategoryCard title="Cabinet" icon={FaBox} selectedItem={selections.cabinet} onClick={() => setActiveModal('cabinet')} />
                    </div>
                </div>

                {/* SECTION 2: OPERATING SYSTEM */}
                <div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3 mb-6">
                        <h2 className="font-orbitron text-2xl font-bold text-white uppercase tracking-widest">Operating System</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <CategoryCard title="Primary OS" icon={FaWindows} selectedItem={selections.osPrimary} onClick={() => setActiveModal('osPrimary')} />
                    </div>
                </div>

                {/* SECTION 3: ACCESSORIES */}
                <div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3 mb-6">
                        <h2 className="font-orbitron text-2xl font-bold text-white uppercase tracking-widest">Accessories</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <CategoryCard title="Monitor" icon={FaDesktop} selectedItem={selections.monitor} onClick={() => setActiveModal('monitor')} />
                        <CategoryCard title="Keyboard & Mouse" icon={FaKeyboard} selectedItem={selections.combo} onClick={() => setActiveModal('combo')} />
                        <CategoryCard title="Standalone Keyboard" icon={FaKeyboard} selectedItem={selections.keyboard} onClick={() => setActiveModal('keyboard')} />
                        <CategoryCard title="Standalone Mouse" icon={FaMouse} selectedItem={selections.mouse} onClick={() => setActiveModal('mouse')} />
                    </div>
                </div>

            </div>
        </div>
      </div>

      {/* --- PREMIUM MODAL --- */}
      {mounted && (
          <PremiumSelectionModal
              isOpen={activeModal !== null}
              onClose={() => setActiveModal(null)}
              title={activeModal ? getModalTitle(activeModal) : ""}
              items={activeModal ? getModalItems(activeModal) : []}
              selectedId={activeModal ? selections[activeModal]?.id : null}
              onSelect={(item: Product) => activeModal && handleSelect(activeModal, item)}
              warning={activeModal ? getModalWarning(activeModal) : undefined}
          />
      )}

      {mounted && <MobileBar show={showMobileBar} totalPrice={totals.totalPrice} totals={totals} selections={selections} onAddToCart={handleAddToCart} />}
      <Footer />
    </div>
  );
}