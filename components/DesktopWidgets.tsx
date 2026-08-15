"use client";

import { usePathname } from "next/navigation";
import FloatingBuilderBtn from "@/components/FloatingBuilderBtn";
import { Headset } from "lucide-react";

// Re-enabled — the Rix AI chatbot (ChatWidget) is temporarily pulled off the
// live site (see app/layout.tsx) since it's not production-ready yet, so
// these go back to occupying the bottom-right spot in the meantime. Flip
// back to false (and re-enable <ChatWidget> in layout.tsx) once the chatbot
// is ready to ship.
const WIDGETS_ENABLED = true;

export default function DesktopWidgets() {
  const pathname = usePathname();

  // Same hiding technique already used for the /m mobile sandbox — an early
  // return, nothing below it removed.
  if (!WIDGETS_ENABLED || pathname?.startsWith("/m")) return null;

  return (
    <div className="hidden md:block">
      <FloatingBuilderBtn />
      <a 
        href="https://wa.me/917707801014?text=Hi%0AI%20need%20consultation%20for%20my%20PC%20Build"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[999] bg-white text-black p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 group flex items-center justify-center"
        title="Consult an Expert"
      >
        <Headset className="w-6 h-6 md:w-8 md:h-8" />
        <span className="absolute right-full mr-4 bg-[#121212] border border-white/10 text-white text-xs font-bold py-2 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-wider font-orbitron">
          Consult an Expert
        </span>
      </a>
    </div>
  );
}