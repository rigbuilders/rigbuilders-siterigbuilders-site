"use client";

import Link from "next/link";
import { FaLock } from "react-icons/fa";

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-8 max-w-md w-full text-center relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl font-bold">✕</button>
        
        <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaLock className="text-2xl text-brand-purple" />
        </div>
        
        <h2 className="font-orbitron text-2xl font-bold text-white mb-2">Member Exclusive</h2>
        <p className="text-brand-silver text-sm mb-8">
            To ensure secure transactions and order tracking, please sign in to your Rig Builders account.
        </p>

        <div className="space-y-3">
            <Link href="/signin" className="block w-full py-3 bg-brand-purple hover:bg-white hover:text-black font-bold uppercase tracking-wider rounded transition-all text-white hover:text-black">
                Log In
            </Link>
            <Link href="/signup" className="block w-full py-3 border border-white/20 hover:border-white hover:bg-white/5 font-bold uppercase tracking-wider rounded transition-all text-white">
                Create Account
            </Link>
        </div>
      </div>
    </div>
  );
}