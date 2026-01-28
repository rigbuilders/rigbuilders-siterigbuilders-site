"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaDesktop, FaKeyboard, FaMouse } from "react-icons/fa";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { toast } from "sonner";

// Import new modular parts
import { Product, SelectionState } from "./types";
import { filterInventory, calculateTotals } from "./logic";
import { SelectionGrid, SummaryPanel, MobileBar, CollapsibleSection } from "./components/ConfigUI";

export default function ConfiguratorPage() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const [mounted, setMounted] = useState(false);

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
            id: p.id, name: p.name, price: p.price,
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

  // 2. LOGIC (Using extracted function)
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

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />
      <Navbar />
      
      <div className="flex-grow pt-12 pb-12 px-4 md:px-8 2xl:px-[100px] relative z-10">
        <Reveal><h1 className="font-orbitron text-4xl font-bold mb-8 text-white uppercase tracking-wide text-center lg:text-left">System <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">Configurator</span></h1></Reveal>

        <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            {/* LEFT: SUMMARY */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">
                <Reveal delay={0.2}>
                    <SummaryPanel selections={selections} totals={totals} user={user} onSave={handleSave} onAddToCart={handleAddToCart} saving={saving} />
                </Reveal>
            </div>

            {/* RIGHT: BUILDER */}
            <div className="lg:col-span-8 space-y-4">
                <StaggerGrid className="flex flex-col gap-4">
                    <StaggerItem><CollapsibleSection title="1. Processor" selected={selections.cpu?.name}><SelectionGrid items={data.cpus} selectedId={selections.cpu?.id} onSelect={(i) => handleSelect('cpu', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="2. Motherboard" selected={selections.motherboard?.name}><SelectionGrid items={data.mobos} selectedId={selections.motherboard?.id} onSelect={(i) => handleSelect('motherboard', i)} warning={!selections.cpu ? "Select CPU first" : undefined} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="3. Memory (RAM)" selected={selections.ram?.name}><SelectionGrid items={data.rams} selectedId={selections.ram?.id} onSelect={(i) => handleSelect('ram', i)} warning={!selections.motherboard ? "Select Motherboard first" : undefined} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="4. Graphics Card" selected={selections.gpu?.name}><SelectionGrid items={data.gpus} selectedId={selections.gpu?.id} onSelect={(i) => handleSelect('gpu', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="5. Storage" selected={selections.storage?.name}><SelectionGrid items={data.storages} selectedId={selections.storage?.id} onSelect={(i) => handleSelect('storage', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="6. Cooling" selected={selections.cooler?.name}><SelectionGrid items={data.coolers} selectedId={selections.cooler?.id} onSelect={(i) => handleSelect('cooler', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="7. Power Supply" selected={selections.psu?.name}><SelectionGrid items={data.psus} selectedId={selections.psu?.id} onSelect={(i) => handleSelect('psu', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="8. Cabinet" selected={selections.cabinet?.name}><SelectionGrid items={data.cabinets} selectedId={selections.cabinet?.id} onSelect={(i) => handleSelect('cabinet', i)} warning={selections.gpu ? `Showing cabinets compatible with ${selections.gpu.name}` : undefined} /></CollapsibleSection></StaggerItem>

                    <div className="py-4 flex items-center gap-4 opacity-50"><div className="h-[1px] bg-white/20 flex-grow"></div><span className="font-orbitron text-sm uppercase tracking-widest text-brand-silver">Accessories</span><div className="h-[1px] bg-white/20 flex-grow"></div></div>

                    <StaggerItem><CollapsibleSection title="9. Monitor" icon={<FaDesktop />} selected={selections.monitor?.name}><SelectionGrid items={data.monitors} selectedId={selections.monitor?.id} onSelect={(i) => handleSelect('monitor', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="10. Keyboard & Mouse Combo" icon={<FaKeyboard />} selected={selections.combo?.name}><SelectionGrid items={data.combos} selectedId={selections.combo?.id} onSelect={(i) => handleSelect('combo', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="11. Keyboard (Individual)" icon={<FaKeyboard />} selected={selections.keyboard?.name}><SelectionGrid items={data.keyboards} selectedId={selections.keyboard?.id} onSelect={(i) => handleSelect('keyboard', i)} /></CollapsibleSection></StaggerItem>
                    <StaggerItem><CollapsibleSection title="12. Mouse (Individual)" icon={<FaMouse />} selected={selections.mouse?.name}><SelectionGrid items={data.mice} selectedId={selections.mouse?.id} onSelect={(i) => handleSelect('mouse', i)} /></CollapsibleSection></StaggerItem>
                </StaggerGrid>
            </div>
        </div>
      </div>
      {mounted && <MobileBar show={showMobileBar} totalPrice={totals.totalPrice} totals={totals} selections={selections} onAddToCart={handleAddToCart} />}
      <Footer />
    </div>
  );
}