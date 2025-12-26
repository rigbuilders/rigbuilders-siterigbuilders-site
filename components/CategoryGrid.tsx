"use client";

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

// Data Configuration matches your requested images and paths
const categories = [
  { 
    title: "GRAPHICS CARDS", 
    id: "gpu", 
    image: "/images/Products/gpu.jpg", 
    span: "md:col-span-2", // Landscape
    position: "object-center"
  },
  { 
    title: "PROCESSORS", 
    id: "cpu", 
    image: "/images/Products/cpu.jpg", 
    span: "md:col-span-1", // Square
    position: "object-center"
  },
  { 
    title: "STORAGE", 
    id: "storage", 
    image: "/images/Products/nvme.jpg", 
    span: "md:col-span-1", // Square
    position: "object-center"
  },
  { 
    title: "DISPLAYS", 
    id: "monitor", 
    image: "/images/Accessories/monitor.jpg", 
    span: "md:col-span-2", // Landscape
    position: "center"
  }
];

export default function CategoryGrid() {
  return (
    <section className="bg-[#121212] py-10 relative z-10 border-t border-white/5">
      {/* Container aligned to Navbar: 30px padding at 1440px */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px]">
        
        {/* Section Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-brand-white font-bold tracking-[0.2em] text-xs uppercase block mb-2">
              Hardware
            </span>
            <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-white uppercase">
              Shop By Category
            </h2>
          </div>
          <Link href="/products/" className="hidden md:flex items-center gap-2 text-brand-silver hover:text-white transition-colors text-sm uppercase tracking-widest">
            View All <FaArrowRight />
          </Link>
        </div>

        {/* Cinematic Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[800px]">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/products/${cat.id}`}
              className={`group relative overflow-hidden rounded-sm border border-white/5 bg-[#0a0a0a] ${cat.span} h-[300px] md:h-auto`}
            >
              {/* Background Image with Zoom Effect */}
              <div 
                className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                style={{ 
                  backgroundImage: `url('${cat.image}')`,
                  backgroundPosition: cat.position 
                }}
              />
              
              {/* Cinematic Overlay (Dark gradient from bottom) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col items-start">
                <div className="overflow-hidden">
                  <h3 className="font-orbitron font-bold text-2xl md:text-4xl text-white uppercase translate-y-0 transition-transform duration-300">
                    {cat.title}
                  </h3>
                </div>
                
                {/* Animated Line & Link */}
                <div className="flex items-center gap-3 mt-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75">
                  <div className="h-[2px] w-12 bg-brand-purple" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                    Explore
                  </span>
                </div>
              </div>

              {/* Hover Border Glow */}
              <div className="absolute inset-0 border border-white/0 group-hover:border-brand-purple/50 transition-colors duration-300 pointer-events-none" />
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}