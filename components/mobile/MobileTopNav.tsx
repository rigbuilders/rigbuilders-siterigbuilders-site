"use client";

import Image from "next/image";
import Link from "next/link";
import { FaBars, FaSearch } from "react-icons/fa";

interface Props {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}

export default function MobileTopNav({ onOpenMenu, onOpenSearch }: Props) {
  return (
    <nav className="fixed top-4 left-4 right-4 z-40 bg-[#090909]/70 backdrop-blur-xl border border-white/10 rounded-2xl h-[60px] flex items-center justify-between px-5 shadow-2xl">
      
      {/* HAMBURGER */}
      <button onClick={onOpenMenu} className="text-white text-xl p-1 active:scale-90 transition-transform">
        <FaBars />
      </button>

      {/* CENTER LOGO */}
      <Link href="/m" className="relative h-8 w-8 flex items-center justify-center">
        <Image 
          src="/icons/icon-dark.png" 
          alt="Rig Builders" 
          fill 
          className="object-contain" 
          priority 
        />
      </Link>

      {/* SEARCH */}
      <button onClick={onOpenSearch} className="text-white text-xl p-1 active:scale-90 transition-transform">
        <FaSearch />
      </button>

    </nav>
  );
}