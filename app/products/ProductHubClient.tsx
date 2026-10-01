"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import HeroCarousel from "@/components/home/HeroCarousel";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaArrowRight } from "react-icons/fa";
import { HUB_CATEGORIES } from "@/app/data/categories";

type HubCard = { id: string; name: string; sub: string; desc: string; image: string };

// Fallback used only if the server passes nothing (DB unreachable at build).
const FALLBACK_CARDS: HubCard[] = HUB_CATEGORIES.map((c) => ({
  id: c.slug,
  name: c.hub!.name,
  sub: c.hub!.sub,
  desc: c.hub!.desc,
  image: c.hub!.image,
}));

export default function ProductHubClient({ categories: categoriesProp }: { categories?: HubCard[] }) {
  const categories = categoriesProp && categoriesProp.length > 0 ? categoriesProp : FALLBACK_CARDS;

  return (
    <main className="min-h-screen bg-rb-black text-white font-saira flex flex-col">
      <NavbarNeo overlay />

      {/* full-bleed carousel (managed in /admin/hero → Products page) */}
      <HeroCarousel location="products" compact />

      {/* SECTION HEADER */}
      <section className="rb-shell pt-14 lg:pt-16 pb-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="rb-kicker">Component ecosystem</span>
            <h1 className="mt-3 font-orbitron text-4xl md:text-6xl font-black uppercase text-rb-white leading-[0.95]">
              Every<span className="rb-text-ember"> part</span>
            </h1>
            <p className="mt-4 font-saira text-rb-silver text-sm md:text-base leading-relaxed">
              Engineer your ultimate machine with precision hardware — each category vetted for
              reliability, backed by official warranty and insured shipping.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CINEMATIC CATEGORY GRID */}
      <div className="flex-grow w-full pb-16">
        <div className="rb-shell">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {categories.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.05}>
                <Link
                  href={`/products/${cat.id}`}
                  className="group relative block h-[260px] sm:h-[380px] lg:h-[440px] overflow-hidden rounded-xl sm:rounded-2xl border border-rb-line"
                >
                  {/* BACKGROUND IMAGE */}
                  <div className="absolute inset-0">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-rb-black/40 group-hover:bg-rb-black/55 transition-colors duration-500" />
                    <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-rb-black via-rb-black/55 to-transparent" />
                    {/* ember wash on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-rb-orange/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen" />
                  </div>

                  {/* CONTENT */}
                  <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-6 lg:p-7">
                    {/* framed hover box */}
                    <div className="absolute inset-4 sm:inset-6 border border-rb-orange/30 rounded-lg sm:rounded-xl scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

                    <span className="rb-kicker text-rb-orange mb-1.5 sm:mb-2 text-[9px] sm:text-[10px]">{cat.sub}</span>
                    <h2 className="font-orbitron text-lg sm:text-2xl lg:text-4xl font-black uppercase text-rb-white tracking-tight leading-none drop-shadow-2xl">
                      {cat.name}
                    </h2>

                    {/* reveal-on-hover desc + cta */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-out">
                      <div className="overflow-hidden">
                        <p className="mt-4 text-rb-mist text-xs font-saira uppercase tracking-wider leading-relaxed">
                          {cat.desc}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-2.5 text-xs font-orbitron font-bold uppercase tracking-widest text-rb-orange">
                          Browse Parts <FaArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* top sweep line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rb-orange to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
