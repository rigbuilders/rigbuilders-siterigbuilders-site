"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <nav 
      className="fixed top-0 left-0 w-full z-50 bg-[#121212] border-b border-white/10 font-orbitron"
      onMouseLeave={() => setActiveMenu(null)}
    >
      {/* MAIN BAR - Height 80px, Side Margins 100px */}
      <div className="h-[80px] mx-[100px] flex items-center justify-between">
        
        {/* 1. LEFT: LOGO */}
        <Link href="/" className="flex-shrink-0 flex items-center">
           <div className="relative h-10 w-40"> {/* Adjust width based on actual logo aspect ratio */}
             <Image 
               src="/icons/navbar/logo.png" 
               alt="Rig Builders" 
               fill
               className="object-contain object-left"
               priority
             />
           </div>
        </Link>

        {/* 2. CENTER: NAVIGATION LINKS (Orbitron, 18px) */}
        <div className="hidden md:flex items-center h-full gap-12 text-[18px] tracking-wide text-white">
          
          {/* PRODUCTS (Trigger for Mega Menu) */}
          <div 
            className="h-full flex items-center relative group cursor-pointer"
            onMouseEnter={() => setActiveMenu("products")}
          >
            <span className="relative py-2">
              PRODUCTS
              {/* Hover Underline Animation */}
              <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-white transition-transform duration-300 origin-left ${activeMenu === "products" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </span>
          </div>

          <Link href="/ascend" className="h-full flex items-center relative group">
            <span className="relative py-2">
              DESKTOPS
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"></span>
            </span>
          </Link>

          <Link href="/accessories" className="h-full flex items-center relative group">
            <span className="relative py-2">
              ACCESSORIES
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"></span>
            </span>
          </Link>

          <Link href="/support" className="h-full flex items-center relative group">
            <span className="relative py-2">
              SUPPORT
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"></span>
            </span>
          </Link>
        </div>

        {/* 3. RIGHT: ICONS & CTA */}
        <div className="flex items-center gap-8">
          
          {/* Icons Group */}
          <div className="flex items-center gap-6">
            <button className="hover:opacity-80 transition-opacity flex items-center justify-center">
              <Image src="/icons/navbar/cart.png" alt="Cart" width={32} height={32} />
            </button>
            <button className="hover:opacity-80 transition-opacity flex items-center justify-center">
              <Image src="/icons/navbar/User Account.svg" alt="Account" width={28} height={28} />
            </button>
            <button className="hover:opacity-80 transition-opacity flex items-center justify-center">
              <Image src="/icons/navbar/search.svg" alt="Search" width={30} height={30} />
            </button>
          </div>

          {/* CTA Button: Outline Style */}
          <Link href="/configure">
            <button className="border border-white text-white px-8 py-2 text-[14px] font-bold tracking-wider hover:bg-white hover:text-brand-black transition-all uppercase">
              BUILD YOURS
            </button>
          </Link>
        </div>
      </div>

      {/* --- MEGA MENU OVERLAY (Products) --- */}
      <div 
        className={`absolute top-[80px] left-0 w-full bg-[#121212]/90 backdrop-blur-md border-t border-white/10 transition-all duration-300 overflow-hidden ${
          activeMenu === "products" ? "opacity-100 visible max-h-[600px]" : "opacity-0 invisible max-h-0"
        }`}
        onMouseEnter={() => setActiveMenu("products")}
        onMouseLeave={() => setActiveMenu(null)}
      >
        {/* Content Container - Margins 312px */}
        <div className="mx-[312px] py-12 grid grid-cols-4 gap-8 text-white">
          
          {/* COL 1: PC COMPONENTS */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
               {/* Left Icon */}
               <Image src="/icons/navbar/products/PC Components 2.png" alt="Chip Icon" width={32} height={32} className="object-contain"/>
               {/* Right Icon */}
               <Image src="/icons/navbar/products/PC Components.svg" alt="Fan Icon" width={32} height={32} className="object-contain"/>
            </div>
            <h3 className="font-orbitron text-lg font-bold text-white mb-2">PC Components</h3>
            <ul className="space-y-3 text-sm font-saira text-brand-silver">
              <li><Link href="/products?category=cpu" className="hover:text-white transition-colors">Processors</Link></li>
              <li><Link href="/products?category=gpu" className="hover:text-white transition-colors">Graphics Card</Link></li>
              <li><Link href="/products?category=motherboard" className="hover:text-white transition-colors">Motherboards</Link></li>
              <li><Link href="/products?category=storage" className="hover:text-white transition-colors">Storage</Link></li>
              <li><Link href="/products?category=psu" className="hover:text-white transition-colors">Power Supply</Link></li>
              <li><Link href="/products?category=ram" className="hover:text-white transition-colors">RAM</Link></li>
              <li><Link href="/products?category=cabinet" className="hover:text-white transition-colors">PC Cabinets</Link></li>
              <li><Link href="/products?category=cooler" className="hover:text-white transition-colors">Air/Liquid Cooler</Link></li>
            </ul>
          </div>

          {/* COL 2: DESKTOPS */}
          <div className="space-y-6">
            <div className="mb-4 h-[32px] flex items-center">
               <Image src="/icons/navbar/products/Desktops.png" alt="Desktops" width={32} height={32} className="object-contain"/>
            </div>
            <h3 className="font-orbitron text-lg font-bold text-white mb-2">Desktops</h3>
            <ul className="space-y-3 text-sm font-saira text-brand-silver">
              <li><Link href="/ascend" className="hover:text-white transition-colors">Ascend Series</Link></li>
              <li><Link href="/workpro" className="hover:text-white transition-colors">WorkPro Series</Link></li>
              <li><Link href="/creator" className="hover:text-white transition-colors">Creator Series</Link></li>
              <li><Link href="/signature" className="hover:text-white transition-colors">Signature Series</Link></li>
            </ul>
          </div>

          {/* COL 3: ACCESSORIES */}
          <div className="space-y-6">
            <div className="mb-4 h-[32px] flex items-center">
               <Image src="/icons/navbar/products/Accessories.png" alt="Accessories" width={32} height={32} className="object-contain"/>
            </div>
            <h3 className="font-orbitron text-lg font-bold text-white mb-2">Accessories</h3>
            <ul className="space-y-3 text-sm font-saira text-brand-silver">
              <li><Link href="/accessories" className="hover:text-white transition-colors">Displays</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Keyboards</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Mouse</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Keyboard Mouse Combos</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Mouse pads</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">USB Drives</Link></li>
            </ul>
          </div>

          {/* COL 4: SEARCH & QUICK LINKS */}
          <div className="space-y-8 pl-8 border-l border-white/10">
            
            {/* Search Bar */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Image src="/icons/navbar/search.svg" alt="Search" width={16} height={16} />
                </div>
                <input 
                    type="text" 
                    placeholder="search rigbuilders.in" 
                    className="w-full bg-transparent border border-white text-white placeholder-brand-silver/70 px-4 py-2 pl-10 text-sm focus:outline-none focus:bg-white/5 transition-colors font-saira"
                />
            </div>

            {/* Quick Links */}
            <div>
                <h3 className="font-orbitron text-lg font-bold text-white mb-4">Quick Links :</h3>
                <ul className="space-y-2 text-sm font-saira text-brand-silver">
                    <li><Link href="/ascend" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Ascend Series</Link></li>
                    <li><Link href="/products?category=cpu" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Processors</Link></li>
                    <li><Link href="/products?category=gpu" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Graphics Cards</Link></li>
                    <li><Link href="/accessories" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Keyboard Mouse Combos</Link></li>
                    <li><Link href="/workpro" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> WorkPro Series</Link></li>
                    <li><Link href="/accessories" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Displays</Link></li>
                </ul>
            </div>

          </div>

        </div>
      </div>
    </nav>
  );
}