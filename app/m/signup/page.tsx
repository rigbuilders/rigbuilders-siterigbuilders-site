"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

// NEW: Import the wrapper
import MotionWrapper from "@/components/mobile/MotionWrapper";

export default function MobileSignUp() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
        
        <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-[#121212] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#B084FF] [&::-webkit-scrollbar-thumb]:rounded-l-full pr-0">
          
          {/* NEW: Replaced standard div with MotionWrapper */}
          <MotionWrapper className="px-6 py-8 flex flex-col min-h-full">
            
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => router.back()} className="text-white text-xl p-2 -ml-2 active:scale-90 transition-transform">
                <FaArrowLeft />
              </button>
              <Link href="/m" className="text-white text-sm font-medium hover:text-brand-purple transition-colors tracking-wide">
                Continue as <span className="text-[#B084FF] underline underline-offset-4 decoration-white/30">Guest</span>
              </Link>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative w-[70px] h-[70px]">
                <Image src="/icons/icon-dark.png" alt="Rig Builders" fill className="object-contain" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="font-orbitron font-bold text-sm uppercase tracking-widest text-white mb-1">WELCOME TO</h2>
              <h1 className="font-orbitron font-bold text-[32px] uppercase tracking-wide leading-none">
                <span className="text-white">RIG</span> <span className="text-[#B084FF]">BUILDERS</span>
              </h1>
            </div>

            <div className="space-y-5 mb-10">
              
              <div>
                <label className="block text-white text-xs mb-2 tracking-wide">Your Name</label>
                <input type="text" placeholder="Your Name" className="w-full bg-transparent border border-[#4E2C8B] rounded-xl px-4 py-3.5 text-white text-xs font-saira focus:outline-none focus:border-[#B084FF] transition-colors placeholder:text-white/40 placeholder:regular" />
              </div>

              <div>
                <label className="block text-white text-xs mb-2 tracking-wide">Email Address</label>
                <input type="email" placeholder="example@gmail.com" className="w-full bg-transparent border border-[#4E2C8B] rounded-xl px-4 py-3.5 text-white text-xs font-saira focus:outline-none focus:border-[#B084FF] transition-colors placeholder:text-white/40 placeholder:regular" />
              </div>

              <div>
                <label className="block text-white text-xs mb-2 tracking-wide">Contact No.</label>
                <div className="w-full bg-transparent border border-[#4E2C8B] rounded-xl flex items-center overflow-hidden focus-within:border-[#B084FF] transition-colors">
                  <div className="px-5 py-3.5 border-r border-[#4E2C8B] text-white text-xs font-saira flex-shrink-0">
                    +91
                  </div>
                  <input type="tel" placeholder="98765 XXXXX" className="w-full bg-transparent px-4 py-3.5 text-white text-xs font-saira focus:outline-none placeholder:text-white/40 placeholder:regular" />
                </div>
              </div>
              
              <div>
                <label className="block text-white text-xs mb-2 tracking-wide">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} placeholder="****************" className="w-full bg-transparent border border-[#4E2C8B] rounded-xl px-4 py-3.5 text-white text-xs font-saira focus:outline-none focus:border-[#B084FF] transition-colors placeholder:text-white/40" />
                  <button onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B084FF] text-lg active:scale-90 transition-transform">
                    {showPwd ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white text-xs mb-2 tracking-wide">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPwd ? "text" : "password"} placeholder="****************" className="w-full bg-transparent border border-[#4E2C8B] rounded-xl px-4 py-3.5 text-white text-xs font-saira focus:outline-none focus:border-[#B084FF] transition-colors placeholder:text-white/40" />
                  <button onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B084FF] text-lg active:scale-90 transition-transform">
                    {showConfirmPwd ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
              </div>

            </div>

            <button className="w-full border border-white/20 hover:border-[#B084FF] bg-[#121212] py-4 rounded-xl text-white font-saira text-sm tracking-widest uppercase transition-colors mb-8 shadow-[0_0_15px_rgba(78,44,139,0.15)] active:scale-[0.98]">
              SUBMIT
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-grow bg-white/20"></div>
              <span className="text-white text-sm font-saira whitespace-nowrap">Or Continue With</span>
              <div className="h-[1px] flex-grow bg-white/20"></div>
            </div>

            <div className="flex justify-center mb-6">
              <button className="w-[80px] h-[50px] border border-[#4E2C8B] rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors active:scale-95 shadow-[0_0_10px_rgba(78,44,139,0.1)]">
                <Image src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width={22} height={22} />
              </button>
            </div>

          </MotionWrapper>
        </div>
      </div>
    </div>
  );
}