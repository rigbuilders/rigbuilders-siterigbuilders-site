"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-brand-black/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold shadow-md font-orbitron">
            rb
          </div>
          <span className="text-sm uppercase tracking-wide text-brand-text font-saira font-bold">
            Rig Builders
          </span>
        </Link>

        {/* DESKTOP MENU (Mega Menu Style) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-saira font-medium h-full">
            
            {/* 1. DESKTOPS DROPDOWN */}
            <div className="group relative h-full flex items-center">
                <button className="text-brand-silver hover:text-white transition-colors flex items-center gap-1">
                    DESKTOPS <span className="text-[10px]">▼</span>
                </button>
                {/* Dropdown Panel */}
                <div className="absolute top-full left-0 w-64 bg-brand-charcoal border border-white/10 rounded-b-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                    <Link href="/ascend" className="block px-6 py-4 hover:bg-white/5 border-b border-white/5">
                        <span className="text-brand-purple font-bold block text-xs tracking-wider">GAMING</span>
                        <span className="text-white font-orbitron">Ascend Series</span>
                    </Link>
                    <Link href="/creator" className="block px-6 py-4 hover:bg-white/5 border-b border-white/5">
                        <span className="text-brand-blue font-bold block text-xs tracking-wider">CREATION</span>
                        <span className="text-white font-orbitron">Creator Series</span>
                    </Link>
                    <Link href="/workpro" className="block px-6 py-4 hover:bg-white/5 border-b border-white/5">
                        <span className="text-white font-bold block text-xs tracking-wider">WORKSTATION</span>
                        <span className="text-white font-orbitron">WorkPro Series</span>
                    </Link>
                    <Link href="/signature" className="block px-6 py-4 hover:bg-white/5">
                        <span className="text-brand-burgundy font-bold block text-xs tracking-wider">FLAGSHIP</span>
                        <span className="text-white font-orbitron">Signature Edition</span>
                    </Link>
                </div>
            </div>

            {/* 2. PRODUCTS DROPDOWN */}
            <div className="group relative h-full flex items-center">
                <Link href="/products" className="text-brand-silver hover:text-white transition-colors flex items-center gap-1">
                    PRODUCTS <span className="text-[10px]">▼</span>
                </Link>
                {/* Dropdown Panel */}
                <div className="absolute top-full left-0 w-48 bg-brand-charcoal border border-white/10 rounded-b-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 overflow-hidden flex flex-col">
                    <Link href="/products?category=cpu" className="px-6 py-3 hover:bg-white/5 text-brand-silver hover:text-white border-b border-white/5">Processors</Link>
                    <Link href="/products?category=gpu" className="px-6 py-3 hover:bg-white/5 text-brand-silver hover:text-white border-b border-white/5">Graphics Cards</Link>
                    <Link href="/products?category=motherboard" className="px-6 py-3 hover:bg-white/5 text-brand-silver hover:text-white border-b border-white/5">Motherboards</Link>
                    <Link href="/products?category=cabinet" className="px-6 py-3 hover:bg-white/5 text-brand-silver hover:text-white border-b border-white/5">Cases</Link>
                    <Link href="/products" className="px-6 py-3 bg-brand-black/50 text-brand-purple text-xs font-bold text-center hover:bg-brand-purple hover:text-white transition-colors">VIEW ALL</Link>
                </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-white/10"></div>

            <Link href="/signin" className="text-white hover:text-brand-purple transition-colors font-bold">
              LOGIN
            </Link>

            <Link href="/configure">
              <button className="px-6 py-2 rounded-full bg-brand-purple text-white text-xs uppercase tracking-wide font-bold hover:bg-white hover:text-black transition-colors shadow-[0_0_15px_rgba(78,44,139,0.4)]">
                Commission a Rig
              </button>
            </Link>
        </div>

        {/* MOBILE HAMBURGER */}
        <button className="md:hidden text-white text-2xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>

      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-black border-t border-white/10 absolute top-20 left-0 w-full p-6 space-y-4 font-saira shadow-2xl h-screen overflow-y-auto">
          <div className="space-y-2">
            <p className="text-brand-silver/50 text-xs font-bold uppercase tracking-widest mb-2">Desktops</p>
            <Link href="/ascend" className="block text-white pl-4 border-l-2 border-brand-purple py-1">Ascend (Gaming)</Link>
            <Link href="/creator" className="block text-white pl-4 border-l-2 border-brand-blue py-1">Creator (Editing)</Link>
            <Link href="/workpro" className="block text-white pl-4 border-l-2 border-white py-1">WorkPro (Station)</Link>
            <Link href="/signature" className="block text-white pl-4 border-l-2 border-brand-burgundy py-1">Signature Edition</Link>
          </div>
          
          <div className="space-y-2 pt-4 border-t border-white/10">
            <p className="text-brand-silver/50 text-xs font-bold uppercase tracking-widest mb-2">Components</p>
            <Link href="/products" className="block text-white hover:text-brand-purple">View All Products</Link>
            <Link href="/products?category=cpu" className="block text-brand-silver text-sm pl-4">Processors</Link>
            <Link href="/products?category=gpu" className="block text-brand-silver text-sm pl-4">Graphics Cards</Link>
          </div>

          <div className="pt-6 border-t border-white/10">
            <Link href="/signin" className="block text-center text-white font-bold py-3 mb-2 border border-white/10 rounded">LOGIN</Link>
            <Link href="/configure" className="block w-full">
                <button className="w-full px-4 py-4 rounded bg-brand-purple text-white text-sm uppercase font-bold">
                Commission a Rig
                </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}