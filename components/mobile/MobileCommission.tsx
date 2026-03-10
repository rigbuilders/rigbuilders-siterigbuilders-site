"use client";

import Link from "next/link";

const row1 = [
  { num: "01", title: "Order Lock &", sub: "Build Blueprint" },
  { num: "02", title: "Precision Assembly &", sub: "Signature Craft" },
  { num: "03", title: "Stress Testing &", sub: "Performance Validation" }
];

const row2 = [
  { num: "04", title: "Quality Control &", sub: "Proof of Build" },
  { num: "05", title: "Secure Packaging", sub: "& Premium Dispatch" }
];

export default function MobileCommission() {
  return (
    <div className="w-full px-[30px] mb-16 flex flex-col items-center text-center">
      
      {/* Header */}
      <div className="mb-10">
        <span className="font-saira italic text-brand-silver text-xs block mb-1">How do we</span>
        <h2 className="font-orbitron font-bold text-4xl text-[#B084FF] leading-none uppercase tracking-wide">
          COMMISSION
        </h2>
        <span className="font-saira italic text-brand-silver text-xs block mt-1">your RIG?</span>
      </div>

      {/* Row 1 (Steps 1-3) */}
      <div className="relative flex justify-between w-full mb-6">
        {/* The Connecting Line */}
        <div className="absolute top-[40px] left-[10%] right-[10%] h-[1px] bg-brand-purple/30 z-0" />
        
        {row1.map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center w-[90px]">
            <div className="w-[80px] h-[80px] rounded-full border border-brand-purple bg-[#121212] flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(78,44,139,0.2)]">
                <span className="font-orbitron font-bold text-xl text-white">{step.num}</span>
            </div>
            <p className="font-saira text-[10px] text-white leading-tight font-medium">{step.title}</p>
            <p className="font-saira text-[10px] text-white leading-tight font-medium">{step.sub}</p>
          </div>
        ))}
      </div>

      {/* Row 2 (Steps 4-5 Centered) */}
      <div className="relative flex justify-center gap-10 w-full mb-10">
        {/* The Connecting Line */}
        <div className="absolute top-[40px] w-[120px] h-[1px] bg-brand-purple/30 z-0" />
        
        {row2.map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center w-[100px]">
            <div className="w-[80px] h-[80px] rounded-full border border-brand-purple bg-[#121212] flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(78,44,139,0.2)]">
                <span className="font-orbitron font-bold text-xl text-white">{step.num}</span>
            </div>
            <p className="font-saira text-[10px] text-white leading-tight font-medium">{step.title}</p>
            <p className="font-saira text-[10px] text-white leading-tight font-medium">{step.sub}</p>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <Link href="/how-we-commission" className="border border-white/20 hover:border-brand-purple bg-[#1A1A1A] text-white font-orbitron font-bold text-[11px] uppercase tracking-widest py-4 px-10 transition-colors">
        LEARN MORE
      </Link>
    </div>
  );
}