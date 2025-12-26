"use client";

import Link from "next/link";
import Image from "next/image";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaFingerprint, FaThermometerHalf, FaBoxOpen } from "react-icons/fa";

export default function SignatureEdition() {
  return (
    <section className="relative py-32 bg-[#080808] overflow-hidden border-t border-white/5" id="signature">
      
      {/* Background: Subtle Luxury */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
         <Image 
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
            alt="Signature Tech" 
            fill 
            className="object-cover"
         />
      </div>
      
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-[#080808]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808]" />

      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px] relative z-10 text-center">
        
        {/* HEADER */}
        <Reveal>
            <span className="font-saira text-brand-white tracking-[0.3em] uppercase text-xs font-bold mb-4 block">
              The Flagship Experience
            </span>
            <h2 className="text-4xl md:text-6xl font-orbitron font-black text-white mb-6 uppercase">
              COMMISSIONED. <span className="text-brand-purple">Not Assembled.</span>
            </h2>
            <p className="text-brand-silver text-lg max-w-2xl mx-auto leading-relaxed mb-16">
              The Signature Edition is for those who want more than a PC. 
              Hand-tuned thermal curves, custom cable management, and a personalized build log.
            </p>
        </Reveal>

        {/* FEATURE GRID */}
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          
          <StaggerItem>
            <div className="p-8 border-l-2 border-brand-purple bg-[#121212]/50 backdrop-blur-sm hover:bg-[#121212] transition-colors h-full">
              <FaFingerprint className="text-3xl text-brand-purple mb-6" />
              <h3 className="text-white text-xl font-orbitron font-bold mb-3 uppercase">
                Unique Build ID
              </h3>
              <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
                Every Signature rig gets a unique ID and physical QR code linked to a digital gallery of your specific build process.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="p-8 border-l-2 border-[#D4AF37] bg-[#121212]/50 backdrop-blur-sm hover:bg-[#121212] transition-colors h-full">
              <FaThermometerHalf className="text-3xl text-[#D4AF37] mb-6" />
              <h3 className="text-white text-xl font-orbitron font-bold mb-3 uppercase">
                Thermal Tuning
              </h3>
              <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
                We don't just install fans. We tune curves for acoustics and airflow. Certified stress tests included.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="p-8 border-l-2 border-brand-purple bg-[#121212]/50 backdrop-blur-sm hover:bg-[#121212] transition-colors h-full">
              <FaBoxOpen className="text-3xl text-brand-purple mb-6" />
              <h3 className="text-white text-xl font-orbitron font-bold mb-3 uppercase">
                White Glove Unboxing
              </h3>
              <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
                Premium packaging, custom accessories box, and a signed certificate of authenticity from your builder.
              </p>
            </div>
          </StaggerItem>

        </StaggerGrid>

        {/* CTA */}
        <div className="mt-20">
          <Link href="/signature">
            <button className="group relative px-10 py-4 overflow-hidden rounded-full bg-transparent border border-white/20 text-white font-orbitron font-bold tracking-widest uppercase hover:border-brand-purple transition-colors">
                <span className="relative z-10 group-hover:text-brand-purple transition-colors">Start Your Commission</span>
                <div className="absolute inset-0 bg-white/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
}