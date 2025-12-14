"use client";

import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";
import { FaCheckCircle, FaCogs, FaShippingFast } from "react-icons/fa"; // Icons for visual hierarchy

const features = [
  {
    icon: <FaCheckCircle className="text-brand-purple text-xl" />,
    title: "Proof-Built, Not Just Assembled",
    desc: "Every Rig Builders system is stress-tested, thermally validated, and documented. You don’t take our word for performance — you see the results."
  },
  {
    icon: <FaCogs className="text-brand-blue text-xl" />, // Using Blue to mix the palette
    title: "Engineered Craftsmanship",
    desc: "From component harmony to symmetrical cable routing and airflow design, each rig is built like a machine should be — precise, clean, and intentional."
  },
  {
    icon: <FaShippingFast className="text-white text-xl" />,
    title: "Delivery Without Compromise",
    desc: "Your rig is shock-protected, foam-packed, and quality-checked so it arrives exactly as it left our bench — flawless and ready to perform."
  }
];

export default function WhyChooseUs() {
  return (
    <section className="relative py-24 bg-[#121212] overflow-hidden border-t border-white/5">
      
      {/* 1. Ambient Background Glows */}
      <div className="rb-hero-glow opacity-20 -left-[20%]" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT: CONTENT & TEXT */}
          <div>
            <Reveal>
              
              
              <h2 className="font-orbitron text-4xl md:text-5xl text-white mb-10 leading-tight">
                Why Choose <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4E2C8B] to-[#265DAB] font-black text-5xl md:text-7xl">
                  RIG BUILDERS?
                </span>
              </h2>

              <StaggerGrid className="space-y-8">
                {features.map((item, index) => (
                  <StaggerItem key={index}>
                    <div className="flex gap-6 group">
                      {/* Icon Box */}
                      <div className="shrink-0 w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-brand-purple/50 transition-colors duration-300 shadow-lg">
                        {item.icon}
                      </div>
                      
                      {/* Text */}
                      <div>
                        <h3 className="font-orbitron text-xl font-bold text-white mb-2 group-hover:text-brand-purple transition-colors">
                          {item.title}
                        </h3>
                        <p className="font-saira text-brand-silver text-base leading-relaxed max-w-lg">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </Reveal>
          </div>

          {/* RIGHT: CINEMATIC IMAGE */}
          <div className="relative h-[600px] w-full hidden lg:block">
            <Reveal delay={0.2} className="h-full w-full relative">
               
               {/* Image Container with Border */}
               <div className="absolute inset-0 rounded-2xl border border-white/10 overflow-hidden bg-[#1A1A1A]">
                  <Image 
                    src="/images/homepage/why us/1.jpg" 
                    alt="Rig Builders Craftsmanship" 
                    fill 
                    className="object-cover object-center opacity-100"
                    priority
                  />
                  
                  {/* Cinematic Gradient Overlays (The "Fade" Effect) */}
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#121212]/20 to-[#121212]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
               </div>

               {/* Decorative Element */}
               <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#4E2C8B] to-[#265DAB] blur-3xl opacity-40" />
            
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}