"use client";

import Image from "next/image";
import { FaCheckCircle, FaCogs, FaTruck } from "react-icons/fa";

const features = [
  {
    icon: <FaCheckCircle className="text-[#B084FF] text-xl" />,
    title: "Proof-Built, Not Just Assembled",
    desc: "Every Rig Builders system is stress-tested, thermally validated, and documented. You don't take our word for performance — you see the results."
  },
  {
    icon: <FaCogs className="text-[#265DAB] text-xl" />,
    title: "Engineered Craftsmanship",
    desc: "From component harmony to symmetrical cable routing and airflow design, each rig is built like a machine should be — precise, clean, and intentional."
  },
  {
    icon: <FaTruck className="text-white text-xl" />,
    title: "Delivery Without Compromise",
    desc: "Your rig is shock-protected, foam-packed, and quality-checked so it arrives exactly as it left our bench — flawless and ready to perform."
  }
];

export default function MobileWhyChooseUs() {
  return (
    <div className="w-full relative py-12 px-[30px] border-t border-white/5 overflow-hidden">
      
      {/* Background Image with 10% opacity */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/homepage/why us/1.jpg" alt="Craftsmanship" fill className="object-cover opacity-5 grayscale" />
        {/* Blending Gradients */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#121212] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#121212] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h2 className="font-saira font-bold text-white text-lg leading-tight">Why Choose</h2>
        <h2 className="font-orbitron font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue mb-10">
          RIG BUILDERS <span className="text-white">?</span>
        </h2>

        <div className="flex flex-col gap-8">
            {features.map((feature, i) => (
                <div key={i} className="flex gap-5 items-start">
                    {/* Icon Box */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-brand-purple/20 bg-[#1A1A1A]/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(78,44,139,0.15)]">
                        {feature.icon}
                    </div>
                    {/* Text */}
                    <div>
                        <h4 className="font-orbitron font-bold text-white text-sm mb-1">{feature.title}</h4>
                        <p className="font-saira text-brand-silver text-[11px] leading-relaxed">
                            {feature.desc}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
}