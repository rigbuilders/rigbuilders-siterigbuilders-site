"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

// Defined categories based on your image
const accessoryCategories = [
  { id: "monitor", name: "DISPLAYS", image: "/icons/navbar/products/PC Components 2.png" }, // Replace with specific icons if available
  { id: "keyboard", name: "KEYBOARDS", image: "/icons/navbar/products/PC Components.svg" },
  { id: "mouse", name: "MOUSE", image: "/icons/navbar/products/PC Components 2.png" },
  { id: "combo", name: "KEYBOARD MOUSE COMBOS", image: "/icons/navbar/products/PC Components.svg" },
  { id: "mousepad", name: "MOUSE PADS", image: "/icons/navbar/products/PC Components 2.png" },
  { id: "usb", name: "USB DRIVES", image: "/icons/navbar/products/PC Components.svg" },
];

export default function AccessoriesPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="pt-32 pb-12 px-6 border-b border-white/5 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-bold text-4xl text-white mb-2">
            GAMING <span className="text-brand-purple">ACCESSORIES</span>
          </h1>
          <p className="text-brand-silver">Complete your battle station with premium peripherals.</p>
        </div>
      </section>

      {/* ACCESSORY GRID */}
      <div className="flex-grow max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {accessoryCategories.map((cat) => (
            <Link key={cat.id} href={`/products/${cat.id}`} className="group">
              <div className="bg-[#1A1A1A] border border-white/5 h-[350px] flex flex-col items-center p-8 hover:border-brand-purple/50 transition-all relative overflow-hidden rounded-xl">
                
                {/* Title */}
                <h3 className="font-orbitron text-xl font-bold text-white mb-2 text-center">{cat.name}</h3>
                <div className="w-12 h-1 bg-brand-purple mb-8 group-hover:w-24 transition-all"></div>

                {/* Icon/Image Placeholder */}
                <div className="flex-grow flex items-center justify-center w-full opacity-50 group-hover:opacity-100 transition-opacity">
                   <div className="relative w-24 h-24">
                      {/* You can replace these paths with specific accessory icons later */}
                      <Image 
                        src={cat.image} 
                        alt={cat.name} 
                        fill 
                        className="object-contain"
                      />
                   </div>
                </div>

                {/* Fake 'Button' Look */}
                <div className="mt-auto w-full border border-white/30 text-center py-3 text-xs font-orbitron font-bold uppercase tracking-wider group-hover:bg-white group-hover:text-black transition-all rounded">
                  BROWSE COLLECTION
                </div>

              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}