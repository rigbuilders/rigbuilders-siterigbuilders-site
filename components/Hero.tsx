"use client";

import Link from "next/link";
import { useRef } from "react";
import { Reveal } from "@/components/ui/MotionWrappers";

export default function Hero() {
  // Pointer parallax — refs mutated directly (no re-render) for smoothness.
  const glowRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (glowRef.current)
        glowRef.current.style.transform = `translate3d(${x * 34}px, ${y * 34}px, 0)`;
      if (floorRef.current)
        floorRef.current.style.transform = `perspective(650px) rotateX(66deg) translate3d(${x * -26}px, ${y * -12}px, 0)`;
    });
  };

  return (
    <section
      onMouseMove={handleMove}
      className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden bg-rb-black"
    >
      {/* 1. CINEMATIC VIDEO — desaturated to mono so the only colour is the brand ember */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/homepage/hero/1.jpg"
          className="w-full h-full object-cover opacity-30 grayscale contrast-125"
        >
          <source
            src="https://cdn.pixabay.com/video/2023/10/22/186115-877660688_large.mp4"
            type="video/mp4"
          />
        </video>
        {/* fade video into pure black at edges + bottom */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_35%,transparent,rgba(10,10,10,0.7)_75%,#0A0A0A)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-rb-black to-transparent" />
      </div>

      {/* 2. Perspective tech-grid floor (parallax) */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] z-[1] [transform-style:preserve-3d] [perspective:650px] pointer-events-none">
        <div
          ref={floorRef}
          className="rb-grid rb-grid-drift absolute inset-0 origin-bottom [transform:perspective(650px)_rotateX(66deg)]"
        />
      </div>

      {/* 3. Ember glow (parallax) */}
      <div
        ref={glowRef}
        className="rb-ember-pulse absolute top-1/4 left-1/2 -translate-x-1/2 w-[680px] h-[680px] max-w-[90vw] z-[1] pointer-events-none rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,90,31,0.20), rgba(255,90,31,0.06) 40%, transparent 68%)",
        }}
      />

      {/* 4. HUD corner brackets */}
      <div className="pointer-events-none absolute inset-5 md:inset-8 z-[2]">
        <span className="absolute top-0 left-0 w-8 h-8 border-t border-l border-rb-orange/40" />
        <span className="absolute top-0 right-0 w-8 h-8 border-t border-r border-rb-orange/40" />
        <span className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-rb-orange/40" />
        <span className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-rb-orange/40" />
      </div>

      {/* 5. Content */}
      <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
        <Reveal>
          <div className="inline-flex items-center gap-2 mb-6 border border-rb-line bg-white/[0.03] backdrop-blur-md px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rb-orange rb-ember-pulse" />
            <p className="font-saira text-rb-mist tracking-[0.2em] text-[9px] md:text-[11px] font-bold uppercase">
              New · RTX 50-Series Configurations
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-rb-white mb-7 leading-[0.95] drop-shadow-2xl">
            COMMISSIONED.
            <br />
            <span className="rb-text-ember bg-gradient-to-r from-rb-orange to-rb-orange-deep bg-clip-text text-transparent">
              NOT ASSEMBLED.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="font-saira text-rb-silver text-base md:text-xl max-w-2xl mx-auto mb-9 leading-relaxed">
            India&apos;s premium custom PC brand. Engineered for performance, built with
            craftsmanship, backed by proof.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/configure" className="w-full sm:w-auto">
              <button className="rb-cta rb-sheen w-full sm:w-auto px-9 py-4 uppercase tracking-widest text-sm">
                Start Configuration
              </button>
            </Link>
            <Link href="/signature" className="w-full sm:w-auto">
              <button className="rb-ghost rb-sheen w-full sm:w-auto px-9 py-4 font-saira font-bold uppercase tracking-widest text-sm">
                View Signature Edition
              </button>
            </Link>
          </div>
        </Reveal>

        {/* 6. Trust strip — qualitative proof, no invented numbers */}
        <Reveal delay={0.34}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {["Compatibility verified", "Thermals validated", "Performance proven"].map(
              (t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="w-4 h-[2px] rb-bar-anim rounded-full" />
                  <span className="font-saira text-[10px] md:text-xs uppercase tracking-[0.18em] text-rb-silver">
                    {t}
                  </span>
                </div>
              )
            )}
          </div>
        </Reveal>
      </div>

      {/* 7. Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <span className="font-saira text-[9px] uppercase tracking-[0.3em] text-rb-silver/70">
          Scroll
        </span>
        <span className="relative w-[1px] h-10 bg-rb-line overflow-hidden">
          <span className="absolute top-0 left-0 w-full h-1/2 bg-rb-orange rb-scroll-dot" />
        </span>
      </div>
    </section>
  );
}
