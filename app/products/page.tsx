"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/MotionWrappers";

// Map of categories to their display details
const categories = [
  { id: "cpu", name: "PROCESSORS", image: "/icons/navbar/products/PC Components 2.png" }, // Using existing icon as placeholder
  { id: "gpu", name: "GRAPHICS CARDS", image: "/icons/navbar/products/PC Components.svg" },
  { id: "motherboard", name: "MOTHERBOARDS", image: "/icons/navbar/products/PC Components 2.png" },
  { id: "memory", name: "MEMORY", image: "/icons/navbar/products/PC Components.svg" }, // Renamed from RAM
  { id: "storage", name: "STORAGE", image: "/icons/navbar/products/PC Components 2.png" },
  { id: "psu", name: "POWER SUPPLY", image: "/icons/navbar/products/PC Components.svg" },
  { id: "cooler", name: "COOLING", image: "/icons/navbar/products/PC Components 2.png" },
  { id: "cabinet", name: "PC CABINETS", image: "/icons/navbar/products/PC Components.svg" },
];

export default function ProductHubPage() {
  return (
    <Reveal>
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* HERO / HEADER */}
      <section className="pt-32 pb-12 px-6 border-b border-white/5 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-bold text-4xl text-white mb-2">
            PC <span className="text-brand-purple">COMPONENTS</span>
          </h1>
          <p className="text-brand-silver">Select a category to browse our premium inventory.</p>
        </div>
      </section>

      {/* CATEGORY GRID */}
      <Reveal>
      <div className="flex-grow max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/products/${cat.id}`} className="group">
              <div className="bg-[#1A1A1A] border border-white/5 h-[400px] flex flex-col items-center p-8 hover:border-brand-purple/50 transition-all relative overflow-hidden">
                
                {/* Title */}
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2 text-center">{cat.name}</h3>
                <div className="w-12 h-1 bg-brand-purple mb-8 group-hover:w-24 transition-all"></div>

                {/* Icon/Image Placeholder */}
                <div className="flex-grow flex items-center justify-center w-full opacity-50 group-hover:opacity-100 transition-opacity">
                   {/* Using text placeholder if image fails, or the actual image if available */}
                   <div className="relative w-32 h-32">
                      <Image 
                        src={cat.image} 
                        alt={cat.name} 
                        fill 
                        className="object-contain"
                      />
                   </div>
                </div>
                

                {/* Fake 'Button' Look */}
                <div className="mt-auto w-full border border-white/30 text-center py-3 text-sm font-orbitron font-bold uppercase tracking-wider group-hover:bg-white group-hover:text-black transition-all">
                  BROWSE {cat.name}
                </div>

              </div>
            </Link>
          ))}
        </div>
      </div>
      </Reveal>

      <Footer />
    </div>
    </Reveal>
  );
}