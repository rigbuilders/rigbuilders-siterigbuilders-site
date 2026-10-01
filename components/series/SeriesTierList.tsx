"use client";

import Link from "next/link";
import {
  FaArrowRight, FaStar, FaCrosshairs, FaBolt, FaCrown,
  FaPenNib, FaVideo, FaCube, FaCode, FaDraftingCompass, FaBrain,
} from "react-icons/fa";
import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/ui/MotionWrappers";

// Icons are referenced by string key so server-component pages can pass plain
// data (functions can't cross the server → client boundary).
export type SeriesIcon =
  | "crosshairs" | "bolt" | "crown"
  | "pen" | "video" | "cube"
  | "code" | "drafting" | "brain";

const ICONS = {
  crosshairs: FaCrosshairs, bolt: FaBolt, crown: FaCrown,
  pen: FaPenNib, video: FaVideo, cube: FaCube,
  code: FaCode, drafting: FaDraftingCompass, brain: FaBrain,
} as const;

export interface SeriesTier {
  num: string;        // "05"
  title: string;      // "ASCEND LEVEL 5"
  desc: string;
  href: string;       // "/ascend/5"
  icon: SeriesIcon;
  bestSeller?: boolean;
}

export interface SeriesTierListProps {
  kicker: string;     // small label above the title
  title: string;      // "ASCEND"
  accent: string;     // "SERIES" (rendered in ember)
  subtitle: string;
  ctaLabel: string;   // "Deploy System"
  tiers: SeriesTier[];
}

export default function SeriesTierList({ kicker, title, accent, subtitle, ctaLabel, tiers }: SeriesTierListProps) {
  return (
    <main className="min-h-screen bg-rb-black text-white font-saira flex flex-col">
      <NavbarNeo />

      {/* HERO HEADER */}
      <section className="relative overflow-hidden bg-rb-surface border-b border-rb-line py-16 lg:py-24">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] max-w-[70vw] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(255,90,31,0.12), transparent 66%)" }} />
        <div className="rb-dots absolute inset-0 opacity-20 pointer-events-none" />

        <div className="rb-shell relative z-10 text-center">
          <Reveal>
            <span className="rb-kicker">{kicker}</span>
            <h1 className="mt-3 font-orbitron font-black uppercase text-5xl md:text-7xl text-rb-white tracking-tight">
              {title} <span className="rb-text-ember">{accent}</span>
            </h1>
            <p className="mt-5 text-rb-silver text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* TIER LIST */}
      <div className="rb-shell max-w-5xl py-14 lg:py-20 flex flex-col gap-12 lg:gap-16 flex-grow w-full">
        {tiers.map((t, i) => {
          const Icon = ICONS[t.icon];
          return (
            <div key={t.href}>
              {i > 0 && <div className="w-full h-px bg-rb-line mb-12 lg:mb-16" />}
              <Link href={t.href} className="group block">
                <Reveal>
                  <div className="relative pl-0 md:pl-4 border-l-2 border-transparent transition-all duration-500 hover:pl-8 hover:border-rb-orange">
                    {/* number watermark */}
                    <span className="absolute -top-6 -right-2 md:right-10 text-[6rem] md:text-[8rem] font-black text-white/[0.03] font-orbitron select-none group-hover:text-rb-orange/[0.06] transition-colors duration-500 pointer-events-none">
                      {t.num}
                    </span>

                    <div className="flex items-center gap-5 mb-4 relative z-10 flex-wrap">
                      <div className="text-rb-orange text-2xl bg-rb-orange/10 p-4 rounded-full border border-rb-orange/25 group-hover:bg-rb-orange group-hover:text-rb-orange-ink group-hover:scale-110 transition-all duration-300">
                        <Icon />
                      </div>
                      <h2 className="font-orbitron text-2xl md:text-4xl font-black uppercase text-rb-white group-hover:text-rb-orange transition-colors">
                        {t.title}
                      </h2>
                      {t.bestSeller && (
                        <span className="flex items-center gap-1.5 bg-rb-orange/15 border border-rb-orange/40 text-rb-orange px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <FaStar size={9} /> Best Seller
                        </span>
                      )}
                    </div>

                    <div className="md:pl-[80px] pr-4 relative z-10">
                      <p className="text-rb-silver leading-relaxed text-base md:text-lg mb-6 max-w-2xl">
                        {t.desc}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-rb-silver group-hover:text-rb-orange transition-colors">
                        <span>{ctaLabel}</span>
                        <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              </Link>
            </div>
          );
        })}
      </div>

      <Footer />
    </main>
  );
}
