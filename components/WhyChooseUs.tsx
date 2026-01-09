"use client";

import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import Image from "next/image";
import { FaCheckCircle, FaCogs, FaShippingFast } from "react-icons/fa";

const features = [
  {
    icon: <FaCheckCircle className="text-brand-purple text-xl" />,
    title: "Proof-Built, Not Just Assembled",
    desc: "Every Rig Builders system is stress-tested, thermally validated, and documented. You don’t take our word for performance — you see the results."
  },
  {
    icon: <FaCogs className="text-brand-blue text-xl" />,
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
    <section className="relative min-h-[800px] flex items-center bg-[#121212] overflow-hidden">
      
      {/* 1. RIGHT SIDE: FULL HEIGHT IMAGE (Absolute Positioned) */}
      {/* FIX: Added 'opacity-30 lg:opacity-100' to handle mobile transparency requirement */}
      <div className="absolute top-0 right-0 w-full lg:w-[55%] h-full z-0 opacity-30 lg:opacity-100 transition-opacity duration-300 pointer-events-none">
        <Image 
          src="/images/homepage/why us/1.jpg" 
          alt="Rig Builders Craftsmanship" 
          fill 
          className="object-cover object-center"
          priority
        />
        
        {/* The "Merge" Gradient: Fades from solid background (Left) to transparent (Right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/80 to-transparent lg:via-[#121212]/40" />
      </div>

      {/* 2. LEFT SIDE: CONTENT (Aligned to 1440px Grid) */}
      {/* FIX: Added 'pb-24' to ensure content doesn't hit the bottom edge on mobile */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px] w-full relative z-10 pt-20 pb-24 lg:py-0">
        <div className="lg:w-1/2">
          <Reveal>
            <h2 className="font-orbitron text-4xl md:text-5xl text-white mb-10 leading-tight">
              Why Choose <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4E2C8B] to-[#265DAB] font-black text-5xl md:text-7xl">
                RIG BUILDERS?
              </span>
            </h2>

            <StaggerGrid className="space-y-10">
              {features.map((item, index) => (
                <StaggerItem key={index}>
                  <div className="flex gap-6 group">
                    {/* Icon Box */}
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-brand-purple/50 transition-colors duration-300 shadow-lg backdrop-blur-sm">
                      {item.icon}
                    </div>
                    
                    {/* Text */}
                    <div className="relative">
                      <h3 className="font-orbitron text-xl font-bold text-white mb-2 group-hover:text-brand-purple transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-saira text-brand-silver text-base leading-relaxed max-w-md">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </Reveal>
        </div>
      </div>
    </section>
  );
}