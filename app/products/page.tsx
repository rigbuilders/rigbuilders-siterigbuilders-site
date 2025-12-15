"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaArrowRight } from "react-icons/fa";

// Updated Data with your specific Image Paths
const categories = [
  { 
    id: "cpu", 
    name: "PROCESSORS", 
    desc: "Intel Core & AMD Ryzen",
    image: "/images/Products/cpu.jpg" 
  },
  { 
    id: "gpu", 
    name: "GRAPHICS CARDS", 
    desc: "NVIDIA RTX & AMD Radeon",
    image: "/images/Products/gpu.jpg" 
  },
  { 
    id: "motherboard", 
    name: "MOTHERBOARDS", 
    desc: "Z790, X670 & B-Series",
    image: "/images/Products/mobo.jpg" 
  },
  { 
    id: "memory", 
    name: "MEMORY", 
    desc: "High-Speed DDR4 & DDR5",
    image: "/images/Products/ram.jpg" 
  },
  { 
    id: "cabinet", 
    name: "PC CABINETS", 
    desc: "Mid-Tower, Full-Tower & ITX",
    image: "/images/Products/pc cabinet.jpg" 
  },
  { 
    id: "storage", 
    name: "STORAGE", 
    desc: "NVMe Gen4 & Gen5 SSDs",
    image: "/images/Products/nvme.jpg" 
  },
  { 
    id: "psu", 
    name: "POWER SUPPLY", 
    desc: "Gold & Platinum Rated Units",
    image: "/images/Products/psu.jpg" 
  },
  { 
    id: "cooler", 
    name: "COOLING", 
    desc: "AIO Liquid & Air Coolers",
    image: "/images/Products/aio.jpg" 
  },
];

export default function ProductHubPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col overflow-hidden">
      
      {/* Cinematic Background Noise/Glow */}
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />

      <Navbar />
      
      {/* HERO SECTION */}
      <section className="pt-16 pb-16 px-6 relative z-10 border-b border-white/5 bg-gradient-to-b from-[#121212] to-[#1A1A1A]">
        <Reveal>
            <div className="max-w-7xl mx-auto text-center">
                <span className="font-saira text-brand-purple font-bold tracking-[0.3em] text-sm uppercase mb-4 block">
                    Premium Hardware
                </span>
                <h1 className="font-orbitron font-black text-5xl md:text-6xl text-white mb-6 tracking-wide drop-shadow-lg">
                    PC <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">COMPONENTS</span>
                </h1>
                <p className="text-brand-silver max-w-2xl mx-auto text-lg leading-relaxed">
                    Browse our curated selection of high-performance parts. From flagship processors to custom liquid cooling, we have everything to build your dream rig.
                </p>
            </div>
        </Reveal>
      </section>

      {/* CATEGORY GRID */}
      <div className="flex-grow max-w-8xl mx-auto px-6 py-20 w-full relative z-10">
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <StaggerItem key={cat.id} className="h-full">
              <Link href={`/products/${cat.id}`} className="group block h-full">
                
                {/* CARD CONTAINER (Full Image Fill) */}
                <div className="relative h-[450px] bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-brand-purple/50 hover:shadow-[0_0_30px_rgba(78,44,139,0.2)] flex flex-col group">
                  
                  {/* 1. BACKGROUND IMAGE (Fills entire card) */}
                  <div className="absolute inset-0 w-full h-full">
                      <div className="relative w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-out">
                         <Image 
                            src={cat.image} 
                            alt={cat.name} 
                            fill 
                            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                         />
                      </div>
                      
                      {/* Gradient Overlay for Text Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />
                  </div>

                  {/* 2. TEXT CONTENT (Overlaid on top) */}
                  <div className="relative h-full flex flex-col justify-end p-8 z-10">
                      <div className="transform group-hover:-translate-y-2 transition-transform duration-500">
                          <h3 className="font-orbitron text-3xl font-bold text-white mb-2 tracking-wide drop-shadow-md">
                              {cat.name}
                          </h3>
                          <p className="text-brand-silver text-sm font-medium opacity-80 group-hover:opacity-100 group-hover:text-white transition-all">
                              {cat.desc}
                          </p>
                      </div>

                      {/* Action Line (Appears on Hover) */}
                      <div className="h-0 group-hover:h-8 overflow-hidden transition-all duration-500">
                          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-purple pt-4">
                              <span>Browse Collection</span>
                              <FaArrowRight />
                          </div>
                      </div>
                  </div>

                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>

      <Footer />
    </div>
  );
}