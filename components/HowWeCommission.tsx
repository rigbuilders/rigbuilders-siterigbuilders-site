"use client";

import Link from "next/link";
import Image from "next/image";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";

const steps = [
  {
    id: "01",
    title: "Order Lock & Build Blueprint",
    desc: "Verification of compatibility and parts allocation."
  },
  {
    id: "02",
    title: "Precision Assembly & Signature Craft",
    desc: "Hand-built with symmetrical cabling and airflow focus."
  },
  {
    id: "03",
    title: "Stress Testing & Performance Validation",
    desc: "Thermal validation and performance benchmarking."
  },
  {
    id: "04",
    title: "Quality Control & Proof of Build",
    desc: "Final visual inspection and proof-of-build recording."
  },
  {
    id: "05",
    title: "Secure Packaging & Premium Dispatch",
    desc: "Instapak foam protection and insured shipping."
  }
];

export default function HowWeCommission() {
  return (
    <section className="relative py-24 bg-rb-surface overflow-hidden border-t border-rb-line">
      
      {/* 1. BACKGROUND IMAGE - Raw & Unaltered */}
      <div className="absolute inset-0">
         <Image 
            src="/images/homepage/how we commission/1.png" 
            alt="Rig Building Process" 
            fill 
            className="object-cover" // Fills the section without altering colors/opacity
            quality={50} // Ensures maximum sharpness
            priority
         />
      </div>

      {/* REMOVED: All Gradient Overlays */}

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        
        {/* HEADLINE */}
        <Reveal className="mb-12 md:mb-20 flex flex-col items-center justify-center">
            {/* Mobile: w-full & text-center | Desktop: w-fit & text-left */}
            <div className="w-full text-center md:w-fit md:text-left">
                <span className="block font-saira text-white text-[20px] md:text-[25px] leading-none mb-2 md:ml-1">
                    How do we
                </span>
                <h2 className="font-orbitron text-white leading-none">
                    <span className="text-[32px] md:text-[50px] font-bold tracking-wide block md:inline">COMMISSION</span>
                    {/* Mobile: Block (new line) & No Margin | Desktop: Inline & Left Margin */}
                    <span className="font-saira text-[20px] md:text-[25px] block md:inline md:ml-3 font-normal mt-1 md:mt-0">your RIG?</span>
                </h2>
            </div>
        </Reveal>

        {/* 5 STEPS (Eclipse Shapes) */}
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16 relative">
          
          {/* Connector Line (Desktop Only) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-rb-orange/50 to-transparent z-0" />

          {steps.map((step) => (
            <StaggerItem key={step.id} className="relative z-10 flex flex-col items-center group">
              
              {/* Circle Shape */}
              {/* Added bg-black/40 backdrop-blur to ensure text is readable even if image is bright behind it */}
              <div className="w-24 h-24 rounded-full bg-rb-surface/80 border border-rb-line group-hover:border-rb-orange group-hover:shadow-[0_0_20px_rgba(255,90,31,0.5)] transition-all duration-300 flex items-center justify-center mb-6 backdrop-blur-md">
                <span className="font-orbitron text-2xl font-bold text-white group-hover:text-rb-orange transition-colors">
                    {step.id}
                </span>
              </div>

              {/* Text Content */}
              <h3 className="font-orbitron text-sm font-bold text-white mb-2 uppercase tracking-wide min-h-[40px] flex items-center justify-center text-center drop-shadow-md">
                {step.title}
              </h3>
              
              {/* Divider Line */}
              <div className="w-12 h-[2px] bg-rb-orange/60 mb-3 group-hover:w-full transition-all duration-500" />

              <p className="font-saira text-rb-silver text-xs leading-relaxed max-w-[150px] drop-shadow-md">
                {step.desc}
              </p>

            </StaggerItem>
          ))}
        </StaggerGrid>

        {/* LEARN MORE BUTTON */}
        <Reveal delay={0.4}>
            <Link href="/how-we-commission">
                <button className="rb-sheen px-10 py-4 bg-black/40 backdrop-blur-sm border border-white/30 hover:border-rb-orange text-white hover:text-rb-orange font-orbitron font-bold text-sm tracking-widest uppercase transition-all hover:bg-white/5 rounded-sm">
                    Learn More
                </button>
            </Link>
        </Reveal>

      </div>
    </section>
  );
}