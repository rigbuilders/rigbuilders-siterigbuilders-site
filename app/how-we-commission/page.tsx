"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Reveal } from "@/components/ui/MotionWrappers";

// --- DATA: THE 5 COMMISSIONING STEPS ---
const steps = [
  {
    step: "01",
    title: "Order Lock & Build Blueprint",
    subtitle: "Verification of compatibility and parts allocation.",
    description: "Before a single screw is turned, our engineers review your configuration. We verify component synergy, checking RAM clearance, PSU headroom, and thermal targets. Once approved, your specific silicon is allocated and 'Locked' to your order ID.",
    image: "/images/how/blueprint.jpg", 
    orientation: "landscape",
    imagePos: "right"
  },
  {
    step: "02",
    title: "Precision Assembly & Signature Craft",
    subtitle: "Hand-built with symmetrical cabling and airflow focus.",
    description: "This is where science meets art. Our builders don't just plug things in; they route cables along dedicated channels to maximize airflow. Every zip-tie is placed with intention. We apply thermal paste using our proprietary spread method for optimal heat transfer.",
    image: "/images/how/assembly.jpg",
    orientation: "portrait",
    imagePos: "left"
  },
  {
    step: "03",
    title: "Stress Testing & Validation",
    subtitle: "Thermal validation and performance benchmarking.",
    description: "We push the hardware harder than you ever will. Your rig undergoes a 24-hour torture test loop (AIDA64, FurMark, Cinebench) to ensure stability. We map the thermal curves of your specific GPU and CPU to guarantee they perform within safe deltas.",
    image: "", // No image provided -> Will show Digital Blueprint Fallback
    orientation: "landscape",
    imagePos: "right"
  },
  {
    step: "04",
    title: "QC & Proof of Build",
    subtitle: "Final visual inspection and proof-of-build recording.",
    description: "The White Glove test. We inspect the chassis for micro-scratches and fingerprints. Then, we film a 'Proof of Build' sequence—a cinematic verification of your PC posting and booting up, sent directly to you before we seal the box.",
    image: "/images/how/proof.jpg",
    orientation: "portrait",
    imagePos: "left"
  },
  {
    step: "05",
    title: "Secure Packaging & Dispatch",
    subtitle: "Instapak foam protection and insured shipping.",
    description: "Gravity is the enemy. We inject Instapak® expanding foam inside the case, which molds around your GPU and cooler, locking them in stasis. The PC is then double-boxed with impact-resistant corners and shipped with full transit insurance.",
    image: "", // No image provided -> Will show Digital Blueprint Fallback
    orientation: "landscape",
    imagePos: "right"
  }
];

export default function CommissionPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />

      {/* --- HERO HEADER --- */}
      <section className="pt-[65px] pb-20 px-6 border-b border-white/5 bg-[#121212] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-purple/5 blur-[150px] pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Reveal>
            <h1 className="font-orbitron font-bold text-5xl md:text-7xl mb-6 tracking-tighter">
              THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">COMMISSIONING</span>
            </h1>
            <p className="text-brand-silver text-lg max-w-2xl mx-auto font-saira tracking-wide">
              We don&apos;t just assemble parts. We commission machines. 
              Here is the journey your rig takes before it reaches your desk.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- STEPS SECTIONS --- */}
      <div className="flex flex-col">
        {steps.map((item, index) => (
          <section 
            key={item.step} 
            className={`flex flex-col md:flex-row w-full min-h-[80vh] border-b border-white/5 relative overflow-hidden group ${item.imagePos === "left" ? "md:flex-row-reverse" : ""}`}
          >
            
            {/* 1. TEXT HALF */}
            <div className="w-full md:w-1/2 p-12 lg:p-24 flex flex-col justify-center relative bg-[#121212] z-10">
                {/* Background Number Watermark */}
                <span className="absolute top-10 left-10 text-[12rem] font-bold text-white/5 font-orbitron select-none pointer-events-none">
                    {item.step}
                </span>

                <Reveal className="w-full">
                    <div className="relative">
                        <span className="text-brand-purple font-bold tracking-[0.3em] text-sm uppercase mb-4 block">
                            Phase {item.step}
                        </span>
                        <h2 className="font-orbitron text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                            {item.title}
                        </h2>
                        <h3 className="text-xl text-white/80 font-bold mb-6 border-l-2 border-brand-purple pl-4">
                            {item.subtitle}
                        </h3>
                        <p className="text-brand-silver leading-relaxed text-lg">
                            {item.description}
                        </p>
                    </div>
                </Reveal>
            </div>

            {/* 2. IMAGE HALF */}
            <div className="w-full md:w-1/2 relative min-h-[400px] md:min-h-auto overflow-hidden bg-[#0A0A0A]">
                {item.image ? (
                    // IF IMAGE EXISTS
                    <>
                        <div className="absolute inset-0 bg-brand-purple/20 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-700" />
                        <Image 
                            src={item.image} 
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                            // Smart positioning: Center for landscape, slightly higher focus for portrait to avoid cutting heads/details
                            style={{ objectPosition: item.orientation === 'portrait' ? 'center 20%' : 'center' }}
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        {/* Cinematic Shadow Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${item.imagePos === 'right' ? 'from-[#121212] via-transparent' : 'to-[#121212] via-transparent from-transparent'} z-20`} />
                    </>
                ) : (
                    // IF NO IMAGE (FALLBACK DIGITAL BLUEPRINT DESIGN)
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                        {/* Grid Pattern Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
                        
                        <div className="relative z-10 border border-white/10 p-12 bg-black/50 backdrop-blur-sm max-w-md text-center">
                            <div className="text-6xl mb-4 opacity-50">⚙️</div>
                            <h4 className="font-orbitron text-2xl font-bold text-white mb-2">PROTOCOL {item.step}</h4>
                            <p className="text-brand-silver text-sm uppercase tracking-widest">Awaiting Visual Uplink</p>
                        </div>
                    </div>
                )}
            </div>

          </section>
        ))}
      </div>

      {/* CALL TO ACTION */}
      <section className="py-24 px-6 text-center bg-[#1A1A1A] border-t border-white/5">
        <Reveal>
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-6">READY TO COMMISSION YOURS?</h2>
            <p className="text-brand-silver mb-8">Experience the difference of a hand-crafted machine.</p>
            <a href="/configure" className="inline-block bg-white text-black px-10 py-4 font-orbitron font-bold uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Start Configuration
            </a>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}