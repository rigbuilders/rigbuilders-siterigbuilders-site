"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import { FaArrowLeft, FaShoppingCart, FaDownload, FaMicrochip, FaMemory, FaHdd, FaFan, FaDesktop, FaKeyboard, FaBolt } from "react-icons/fa";
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
    const customBuildItem = {
      id: config.id,
      name: config.name || "Custom PC Commission",
      price: Number(config.total_price) || 0,
      image: config.specs?.cabinet?.image || "/images/placeholder_pc.png",
      category: "custom-build",
      specs: config.specs,
      quantity: 1,
    };
    addToCart(customBuildItem);
    router.push("/checkout");
  };

  useEffect(() => {
    const fetchConfig = async () => {
      if (!params.id) return;
      const { data, error } = await supabase
        .from("saved_configurations")
        .select("*")
        .eq("id", params.id)
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

  if (loading)
    return (
      <div className="min-h-screen bg-rb-black flex items-center justify-center text-rb-silver font-orbitron animate-pulse tracking-widest uppercase text-sm">
        Loading system data…
      </div>
    );
  if (!config) return null;

  const { specs } = config;

  const estimatedWatts = (() => {
    const cpuWatts = specs?.cpu?.wattage || 65;
    const gpuWatts = specs?.gpu?.wattage || 0;
    const baseSystemWatts = 50 + 15 + 10 + 10; // Mobo + RAM + Storage + Cooler
    const buffer = 100;
    return cpuWatts + gpuWatts + baseSystemWatts + buffer;
  })();

  const ComponentCard = ({ label, item, icon: Icon }: any) => {
    if (!item) return null;
    return (
      <div className="group relative rb-surface-card !bg-rb-black overflow-hidden p-5">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity text-rb-orange">
          <Icon size={22} />
        </div>
        <div className="relative z-10 flex gap-4 items-center">
          <div className="w-16 h-16 bg-rb-surface rounded-lg border border-rb-line flex items-center justify-center overflow-hidden shrink-0">
            {item.image ? <Image src={item.image} alt={item.name} width={64} height={64} className="object-contain" /> : <Icon className="text-white/20" />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-rb-silver mb-1">{label}</p>
            <h4 className="text-rb-white font-bold font-saira leading-tight group-hover:text-rb-orange transition-colors truncate">{item.name}</h4>
            <p className="text-sm font-bold text-rb-silver mt-1 font-saira">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-rb-black text-white font-saira selection:bg-rb-orange selection:text-rb-orange-ink flex flex-col">
      <NavbarNeo />

      <div className="rb-shell flex-grow">
        {/* HEADER ACTIONS */}
        <div className="pt-6 pb-8 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-rb-silver hover:text-rb-white transition-colors uppercase tracking-widest font-bold">
            <FaArrowLeft /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => generateSpecSheetPDF(config)} className="rb-ghost flex items-center gap-2 px-5 py-2.5 rounded-lg uppercase text-[10px] font-bold tracking-widest font-orbitron">
              <FaDownload /> Download Spec Sheet
            </button>
            <button onClick={handleBuyRig} className="rb-cta rb-sheen flex items-center gap-2 px-5 py-2.5 rounded-lg uppercase text-[10px] font-bold tracking-widest font-orbitron">
              <FaShoppingCart /> Buy This Rig
            </button>
          </div>
        </div>

        {/* MAIN SHOWCASE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16 lg:mb-24">
          {/* LEFT: HERO IMAGE */}
          <div className="relative aspect-square flex items-center justify-center rb-surface-card !bg-gradient-to-b from-white/5 to-transparent p-10 lg:p-12 order-2 lg:order-1 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rb-orange/20 via-transparent to-transparent opacity-60 blur-3xl" />
            <div className="rb-dots absolute inset-0 opacity-20" />
            <div className="relative w-full h-full animate-in zoom-in duration-700">
              <Image src={specs?.cabinet?.image || "/images/Default custom rig/3.jpg"} alt="System Preview" fill className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" priority />
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="order-1 lg:order-2 space-y-5">
            <span className="rb-kicker">Custom configuration</span>
            <h1 className="font-orbitron font-black uppercase text-5xl md:text-7xl text-rb-white leading-[0.9]">
              Build <span className="rb-text-ember">Preview</span>
            </h1>
            <p className="text-lg text-rb-silver font-saira max-w-md leading-relaxed">
              A precision-engineered machine featuring the <span className="text-rb-white font-bold">{specs?.cpu?.name}</span> and <span className="text-rb-white font-bold">{specs?.gpu?.name}</span>.
            </p>

            <div className="py-7 border-y border-rb-line flex flex-wrap items-end gap-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-rb-silver mb-1">Total Build Cost</p>
                <p className="text-4xl lg:text-5xl font-saira font-bold text-rb-white">₹{Number(config.total_price || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right flex-grow">
                <p className="text-[10px] uppercase tracking-widest text-rb-silver mb-1">Estimated Power</p>
                <p className="text-2xl font-orbitron text-rb-white flex items-center justify-end gap-2">
                  <FaBolt className="text-rb-orange" size={18} /> {estimatedWatts}W
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COMPONENTS GRID */}
        <div className="pb-20">
          <h2 className="text-2xl font-orbitron font-black uppercase mb-8 border-l-4 border-rb-orange pl-4 text-rb-white">Hardware Manifest</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ComponentCard label="Processor" item={specs?.cpu} icon={FaMicrochip} />
            <ComponentCard label="Graphics Card" item={specs?.gpu} icon={FaDesktop} />
            <ComponentCard label="Motherboard" item={specs?.motherboard} icon={FaMicrochip} />
            <ComponentCard label="Memory" item={specs?.ram} icon={FaMemory} />
            <ComponentCard label="Storage" item={specs?.storage} icon={FaHdd} />
            <ComponentCard label="Cooling" item={specs?.cooler} icon={FaFan} />
            <ComponentCard label="Power Supply" item={specs?.psu} icon={FaMicrochip} />
            <ComponentCard label="Cabinet" item={specs?.cabinet} icon={FaDesktop} />
            {specs?.monitor && <ComponentCard label="Monitor" item={specs.monitor} icon={FaDesktop} />}
            {specs?.keyboard && <ComponentCard label="Keyboard" item={specs.keyboard} icon={FaKeyboard} />}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
