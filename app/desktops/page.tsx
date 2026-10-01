"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import HeroCarousel from "@/components/home/HeroCarousel";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaMicrochip, FaMemory, FaArrowRight } from "react-icons/fa";
import FilterSidebar, { FilterGroupDef } from "@/components/ui/FilterSidebar";

const desktops = [
  {
    id: 1, name: "Ascend Series", tagline: "Rise above the ordinary",
    description: "The gateway to elite gaming. Engineered for high-refresh 1440p and 4K play with pure aesthetic focus.",
    series: "Ascend Series", cpu: "AMD", gpu: "NVIDIA", price: 145000,
    image: "/images/Desktops/ascend.jpg", route: "/ascend",
  },
  {
    id: 3, name: "WorkPro Series", tagline: "Industrial-grade performance",
    description: "Built for stability. Optimized for CAD, 3D rendering and data workflows where failure is not an option.",
    series: "WorkPro Series", cpu: "AMD", gpu: "AMD", price: 85000,
    image: "/images/Desktops/workpro.jpg", route: "/workpro",
  },
  {
    id: 4, name: "Creator Series", tagline: "Imagination unleashed",
    description: "Colour-accurate, silent and powerful. The perfect canvas for editors, streamers and digital artists.",
    series: "Creator Series", cpu: "Intel", gpu: "NVIDIA", price: 180000,
    image: "/images/Desktops/creator.jpg", route: "/creator",
  },
  {
    id: 5, name: "Signature Series", tagline: "The pinnacle of engineering",
    description: "Limited-edition chassis, custom-loop liquid cooling and top-binned silicon. The ultimate flagship.",
    series: "Signature Series", cpu: "Intel", gpu: "NVIDIA", price: 350000,
    image: "/images/Desktops/signature.jpg", route: "/signature",
  },
];

const DEFAULTS = { series: [] as string[], cpu: [] as string[], gpu: [] as string[], budget: [50000, 400000] as [number, number] };

const GROUPS: FilterGroupDef[] = [
  { key: "series", label: "Series", type: "checkbox", options: ["Ascend Series", "WorkPro Series", "Creator Series", "Signature Series"], defaultOpen: true },
  { key: "cpu", label: "Platform", type: "checkbox", options: ["AMD", "Intel"] },
  { key: "gpu", label: "Graphics", type: "checkbox", options: ["NVIDIA", "AMD"] },
  { key: "budget", label: "Budget", type: "range", min: 50000, max: 400000, step: 5000, prefix: "₹" },
];

export default function DesktopsPage() {
  const [value, setValue] = useState<Record<string, any>>({ ...DEFAULTS });

  const filtered = useMemo(() => {
    return desktops.filter((pc) => {
      if (value.series.length && !value.series.includes(pc.series)) return false;
      if (value.cpu.length && !value.cpu.includes(pc.cpu)) return false;
      if (value.gpu.length && !value.gpu.includes(pc.gpu)) return false;
      const [lo, hi] = value.budget || DEFAULTS.budget;
      if (pc.price < lo || pc.price > hi) return false;
      return true;
    });
  }, [value]);

  return (
    <main className="min-h-screen bg-rb-black text-white font-saira">
      <NavbarNeo overlay />

      {/* full-bleed carousel (managed in /admin/hero → Desktops page) */}
      <HeroCarousel location="desktops" compact />

      <section className="rb-shell py-10 lg:py-14">
        <Reveal>
          <div className="mb-10">
            <span className="rb-kicker">Pre-built systems</span>
            <h1 className="mt-3 font-orbitron text-4xl md:text-6xl font-black uppercase text-rb-white">
              Desk<span className="rb-text-ember">tops</span>
            </h1>
            <p className="mt-3 font-saira text-rb-silver text-sm md:text-base max-w-xl">
              Commissioned rigs across four series — each built to the same standard, tuned for a different job.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
          <FilterSidebar
            groups={GROUPS}
            value={value}
            onChange={(k, next) => setValue((v) => ({ ...v, [k]: next }))}
            onClearAll={() => setValue({ ...DEFAULTS })}
            resultCount={filtered.length}
            stickyTop={104}
          />

          <div className="space-y-6">
            {filtered.length === 0 ? (
              <div className="h-[40vh] flex flex-col items-center justify-center text-center rb-surface-card">
                <span className="font-orbitron text-2xl text-rb-white mb-2">No systems found</span>
                <p className="text-rb-silver text-sm">Adjust your filters to locate a rig.</p>
              </div>
            ) : (
              filtered.map((pc, i) => {
                const imageRight = i % 2 === 0;
                return (
                  <Reveal key={pc.id}>
                    <div className="group rb-surface-card overflow-hidden grid md:grid-cols-2 items-stretch">
                      {/* IMAGE */}
                      <div className={`relative min-h-[260px] md:min-h-[400px] overflow-hidden ${imageRight ? "md:order-2" : ""}`}>
                        <Image src={pc.image} alt={pc.name} fill className="object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-rb-black/70 via-transparent to-transparent md:hidden" />
                        <div className="absolute inset-0 bg-gradient-to-r from-rb-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-rb-black/70 backdrop-blur-md text-rb-orange text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                            {pc.series}
                          </span>
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <span className="rb-kicker text-rb-orange">{pc.tagline}</span>
                        <h2 className="mt-2 font-orbitron text-3xl xl:text-5xl font-black uppercase text-rb-white leading-none">
                          {pc.name.split(" ")[0]}
                        </h2>
                        <p className="mt-5 font-saira text-rb-silver leading-relaxed max-w-md">{pc.description}</p>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <span className="flex items-center gap-2 bg-white/5 border border-rb-line px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-rb-mist">
                            <FaMicrochip className="text-rb-orange" /> {pc.cpu}
                          </span>
                          <span className="flex items-center gap-2 bg-white/5 border border-rb-line px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-rb-mist">
                            <FaMemory className="text-rb-orange-deep" /> {pc.gpu}
                          </span>
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] text-rb-silver uppercase tracking-widest mb-1">Starting at</p>
                            <p className="font-saira text-2xl xl:text-3xl font-bold text-rb-white">₹{pc.price.toLocaleString("en-IN")}</p>
                          </div>
                          <Link href={pc.route}>
                            <button className="rb-cta rb-sheen px-7 py-3.5 rounded-lg uppercase tracking-widest text-sm flex items-center gap-2">
                              Explore <FaArrowRight size={12} />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
