"use client";

import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft } from "react-icons/fa";

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 group w-fit ${className}`}>
      <span className="relative w-8 h-8 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-rb-orange/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        <Image src="/icons/icon_only.svg" alt="Rig Builders — home" width={30} height={30} className="relative z-10" priority />
      </span>
      <span className="font-orbitron font-black tracking-[0.18em] text-[13px] text-rb-white leading-none">
        RIG<span className="text-rb-orange">BUILDERS</span>
      </span>
    </Link>
  );
}

export default function AuthLayout({
  kicker,
  title,
  highlight,
  subtitle,
  bullets = [],
  children,
}: {
  kicker: string;
  title: string;
  highlight: string;
  subtitle: string;
  bullets?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rb-surface text-rb-white font-saira grid lg:grid-cols-2">
      {/* ── LEFT · GREETING (desktop only) ── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-rb-black p-12 xl:p-16">
        {/* grid floor */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none [perspective:700px]">
          <div className="rb-grid rb-grid-drift absolute inset-0 origin-bottom [transform:perspective(700px)_rotateX(68deg)]" />
        </div>
        {/* ember */}
        <div
          className="rb-ember-pulse absolute -top-10 -right-10 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,90,31,0.18), transparent 66%)" }}
        />
        {/* HUD corners */}
        <span className="absolute top-6 left-6 w-8 h-8 border-t border-l border-rb-orange/40 pointer-events-none" />
        <span className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-rb-orange/40 pointer-events-none" />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10">
          <span className="rb-kicker">{kicker}</span>
          <h1 className="mt-4 font-orbitron font-black uppercase leading-[0.9] text-5xl xl:text-6xl">
            {title}
            <br />
            <span className="rb-text-ember bg-gradient-to-b from-rb-orange to-rb-orange-deep bg-clip-text text-transparent">
              {highlight}
            </span>
          </h1>
          <p className="mt-6 text-rb-silver text-base max-w-sm leading-relaxed">{subtitle}</p>
        </div>

        <div className="relative z-10 space-y-3">
          {bullets.map((b) => (
            <div key={b} className="flex items-center gap-3">
              <span className="w-5 h-[2px] rb-bar-anim rounded-full" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-rb-silver">{b}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── RIGHT · FORM ── */}
      <main className="relative flex flex-col min-h-screen">
        {/* top bar: mobile brand + back-to-store */}
        <div className="flex items-center justify-between px-6 sm:px-10 pt-6">
          <Logo className="lg:invisible" />
          <Link href="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-rb-silver hover:text-rb-orange transition-colors">
            <FaArrowLeft size={10} /> Store
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <p className="pb-6 text-center text-[11px] text-rb-silver/40">
          © {new Date().getFullYear()} Rig Builders. Commissioned, not assembled.
        </p>
      </main>
    </div>
  );
}

// Shared field styles for the auth forms.
export const authInput =
  "w-full bg-rb-black border border-rb-line rounded-lg p-3 text-white placeholder:text-rb-silver/40 focus:border-rb-orange focus:ring-1 focus:ring-rb-orange/40 outline-none transition-colors";
export const authLabel = "block text-[11px] uppercase tracking-[0.15em] text-rb-silver mb-2";
