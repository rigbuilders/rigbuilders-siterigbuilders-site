"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaArrowRight, FaMicrochip, FaBolt, FaMemory } from "react-icons/fa";

interface Props {
  series: string;   // db value, e.g. "ascend"
  label: string;    // display, e.g. "ASCEND"
  subtitle: string;
  tier: string;
}

export default function SeriesTierProducts({ series, label, subtitle, tier }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTier = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("series", series)
        .eq("tier", tier);
      setProducts(data || []);
      setLoading(false);
    };
    fetchTier();
  }, [series, tier]);

  return (
    <main className="min-h-screen bg-rb-black text-white font-saira flex flex-col">
      <NavbarNeo />

      {/* HEADER */}
      <section className="relative overflow-hidden bg-rb-surface border-b border-rb-line py-14 lg:py-20">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] max-w-[70vw] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(255,90,31,0.12), transparent 66%)" }} />
        <div className="rb-shell relative z-10 text-center">
          <Reveal>
            <span className="rb-kicker">Pre-built systems</span>
            <h1 className="mt-3 font-orbitron font-black uppercase text-4xl md:text-6xl text-rb-white tracking-tight">
              {label} <span className="rb-text-ember">Level {tier}</span>
            </h1>
            <p className="mt-4 text-rb-silver text-sm md:text-base max-w-xl mx-auto">{subtitle}</p>
          </Reveal>
        </div>
      </section>

      {/* PRODUCTS */}
      <div className="flex-grow rb-shell py-12 lg:py-16">
        {loading ? (
          <div className="text-center text-rb-silver animate-pulse py-16 uppercase tracking-widest text-sm">Loading systems…</div>
        ) : products.length === 0 ? (
          <div className="text-center text-rb-silver border border-dashed border-rb-line py-16 rounded-2xl">
            No systems found in this tier yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <div className="rb-surface-card overflow-hidden flex flex-col group h-full">
                  <Link href={`/product/${p.id}`} className="block h-60 bg-rb-black flex items-center justify-center relative overflow-hidden border-b border-rb-line">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="max-h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <span className="text-white/20 font-orbitron">{p.name}</span>
                    )}
                  </Link>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-orbitron text-xl font-bold text-rb-white mb-4">{p.name}</h3>

                    <div className="text-xs space-y-2 mb-6">
                      <SpecLine icon={<FaMicrochip />} label="CPU" value={p.specs?.["Processor"]} />
                      <SpecLine icon={<FaBolt />} label="GPU" value={p.specs?.["Graphics Card"]} />
                      <SpecLine icon={<FaMemory />} label="RAM" value={p.specs?.["Memory"]} />
                    </div>

                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-rb-line">
                      <span className="font-saira font-bold text-lg text-rb-white">₹{Number(p.price || 0).toLocaleString("en-IN")}</span>
                      <Link href={`/product/${p.id}`} className="rb-cta rb-sheen px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        View Build <FaArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

function SpecLine({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <p className="flex items-center gap-2 text-rb-silver">
      <span className="text-rb-orange shrink-0">{icon}</span>
      <span className="uppercase tracking-wider text-[10px] w-8 shrink-0">{label}</span>
      <span className="text-rb-white truncate">{value || "TBD"}</span>
    </p>
  );
}
