"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-[#121212] border-b border-[#1A1A1A] px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        
        {/* 1. BRAND LOGO (Left) */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full 'bg-gradient-to-br' from-[#4E2C8B] to-[#265DAB] flex items-center justify-center text-white font-bold shadow-md font-orbitron">
            rb
          </div>
          <span className="text-sm uppercase tracking-wide text-[#D0D0D0] font-saira font-bold">
            Rig Builders
          </span>
        </Link>

        {/* 2. DESKTOP MENU (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-saira font-medium">
            <Link href="/ascend" className="text-[#D0D0D0]/70 hover:text-[#4E2C8B] transition-colors">ASCEND</Link>
            <Link href="/creator" className="text-[#D0D0D0]/70 hover:text-[#265DAB] transition-colors">CREATOR</Link>
            <Link href="/workpro" className="text-[#D0D0D0]/70 hover:text-white transition-colors">WORKPRO</Link>
            <Link href="/signature" className="text-[#D0D0D0]/70 hover:text-[#4E2C8B] transition-colors">SIGNATURE</Link>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-white/10"></div>

            <Link href="/signin" className="text-white hover:text-[#4E2C8B] transition-colors font-bold">
              LOGIN
            </Link>

            <Link href="/configure">
              <button className="px-4 py-2 rounded-full bg-[#4E2C8B] text-white text-xs uppercase tracking-wide font-bold hover:bg-white hover:text-black transition-colors shadow-[0_0_15px_rgba(78,44,139,0.4)]">
                Commission a Rig
              </button>
            </Link>
        </div>

        {/* 3. MOBILE HAMBURGER ICON (Visible ONLY on Mobile) */}
        <button 
          className="md:hidden text-white text-2xl"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>

      </div>

      {/* 4. MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden pt-4 pb-4 border-t border-white/5 mt-4 space-y-4 font-saira animate-in slide-in-from-top-2">
          <Link href="/ascend" className="block text-[#D0D0D0] hover:text-[#4E2C8B] py-2">ASCEND</Link>
          <Link href="/creator" className="block text-[#D0D0D0] hover:text-[#265DAB] py-2">CREATOR</Link>
          <Link href="/workpro" className="block text-[#D0D0D0] hover:text-white py-2">WORKPRO</Link>
          <Link href="/signature" className="block text-[#D0D0D0] hover:text-[#4E2C8B] py-2">SIGNATURE</Link>
          <hr className="border-white/10 my-2"/>
          <Link href="/signin" className="block text-white font-bold py-2">LOGIN</Link>
          <Link href="/configure" className="block w-full">
            <button className="w-full mt-2 px-4 py-3 rounded-lg bg-[#4E2C8B] text-white text-sm uppercase font-bold">
              Commission a Rig
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}