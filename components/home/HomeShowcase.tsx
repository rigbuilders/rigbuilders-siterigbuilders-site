"use client";

import Link from "next/link";
import BrandCarousel from "@/components/BrandCarousel";
import ComponentsPicker from "@/components/home/ComponentsPicker";
import { HUB_CATEGORIES } from "@/app/data/categories";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import {
  FaGamepad,
  FaVideo,
  FaBuilding,
  FaSlidersH,
  FaShieldAlt,
  FaFingerprint,
  FaTruck,
  FaArrowRight,
  FaMicrochip,
  FaDesktop,
  FaServer,
  FaHdd,
  FaBox,
  FaPlug,
  FaMemory,
  FaFan,
  FaCrown,
  FaTools,
} from "react-icons/fa";
import type { IconType } from "react-icons";

const CAT_ICON: Record<string, IconType> = {
  cpu: FaMicrochip, gpu: FaDesktop, motherboard: FaServer, storage: FaHdd,
  cabinet: FaBox, psu: FaPlug, ram: FaMemory, cooler: FaFan,
};

const VALUES = [
  "Compatibility Verified",
  "Thermals Validated",
  "Performance Proven",
  "Expert-Built",
  "Cable-Managed",
  "Stress-Tested",
  "Warranty Backed",
];

const USE_CASES = [
  {
    icon: <FaGamepad />,
    title: "Gaming",
    series: "Ascend Series",
    desc: "High-FPS esports to 4K ray-tracing. Tuned frame-by-frame for the resolution you play at.",
    href: "/ascend",
  },
  {
    icon: <FaVideo />,
    title: "Creation",
    series: "Creator Series",
    desc: "Stream, edit and render without bottlenecks. NVENC and multi-core dominance.",
    href: "/creator",
  },
  {
    icon: <FaBuilding />,
    title: "Workstation",
    series: "WorkPro Series",
    desc: "Stability, security and uptime for corporate fleets, compute and heavy workloads.",
    href: "/workpro",
  },
  {
    icon: <FaSlidersH />,
    title: "Fully Custom",
    series: "Configurator",
    desc: "Pick every part yourself with live compatibility and thermal checks as you build.",
    href: "/configure",
  },
];

const PROOF = [
  {
    icon: <FaShieldAlt />,
    title: "Proof-Built, Not Just Assembled",
    desc: "Every system is stress-tested, thermally validated and documented. You see the results — not just our word.",
  },
  {
    icon: <FaFingerprint />,
    title: "Engineered Craftsmanship",
    desc: "Component harmony, symmetrical cabling and airflow design. Each rig is built precise, clean and intentional.",
  },
  {
    icon: <FaTruck />,
    title: "Delivery Without Compromise",
    desc: "Shock-protected, foam-packed and quality-checked so it arrives exactly as it left our bench.",
  },
];

