"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { FaCheckCircle, FaArrowRight, FaBoxOpen } from "react-icons/fa";
import Link from "next/link";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Optional: Fire a confetti effect here if you like
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center pt-32 pb-20 px-4">
        <div className="max-w-2xl w-full text-center">
            
            {/* Animated Icon */}
            <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce-slow border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <FaCheckCircle className="text-5xl text-green-500" />
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                ORDER CONFIRMED!
            </h1>
            
            <p className="text-brand-silver text-lg mb-8">
                Thank you for choosing Rig Builders. Your high-performance gear is being secured.
            </p>

            {/* Receipt Card */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-8 mb-10 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple to-brand-blue" />
                
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between border-b border-white/5 pb-4">
                        <span className="text-brand-silver uppercase text-xs font-bold tracking-wider">Order ID</span>
                        <span className="font-mono text-brand-purple font-bold text-lg">{orderId || "RB-PENDING"}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-brand-silver text-sm">Status</span>
                        <span className="bg-yellow-500/10 text-yellow-500 text-xs px-3 py-1 rounded-full border border-yellow-500/20 flex items-center gap-2">
                             Processing
                        </span>
                    </div>

                    <div className="bg-black/30 p-4 rounded mt-2 text-left">
                        <p className="text-xs text-brand-silver mb-1">What happens next?</p>
                        <ul className="text-xs space-y-2 text-white/80">
                            <li className="flex items-center gap-2"><FaBoxOpen className="text-brand-purple"/> We are checking inventory (Automated).</li>
                            <li className="flex items-center gap-2"><FaArrowRight className="text-brand-purple"/> You will receive an email confirmation shortly.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                    href="/products" 
                    className="bg-brand-purple hover:bg-white hover:text-black text-white px-8 py-4 rounded font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-brand-purple/50"
                >
                    Continue Shopping
                </Link>
                <Link 
                    href="/dashboard" 
                    className="bg-transparent border border-white/20 hover:border-white text-white px-8 py-4 rounded font-bold uppercase tracking-widest transition-all"
                >
                    View My Orders
                </Link>
            </div>

        </div>
      </div>
    </div>
  );
}