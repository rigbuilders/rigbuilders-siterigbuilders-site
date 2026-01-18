"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaPhoneAlt, FaEnvelope, FaClock, FaHeadset, FaVideo, FaShieldAlt, FaTicketAlt, FaWhatsapp, FaClipboardCheck } from "react-icons/fa";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Center", // Becomes: Support Center | Rig Builders India
  description: "Get help with your Rig Builders system. Access drivers, warranty claims, and technical support FAQs.",
};


export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
     
      {/* --- DIRECT CHANNELS (Cinematic Merge Section) --- */}
      <section className="relative min-h-[85vh] flex items-center border-b border-white/5 overflow-hidden">
        
        {/* 1. BACKGROUND IMAGE LAYER (Absolute) */}
        <div className="absolute top-0 left-0 w-full lg:w-[60%] h-full z-0">
            <Image 
                src="/images/Support/1.jpg" 
                alt="Rig Builders Technician"
                fill
                className="object-cover object-center opacity-80" // object-cover ensures it fills the height
                priority
            />
            
            {/* GRADIENT MASKS (To merge edges) */}
            {/* Right Fade: Fades image into black background towards the text */}
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-transparent to-[#121212]" />
            {/* Bottom Fade: Smooth transition to next section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#121212] to-transparent" />
            {/* Top Fade: Smooth transition from header */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#121212] to-transparent" />
            {/* Left Overlay: Slight darkening for image clarity */}
            <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* 2. CONTENT LAYER (Relative z-10) */}
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 items-center relative z-10 h-full">
            
            {/* Left Spacer (Occupied by Image) */}
            <div className="hidden lg:block h-full"></div>

            {/* Right Content */}
            <div className="px-6 md:px-12 lg:px-24 py-20 bg-gradient-to-b from-[#121212]/80 via-[#121212]/50 to-[#121212]/80 lg:bg-none backdrop-blur-sm lg:backdrop-blur-none">
                <Reveal>
                    <span className="text-brand-purple font-bold tracking-[0.2em] text-sm uppercase mb-6 flex items-center gap-3">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" /> 
                        Live Status: Online
                    </span>

                    <h2 className="font-orbitron text-4xl md:text-6xl font-bold text-white mb-10 leading-none">
                        SUPPORT <br/> HOTLINE
                    </h2>

                    <div className="space-y-10">
                        {/* Phone */}
                        <div className="flex items-start gap-6 group">
                            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl text-brand-purple group-hover:bg-brand-purple group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/50">
                                <FaPhoneAlt />
                            </div>
                            <div>
                                <h3 className="font-orbitron text-xl font-bold text-white mb-1 group-hover:text-brand-purple transition-colors">Priority Line</h3>
                                <p className="text-brand-silver text-sm mb-2 opacity-60">Direct access to technical staff.</p>
                                <a href="tel:+917707801014" className="text-3xl font-bold text-white hover:text-brand-purple transition-colors tracking-tight">
                                    +91 77078-01014
                                </a>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-start gap-6 group">
                            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/50">
                                <FaEnvelope />
                            </div>
                            <div>
                                <h3 className="font-orbitron text-xl font-bold text-white mb-1 group-hover:text-brand-blue transition-colors">Digital Desk</h3>
                                <p className="text-brand-silver text-sm mb-2 opacity-60">For logs, invoices, and tickets.</p>
                                <a href="mailto:info@rigbuilders.in" className="text-2xl font-bold text-white hover:text-brand-blue transition-colors tracking-tight">
                                    info@rigbuilders.in
                                </a>
                            </div>
                        </div>

                        {/* Hours */}
                        <div className="flex items-start gap-6 group">
                            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl text-white group-hover:bg-white group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/50">
                                <FaClock />
                            </div>
                            <div>
                                <h3 className="font-orbitron text-xl font-bold text-white mb-1">Operations Window</h3>
                                <p className="text-brand-silver text-sm mb-2 opacity-60">Mon - Sat</p>
                                <p className="text-2xl font-bold text-white tracking-tight">09:00 AM — 07:00 PM</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col sm:flex-row gap-5">
                        <a href="https://wa.me/917707801014?text=Hi" target="_blank" rel="noopener noreferrer" className="px-8 py-5 bg-green-600/10 border border-green-500/30 text-green-500 font-orbitron font-bold text-sm uppercase tracking-widest hover:bg-green-600 hover:text-white hover:border-green-600 transition-all flex items-center justify-center gap-3 rounded-sm">
                            <FaWhatsapp size={20} /> WhatsApp
                        </a>
                        <a 
                            href="mailto:info@rigbuilders.in?subject=Diagnostics%20Request%20-%20[Order%20ID]" 
                            className="px-8 py-5 bg-white/5 border border-white/10 text-white font-orbitron font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center gap-3 rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            <FaClipboardCheck size={20} /> Support Assistance
                        </a>
                    </div>
                </Reveal>
            </div>
        </div>
      </section>

      {/* --- SERVICE PROTOCOLS --- */}
      <section className="py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
            <Reveal>
                <h2 className="font-orbitron text-3xl md:text-4xl mb-16 text-white font-bold text-center">
                    SERVICE <span className="text-brand-purple">PROTOCOLS</span>
                </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 1. Remote Assist */}
                <Reveal delay={0.1}>
                    <div className="p-8 border border-white/5 bg-[#121212] hover:border-brand-purple/50 transition-all duration-300 h-full group">
                        <div className="w-12 h-12 bg-brand-purple/10 rounded-full flex items-center justify-center text-brand-purple text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <FaVideo />
                        </div>
                        <h3 className="text-white font-orbitron font-bold mb-3 text-xl">Remote Ops</h3>
                        <p className="text-sm text-brand-silver/70 leading-relaxed mb-4">
                            Software issue? We don't need the PC back. We use <strong>AnyDesk & Google Meet</strong> to remotely take control, diagnose driver conflicts, and optimize BIOS settings while you watch.
                        </p>
                    </div>
                </Reveal>

                {/* 2. Warranty */}
                <Reveal delay={0.2}>
                    <div className="p-8 border border-white/5 bg-[#121212] hover:border-brand-blue/50 transition-all duration-300 h-full group">
                        <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <FaShieldAlt />
                        </div>
                        <h3 className="text-white font-orbitron font-bold mb-3 text-xl">Double Coverage</h3>
                        <p className="text-sm text-brand-silver/70 leading-relaxed mb-4">
                            <strong>3-Year Service Warranty</strong> (Labor & Diagnostics) + <strong>Manufacturer Warranty</strong> (up to 5-10 years on parts). We handle the RMA logistics for you.
                        </p>
                    </div>
                </Reveal>

                {/* 3. Hardware Support */}
                <Reveal delay={0.3}>
                    <div className="p-8 border border-white/5 bg-[#121212] hover:border-white/50 transition-all duration-300 h-full group">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <FaHeadset />
                        </div>
                        <h3 className="text-white font-orbitron font-bold mb-3 text-xl">Hardware Failure</h3>
                        <p className="text-sm text-brand-silver/70 leading-relaxed mb-4">
                            In the rare event of a hardware failure, we arrange a pickup, replace the dead component, stress-test the system again, and ship it back. Zero stress.
                        </p>
                    </div>
                </Reveal>
            </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}