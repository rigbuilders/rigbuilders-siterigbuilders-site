"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FaArrowLeft, FaShoppingCart, FaDownload, FaMicrochip, FaMemory, FaHdd, FaFan, FaDesktop, FaKeyboard } from "react-icons/fa";
import { useCart } from "@/app/context/CartContext";
import { generateSpecSheetPDF } from "@/utils/generatePdf";

export default function BuildViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const handleBuyRig = () => {
    if (!config) return;

    // Create a "Cart Item" that represents this entire PC
    const customBuildItem = {
        id: config.id, // Unique ID of the saved config
        name: config.name || "Custom PC Commission", 
        price: Number(config.total_price),
        image: config.specs?.cabinet?.image || "/images/placeholder_pc.png", // Use cabinet as main image
        category: "custom-build",
        specs: config.specs, // Pass the components list so Checkout knows what to build
        quantity: 1
    };

    addToCart(customBuildItem);
    router.push("/checkout");
  };

  useEffect(() => {
    const fetchConfig = async () => {
      if (!params.id) return;
      const { data, error } = await supabase
        .from('saved_configurations')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error(error);
        router.push("/dashboard"); 
      } else {
        setConfig(data);
      }
      setLoading(false);
    };
    fetchConfig();
  }, [params.id, router]);

  if (loading) return <div className="min-h-screen bg-[#090909] flex items-center justify-center text-white font-orbitron animate-pulse">Loading System Data...</div>;
  if (!config) return null;

  const { specs } = config;

  // Helper to render a cinematic component card
  const ComponentCard = ({ label, item, icon: Icon }: any) => {
    if (!item) return null;
    return (
      <div className="group relative bg-[#121212] border border-white/5 overflow-hidden rounded-xl p-6 hover:border-brand-purple/50 transition-all duration-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity text-brand-purple">
            <Icon size={24} />
        </div>
        <div className="relative z-10 flex gap-4 items-center">
            {/* Image Thumbnail */}
            <div className="w-16 h-16 bg-black/50 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {item.image ? (
                   <Image src={item.image} alt={item.name} width={64} height={64} className="object-contain" />
                ) : (
                   <Icon className="text-white/20" />
                )}
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] mb-1">{label}</p>
                <h4 className="text-white font-bold font-saira leading-tight group-hover:text-brand-purple transition-colors">{item.name}</h4>
                <p className="text-sm font-bold text-white/50 mt-1">₹{item.price.toLocaleString("en-IN")}</p>
            </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#090909] text-white selection:bg-brand-purple selection:text-white pb-20">
      <Navbar />
      
      {/* HEADER ACTIONS */}
      <div className="pt-10 px-6 max-w-[1400px] mx-auto mb-8 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-white transition-colors uppercase tracking-widest font-bold">
            <FaArrowLeft /> Back to Dashboard
        </Link>
        <div className="flex gap-4">
             {/* PDF Button */}
             <button 
                onClick={() => generateSpecSheetPDF(config)} 
                className="flex items-center gap-2 px-6 py-2 border border-white/10 hover:bg-white hover:text-black transition-all uppercase text-[10px] font-bold tracking-widest font-orbitron"
             >
                <FaDownload /> Download Spec Sheet
             </button>

             {/* UPDATED: Buy This Rig Button */}
             <button 
                onClick={handleBuyRig} 
                className="flex items-center gap-2 px-6 py-2 bg-brand-purple text-white hover:bg-white hover:text-black transition-all uppercase text-[10px] font-bold tracking-widest font-orbitron shadow-[0_0_15px_rgba(78,44,139,0.4)]"
             >
                <FaShoppingCart /> Buy This Rig
             </button>
        </div>
      </div>

      {/* MAIN SHOWCASE */}
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
         
         {/* LEFT: HERO IMAGE (Cabinet) */}
         <div className="relative aspect-square flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent rounded-3xl border border-white/5 p-12 order-2 lg:order-1">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-purple/20 via-transparent to-transparent opacity-50 blur-3xl"></div>
             
             {/* Unified Image Block: Shows Cabinet if selected, otherwise Default 3.jpg */}
             <div className="relative w-full h-full animate-in zoom-in duration-700">
                <Image 
                    src={specs.cabinet?.image || "/images/Default custom rig/3.jpg"} 
                    alt="System Preview" 
                    fill 
                    className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" 
                    priority 
                />
             </div>
         </div>

         {/* RIGHT: DETAILS */}
         <div className="order-1 lg:order-2 space-y-6">
             <div className="inline-block px-3 py-1 bg-white/10 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest mb-2">
                Custom Configuration
             </div>
             <h1 className="text-5xl md:text-7xl font-orbitron font-bold text-white leading-none">
                 BUILD <span className="text-brand-purple">PREVIEW</span>
             </h1>
             <p className="text-xl text-[#A0A0A0] font-saira max-w-md">
                 A precision-engineered machine featuring the <span className="text-white">{specs.cpu?.name}</span> and <span className="text-white">{specs.gpu?.name}</span>.
             </p>
             
             <div className="py-8 border-y border-white/10 flex items-end gap-6">
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] mb-1">Total Build Cost</p>
                    <p className="text-5xl font-orbitron font-bold text-white">₹{Number(config.total_price).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right flex-grow">
                    <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] mb-1">Estimated Power</p>
                    <p className="text-2xl font-orbitron text-brand-white">
                        {(() => {
                            // FIX: Using '.wattage' instead of '.tdp' (matches Configurator logic)
                            // Configurator logic: cpu (65W default) + gpu + mobo(50) + ram(15) + storage(10) + cooler(10) + buffer(100)
                            
                            const cpuWatts = specs.cpu?.wattage || 65;
                            const gpuWatts = specs.gpu?.wattage || 0;
                            const baseSystemWatts = 50 + 15 + 10 + 10; // Mobo + RAM + Storage + Cooler estimates
                            const buffer = 100; // Safety buffer used in configurator

                            return cpuWatts + gpuWatts + baseSystemWatts + buffer;
                        })()}W
                    </p>
                </div>
             </div>
         </div>
      </div>

      {/* COMPONENTS GRID */}
      <div className="max-w-[1400px] mx-auto px-6">
        <h2 className="text-2xl font-orbitron font-bold mb-8 border-l-4 border-brand-purple pl-4">Hardware Manifest</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ComponentCard label="Processor" item={specs.cpu} icon={FaMicrochip} />
            <ComponentCard label="Graphics Card" item={specs.gpu} icon={FaDesktop} />
            <ComponentCard label="Motherboard" item={specs.motherboard} icon={FaMicrochip} />
            <ComponentCard label="Memory" item={specs.ram} icon={FaMemory} />
            <ComponentCard label="Storage" item={specs.storage} icon={FaHdd} />
            <ComponentCard label="Cooling" item={specs.cooler} icon={FaFan} />
            <ComponentCard label="Power Supply" item={specs.psu} icon={FaMicrochip} />
            <ComponentCard label="Cabinet" item={specs.cabinet} icon={FaDesktop} />
            {specs.monitor && <ComponentCard label="Monitor" item={specs.monitor} icon={FaDesktop} />}
            {specs.keyboard && <ComponentCard label="Keyboard" item={specs.keyboard} icon={FaKeyboard} />}
        </div>
      </div>

    </main>
  );
}