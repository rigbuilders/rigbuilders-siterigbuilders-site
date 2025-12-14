"use client";

import Link from "next/link";
import Image from "next/image";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";

export default function SignatureEdition() {
  return (
    <section className="relative py-24 bg-[#121212] overflow-hidden border-t border-white/5" id="signature">
      
      {/* 1. CINEMATIC BACKGROUND IMAGE (Premium Custom Build) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <Image 
            // Stable URL: High-end Custom PC with Purple/Blue Lighting
            src="https://images.unsplash.com/photo-1594732168533-b6d8a3a3d537?q=80&w=2070&auto=format&fit=crop" 
            alt="Signature Edition PC Build" 
            fill 
            className="object-cover"
         />
      </div>

      {/* 2. GRADIENT FADE (Matching the WorkPro/Creator Style) */}
      {/* Deep purple tint for the Signature Edition brand */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#4E2C8B]/5 to-[#121212]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/80 via-transparent to-[#121212]/80" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        
        {/* HEADER */}
        <Reveal>
            <span className="font-saira text-brand-purple tracking-[0.2em] uppercase text-sm font-bold">
              The Flagship Experience
            </span>
            <h2 className="text-4xl md:text-6xl font-orbitron font-extrabold text-white mt-4 mb-6">
              COMMISSIONED. <span className="text-brand-purple">Not Assembled.</span>
            </h2>
            <p className="text-brand-silver/70 text-lg font-saira max-w-3xl mx-auto leading-relaxed">
              Our most premium rigs — hand-built, thermally tuned, cable-certified and delivered with complete stress-test proof.
            </p>
        </Reveal>

        {/* FEATURE GRID */}
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left">
          
          {/* Feature 1 */}
          <StaggerItem>
            <div className="p-8 rounded-2xl border border-white/5 hover:border-brand-purple/50 transition duration-300 bg-[#121212]/80 backdrop-blur-sm shadow-xl">
              <span className="text-brand-purple text-xs font-bold tracking-widest uppercase mb-4 block">
                01 · PERFORMANCE PROOF
              </span>
              <h3 className="text-white text-xl font-orbitron font-bold mb-3">
                Certified Benchmarks
              </h3>
              <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
                Before shipment, receive personalized video proof of all stress tests and thermal benchmarks running live on your system.
              </p>
            </div>
          </StaggerItem>

          {/* Feature 2 */}
          <StaggerItem>
            <div className="p-8 rounded-2xl border border-white/5 hover:border-brand-purple/50 transition duration-300 bg-[#121212]/80 backdrop-blur-sm shadow-xl">
              <span className="text-brand-purple text-xs font-bold tracking-widest uppercase mb-4 block">
                02 · Aesthetics
              </span>
            <h3 className="text-white text-xl font-orbitron font-bold mb-3">
              Signature Cable & Lighting
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
              Matte black + deep purple cable theme, tuned RGB profile that turns your rig into an exhibition piece.
            </p>
          </div>
          </StaggerItem>

          {/* Feature 3 */}
          <StaggerItem>
          <div className="p-8 rounded-2xl border border-white/5 hover:border-brand-purple/50 transition duration-300 bg-[#121212]/80 backdrop-blur-sm shadow-xl">
            <span className="text-brand-purple text-xs font-bold tracking-widest uppercase mb-4 block">
              03 · Ownership
            </span>
            <h3 className="text-white text-xl font-orbitron font-bold mb-3">
              Named Build & QR Log
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
              Every Signature rig gets a unique Build ID and physical QR code linked to a gallery of your build process.
            </p>
          </div>
          </StaggerItem>

        </StaggerGrid>

        {/* CTA BUTTON */}
        <div className="mt-16">
          <Link href="/signature">
            <button className="px-10 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white font-orbitron font-bold rounded-full tracking-wider transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(78,44,139,0.7)]">
                VIEW SIGNATURE CONFIGURATIONS
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
}