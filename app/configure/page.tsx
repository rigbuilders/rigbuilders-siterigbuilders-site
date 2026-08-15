"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/MotionWrappers";
import { toast } from "sonner";

// Import modules
import { Product, SelectionState } from "./types";
import { filterInventory, calculateTotals } from "./logic";
import { MobileBar, PremiumSelectionModal } from "./components/ConfigUI";
import { ConfiguratorSummary } from "./components/ConfiguratorSummary";
import { ConfiguratorGrid } from "./components/ConfiguratorGrid";

export default function ConfiguratorPage() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const [mounted, setMounted] = useState(false);
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
            id: p.id, name: p.name, price: p.price, configurator_name: p.configurator_name,
            category: p.category === "memory" ? "ram" : p.category, 
            brand: p.brand, image: p.image_url, inStock: p.in_stock,
            ...p.specs
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
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <Navbar />

      <div className="flex-grow pt-12 pb-12 px-4 md:px-8 2xl:px-[100px] relative z-10 overflow-x-hidden">
        <Reveal>
            <h1 className="font-orbitron text-4xl font-bold mb-12 text-white uppercase tracking-wide">
                System <span className="text-[#FFE600]">Configurator</span>
            </h1>
        </Reveal>

        <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative">
            
            {/* LEFT: LIVE RECEIPT (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start z-20 h-fit">
                <Reveal delay={0.2}>
                    <ConfiguratorSummary 
                        selections={selections} 
                        totals={totals} 
                        user={user} 
                        onSave={handleSave} 
                        onAddToCart={handleAddToCart} 
                        saving={saving} 
                    />
                </Reveal>
            </div>

            {/* RIGHT: COMPONENT GRID */}
            <div className="lg:col-span-8 pb-24 z-10 relative">
                <Reveal delay={0.3}>
                    <ConfiguratorGrid 
                        selections={selections} 
                        setActiveModal={setActiveModal} 
                    />
                </Reveal>
            </div>
            
        </div>
      </div>

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