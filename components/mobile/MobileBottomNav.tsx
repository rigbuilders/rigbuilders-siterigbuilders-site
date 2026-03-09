"use client";

import Image from "next/image";
import Link from "next/link";

export default function MobileBottomNav() {
  return (
    // 'absolute' binds it to the bottom of the Virtual Phone frame
    <div className="absolute bottom-0 left-0 w-full z-40 px-4 pb-6 pointer-events-none">
      
      {/* The Glass Container */}
      <nav className="pointer-events-auto relative bg-[#090909]/80 backdrop-blur-xl border border-brand-purple/30 rounded-2xl h-[70px] flex items-center justify-between px-2 shadow-[0_0_30px_rgba(78,44,139,0.15)]">
        
        <NavItem href="/cart" icon="/icons/navbar/cart.png" label="Cart" />
        <NavItem href="/products" icon="/mobile/nav/shop.png" label="Products" />

        {/* FLOATING CENTER BUTTON */}
        <div className="relative -top-6 flex flex-col items-center justify-center w-[70px]">
          <Link href="/configure" className="w-16 h-16 bg-[#090909] border border-brand-purple rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(78,44,139,0.4)] active:scale-95 transition-transform z-10">
            <div className="relative w-8 h-8">
               <Image src="/icons/navbar/products/Desktops.png" alt="Build" fill className="object-contain" />
            </div>
          </Link>
          <span className="text-[10px] text-white mt-1 font-orbitron font-bold">Custom PC</span>
        </div>

        <NavItem href="/accessories" icon="/icons/navbar/products/acc.png" label="Peripherals" />
        <NavItem href="/support" icon="/mobile/nav/support.png" label="Support" />
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string, icon: string, label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center w-[60px] active:scale-95 transition-transform">
      <div className="relative w-6 h-6 mb-1 opacity-80">
        <Image src={icon} alt={label} fill className="object-contain" />
      </div>
      <span className="text-[9px] text-brand-silver">{label}</span>
    </Link>
  );
}