export default function HomeShowcase() {
  const MOBILE_SERIES: { name: string; tag: string; href: string; icon: IconType }[] = [
    { name: "Ascend", tag: "Gaming", href: "/ascend", icon: FaGamepad },
    { name: "Creator", tag: "Studio", href: "/creator", icon: FaVideo },
    { name: "WorkPro", tag: "Workstation", href: "/workpro", icon: FaBuilding },
    { name: "Signature", tag: "Flagship", href: "/signature", icon: FaCrown },
  ];

  return (
    <>
      {/* ═══════════ MOBILE — minimal: bare icons + text, no cards ═══════════ */}
      <div className="lg:hidden bg-rb-black">
        {/* PRODUCTS */}
        <section className="rb-shell pt-12 pb-14">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-orbitron text-2xl font-black uppercase text-rb-white">
              Compo<span className="rb-text-ember">nents</span>
            </h2>
            <Link href="/products" className="text-[11px] font-bold uppercase tracking-widest text-rb-orange">View all ›</Link>
          </div>
          <div className="grid grid-cols-4 gap-x-3 gap-y-8">
            {HUB_CATEGORIES.slice(0, 8).map((c) => {
              const Icon = CAT_ICON[c.slug] || FaMicrochip;
              return (
                <Link key={c.slug} href={`/products/${c.slug}`} className="group flex flex-col items-center text-center gap-2.5">
                  <Icon className="text-rb-orange text-[28px] group-active:scale-90 transition-transform" />
                  <span className="font-orbitron text-[10px] font-bold uppercase tracking-wide text-rb-mist leading-tight">{c.short}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* BUILD YOUR OWN */}
        <section className="rb-shell py-14 text-center border-t border-rb-line">
          <FaTools className="text-rb-orange text-5xl mx-auto mb-5" />
          <span className="rb-kicker">Fully custom</span>
          <h2 className="mt-2 font-orbitron text-3xl font-black uppercase text-rb-white leading-none">
            Build Your <span className="rb-text-ember">Own</span>
          </h2>
          <p className="mt-3 font-saira text-rb-silver text-sm max-w-xs mx-auto leading-relaxed">
            Hand-pick every part with live compatibility and power checks.
          </p>
          <Link href="/configure" className="inline-block mt-6">
            <button className="rb-cta rb-sheen px-9 py-3.5 rounded-lg uppercase tracking-widest text-xs">Start Build</button>
          </Link>
        </section>

        {/* DESKTOPS */}
        <section className="rb-shell py-14 border-t border-rb-line">
          <h2 className="font-orbitron text-2xl font-black uppercase text-rb-white mb-8">
            Desk<span className="rb-text-ember">tops</span>
          </h2>
          <div className="grid grid-cols-4 gap-x-3 gap-y-8">
            {MOBILE_SERIES.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={s.href} className="group flex flex-col items-center text-center gap-2.5">
                  <Icon className="text-rb-orange text-[28px] group-active:scale-90 transition-transform" />
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-wide text-rb-white leading-tight">{s.name}</span>
                </Link>
              );
            })}
          </div>
          <Link href="/desktops" className="block text-center mt-10">
            <button className="rb-ghost px-8 py-3 rounded-lg uppercase tracking-widest text-xs">All Desktops</button>
          </Link>
        </section>
      </div>

      {/* ═══════════ DESKTOP — full showcase ═══════════ */}
      <div className="hidden lg:block">
      {/* ── VALUES MARQUEE ─────────────────────────────── */}
      <section className="relative bg-rb-black border-y border-rb-line py-5 overflow-hidden">
        <div className="rb-marquee gap-10 items-center">
          {[...VALUES, ...VALUES].map((v, i) => (
            <div key={i} className="flex items-center gap-10 shrink-0">
              <span className="font-orbitron text-sm md:text-base font-bold uppercase tracking-[0.2em] text-rb-white/70">
                {v}
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-rb-orange shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* ── USE-CASE BUILDS ────────────────────────────── */}
      <section className="relative bg-rb-surface py-24 overflow-hidden">
        <div className="rb-ember-glow" />
        <div className="rb-shell relative z-10">
          <Reveal>
            <div className="text-center mb-14">
              <span className="rb-kicker">Built for how you use it</span>
              <h2 className="mt-3 font-orbitron text-3xl md:text-5xl font-black text-rb-white uppercase">
                Choose Your <span className="rb-text-ember">Path</span>
              </h2>
            </div>
          </Reveal>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {USE_CASES.map((c) => (
              <StaggerItem key={c.title} className="h-full">
                <Link href={c.href} className="group block h-full">
                  <div className="rb-surface-card rb-sheen h-full p-7 flex flex-col">
                    <div className="w-12 h-12 rounded-lg bg-rb-orange/10 border border-rb-orange/20 flex items-center justify-center text-rb-orange text-xl mb-6 group-hover:scale-110 transition-transform">
                      {c.icon}
                    </div>
                    <span className="rb-kicker text-rb-orange/80 text-[10px]">{c.series}</span>
                    <h3 className="mt-1 font-orbitron text-2xl font-bold text-rb-white">
                      {c.title}
                    </h3>
                    <p className="mt-3 font-saira text-rb-silver text-sm leading-relaxed flex-1">
                      {c.desc}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-rb-orange text-xs font-bold uppercase tracking-widest">
                      <span className="w-6 h-[2px] rb-bar-anim rounded-full group-hover:w-10 transition-all" />
                      Explore
                      <FaArrowRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" size={11} />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── PICK YOUR PARTS (hover-expand, personalized featured product) ── */}
      <ComponentsPicker />

      {/* ── BRANDS WE TRUST (carousel from the previous homepage) ── */}
      <BrandCarousel />

      {/* ── PROOF / WHY ────────────────────────────────── */}
      <section className="relative bg-rb-black py-24 border-t border-rb-line overflow-hidden">
        <div className="rb-shell relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <Reveal className="lg:col-span-4">
              <span className="rb-kicker">The difference</span>
              <h2 className="mt-3 font-orbitron text-3xl md:text-5xl font-black text-rb-white uppercase leading-tight">
                Why <br />
                <span className="rb-text-ember">Rig Builders</span>
              </h2>
              <p className="mt-5 font-saira text-rb-silver leading-relaxed max-w-sm">
                Reliability and trust aren&apos;t claims — they&apos;re documented. Here&apos;s what
                every build gets, as standard.
              </p>
              <Link href="/how-we-commission">
                <button className="rb-ghost rb-sheen mt-8 px-7 py-3 text-xs uppercase tracking-widest">
                  How we commission
                </button>
              </Link>
            </Reveal>

            <StaggerGrid className="lg:col-span-8 grid sm:grid-cols-1 gap-4">
              {PROOF.map((p, i) => (
                <StaggerItem key={p.title}>
                  <div className="rb-surface-card rb-sheen p-7 flex gap-6 items-start">
                    <div className="shrink-0 flex flex-col items-center">
                      <span className="font-orbitron text-rb-orange/30 font-black text-3xl leading-none">
                        0{i + 1}
                      </span>
                      <span className="mt-3 text-rb-orange text-xl">{p.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-orbitron text-xl font-bold text-rb-white mb-2">
                        {p.title}
                      </h3>
                      <p className="font-saira text-rb-silver leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <section className="relative bg-rb-surface py-28 overflow-hidden border-t border-rb-line">
        <div className="absolute inset-0 rb-grid rb-grid-drift opacity-60" />
        <div
          className="rb-ember-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] max-w-[90vw] pointer-events-none rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,90,31,0.16), transparent 66%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-6">
          <Reveal>
            <h2 className="font-orbitron text-4xl md:text-6xl font-black text-rb-white uppercase leading-[0.95]">
              Ready to <span className="rb-text-ember">commission</span> your rig?
            </h2>
            <p className="mt-6 font-saira text-rb-silver text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Start from a proven build or configure every component yourself. Either way, it ships
              verified.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/configure">
                <button className="rb-cta rb-sheen px-10 py-4 uppercase tracking-widest text-sm">
                  Start Configuration
                </button>
              </Link>
              <Link href="/signature">
                <button className="rb-ghost rb-sheen px-10 py-4 font-saira font-bold uppercase tracking-widest text-sm">
                  Signature Edition
                </button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      </div>
    </>
  );
}
