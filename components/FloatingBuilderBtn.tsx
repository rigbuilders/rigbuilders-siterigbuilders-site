"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Cpu } from "lucide-react";

export default function FloatingBuilderBtn() {
  const pathname = usePathname();

  // Logic: Do not render if we are already on the configure page
  if (pathname === "/configure") {
    return null;
  }

  return (
    <Link
      href="/configure"
      // Changed: bottom-24 to sit above support button, flex-row (default) instead of col, adjusted padding
      className="fixed bottom-24 right-6 z-[998] flex items-center gap-3 py-3 px-6 bg-brand-black/90 backdrop-blur-md border border-white/20 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-white hover:text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 group"
      title="Build Your Rig Now"
    >
      {/* Icon */}
      <Cpu className="w-5 h-5 animate-pulse group-hover:animate-none" />
      
      {/* Horizontal Text */}
      <span className="text-xs font-orbitron font-bold tracking-widest uppercase">
        Build Now
      </span>
    </Link>
  );
}