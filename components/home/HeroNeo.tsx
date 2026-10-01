"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

// Fixed particle field (deterministic → no hydration mismatch).
const PARTICLES = [
  { l: "8%", t: "24%", s: 3, d: 0, dur: 6, o: 0.5 },
  { l: "30%", t: "72%", s: 2, d: 1.2, dur: 7, o: 0.4 },
  { l: "16%", t: "52%", s: 4, d: 0.6, dur: 8, o: 0.35 },
  { l: "42%", t: "18%", s: 2, d: 2, dur: 6.5, o: 0.4 },
  { l: "6%", t: "80%", s: 3, d: 1.4, dur: 6.6, o: 0.4 },
  { l: "38%", t: "44%", s: 2, d: 1.8, dur: 6.2, o: 0.3 },
];

export default function HeroNeo() {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-rb-black pt-28 pb-16">
      {/* ───────── PREMIUM BACKGROUND (subtle; fades in after the title) ───────── */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 1.9, duration: 1.4, ease: EASE }}
      >
        <div
          className="rb-ember-pulse absolute top-[10%] left-[2%] w-[460px] h-[460px] max-w-[60vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,90,31,0.14), transparent 66%)" }}
        />
        <div className="rb-dots absolute inset-0 opacity-40" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="rb-float absolute rounded-full bg-rb-orange"
            style={{
              left: p.l,
              top: p.t,
              width: p.s,
              height: p.s,
              opacity: p.o,
              animationDelay: `${p.d}s`,
              animationDuration: `${p.dur}s`,
              boxShadow: "0 0 8px rgba(255,90,31,0.7)",
            }}
          />
        ))}
      </motion.div>

      {/* ───────── CONTENT (aligned to the nav via rb-shell) ───────── */}
      <div className="rb-shell relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT — text */}
          <div className="text-center lg:text-left">
            <motion.p
              className="font-orbitron uppercase tracking-[0.32em] text-rb-silver text-xs sm:text-sm md:text-base mb-3 md:mb-4"
              initial={reduce ? { opacity: 1 } : { scale: 3, filter: "blur(10px)", opacity: 0 }}
              animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE }}
              style={{ transformOrigin: "center" }}
            >
              Welcome to
            </motion.p>

            <motion.h1
              className="font-orbitron font-black uppercase leading-[0.9] text-rb-white text-5xl sm:text-6xl md:text-7xl"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 1.3, duration: 0.9, ease: EASE }}
            >
              RIG{" "}
              <span className="rb-text-ember bg-gradient-to-b from-rb-orange to-rb-orange-deep bg-clip-text text-transparent">
                BUILDERS
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 md:mt-8 font-saira text-rb-silver text-sm sm:text-base md:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 1.7, duration: 0.8, ease: EASE }}
            >
              <span className="text-rb-white font-semibold">Commissioned. Not assembled.</span>{" "}
              Precision custom PCs — built and proven for exactly how you play, create and work.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 1.95, duration: 0.8, ease: EASE }}
            >
              <Link href="/configure" className="w-full sm:w-auto">
                <button className="rb-cta rb-sheen w-full sm:w-auto px-9 py-4 uppercase tracking-widest text-sm">
                  Build Your Rig
                </button>
              </Link>
              <Link href="/products" className="w-full sm:w-auto">
                <button className="rb-ghost rb-sheen w-full sm:w-auto px-9 py-4 font-saira font-bold uppercase tracking-widest text-sm">
                  Explore Rigs
                </button>
              </Link>
            </motion.div>
          </div>

          {/* RIGHT — framed rig image */}
          <motion.div
            className="relative"
            initial={reduce ? { opacity: 1 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduce ? 0 : 0.9, duration: 1.1, ease: EASE }}
          >
            {/* ember glow behind the frame */}
            <div className="absolute -inset-6 bg-rb-orange/15 blur-3xl rounded-[40px] pointer-events-none" />

            <div className="rb-float relative rounded-2xl overflow-hidden border border-rb-line shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] w-full">
                <Image
                  src="/images/homepage/hero/1.jpg"
                  alt="A commissioned Rig Builders custom PC"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* readability + brand gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-rb-black/80 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-rb-orange/10 via-transparent to-transparent mix-blend-screen" />
              </div>

              {/* floating spec chip */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2.5 bg-rb-black/70 backdrop-blur-md rounded-full px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rb-orange rb-ember-pulse" />
                <span className="font-saira text-[11px] uppercase tracking-[0.18em] text-rb-white">
                  Signature Build · Liquid-cooled
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 2.3, duration: 1 }}
      >
        <span className="font-saira text-[9px] uppercase tracking-[0.3em] text-rb-silver/60">Scroll</span>
        <span className="relative w-[1px] h-9 bg-rb-line overflow-hidden">
          <span className="absolute top-0 left-0 w-full h-1/2 bg-rb-orange rb-scroll-dot" />
        </span>
      </motion.div>
    </section>
  );
}
