"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion"; // Assuming you have framer-motion, or use your Reveal wrapper

// DATA CONFIGURATION
const LANDING_DATA: Record<string, any[]> = {
  cpu: [
    {
      id: "intel",
      brand: "Intel",
      title: "CORE PERFORMANCE",
      desc: "Dominate gaming and creation with the latest Intel Core processors.",
      image: "/images/landing/cpu-intel.jpg", // REPLACE THIS
      color: "from-blue-600/80 to-blue-900/80",
      textColor: "text-blue-500",
      link: "/products/cpu?brand=Intel"
    },
    {
      id: "amd",
      brand: "AMD",
      title: "RYZEN POWER",
      desc: "Experience pure multi-threaded performance with AMD Ryzen.",
      image: "/images/landing/cpu-amd.jpg", // REPLACE THIS
      color: "from-red-600/80 to-red-900/80",
      textColor: "text-red-500",
      link: "/products/cpu?brand=AMD"
    }
  ],
  gpu: [
    {
      id: "nvidia",
      brand: "NVIDIA",
      title: "GEFORCE RTX",
      desc: "The ultimate platform for gamers and creators. Ray tracing and AI.",
      image: "/images/landing/gpu-nvidia.jpg", // REPLACE THIS
      color: "from-green-600/80 to-green-900/80",
      textColor: "text-green-500",
      link: "/products/gpu?brand=NVIDIA"
    },
    {
      id: "amd",
      brand: "AMD",
      title: "RADEON RX",
      desc: "Breakthrough performance, visuals, and efficiency at 4K.",
      image: "/images/landing/gpu-amd.jpg", // REPLACE THIS
      color: "from-red-600/80 to-red-900/80",
      textColor: "text-red-500",
      link: "/products/gpu?brand=AMD"
    },
    {
      id: "intel",
      brand: "Intel",
      title: "ARC GRAPHICS",
      desc: "Supercharge your gaming with high-performance Xe HPG microarchitecture.",
      image: "/images/landing/gpu-intel.jpg", // REPLACE THIS
      color: "from-blue-500/80 to-blue-800/80",
      textColor: "text-blue-400",
      link: "/products/gpu?brand=Intel"
    }
  ]
};

export default function CategoryLanding({ category }: { category: string }) {
  const sections = LANDING_DATA[category];

  if (!sections) return null;

  // Grid Cols logic: 2 columns for CPU, 3 columns for GPU
  const gridClass = category === 'gpu' ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <div className={`min-h-screen w-full grid grid-cols-1 ${gridClass}`}>
      {sections.map((section) => (
        <Link 
          key={section.id} 
          href={section.link}
          className="relative group h-[50vh] lg:h-screen overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 last:border-0"
        >
          {/* BACKGROUND IMAGE */}
          <div className="absolute inset-0">
             <Image 
                src={section.image} 
                alt={`${section.brand} ${category.toUpperCase()}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority
             />
             {/* Gradient Overlay (Hidden by default, shows on hover) */}
             <div className={`absolute inset-0 bg-gradient-to-t ${section.color} opacity-60 lg:opacity-0 group-hover:opacity-80 transition-opacity duration-500`} />
             
             {/* Default Dark Overlay for Text Readability */}
             <div className="absolute inset-0 bg-black/40 group-hover:opacity-0 transition-opacity duration-500" />
          </div>

          {/* CONTENT */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
             <h2 className="font-orbitron font-black text-4xl md:text-5xl lg:text-6xl text-white mb-4 drop-shadow-2xl tracking-tighter">
                {section.brand.toUpperCase()}
             </h2>
             
             {/* Text that slides up on hover */}
             <div className="translate-y-4 lg:translate-y-8 opacity-100 lg:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <h3 className={`font-orbitron font-bold text-lg md:text-xl mb-2 tracking-widest ${section.textColor}`}>
                    {section.title}
                </h3>
                <p className="font-saira text-brand-silver text-sm md:text-base max-w-xs mx-auto mb-6 leading-relaxed">
                    {section.desc}
                </p>
                <span className="inline-block border border-white px-6 py-2 font-orbitron font-bold text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors">
                    Explore Collection
                </span>
             </div>
          </div>
        </Link>
      ))}
    </div>
  );
}