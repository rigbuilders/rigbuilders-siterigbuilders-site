"use client";

import Link from "next/link";
import { FaLock, FaTimes } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  // Handle simple entrance animation
  useEffect(() => {
    if (isOpen) {
        setIsVisible(true);
        // Prevent background scrolling when modal is open
        document.body.style.overflow = 'hidden';
    } else {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // Z-INDEX 9999 ensures it's above EVERYTHING (Navbar, Toasts, etc.)
    // items-center -> items-start + pt-[20vh] moves it to the "Cinematic Top-Center"
    <div 
        className={`fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4 transition-all duration-300 ${isVisible ? "bg-black/90 backdrop-blur-md" : "bg-black/0 backdrop-blur-none"}`}
        onClick={onClose} // Clicking background closes it
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Clicking inside doesn't close it
        className={`bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(120,40,250,0.15)] transform transition-all duration-300 ${isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"}`}
      >
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
        >
            <FaTimes size={14} />
        </button>
        
        {/* Icon with Purple Glow */}
        <div className="w-16 h-16 bg-brand-purple/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-brand-purple/20 shadow-[0_0_20px_rgba(78,44,139,0.3)]">
            <FaLock className="text-xl text-brand-purple" />
        </div>
        
        <h2 className="font-orbitron text-xl font-bold text-white mb-3 tracking-wide uppercase">Member Exclusive</h2>
        <p className="text-brand-silver text-xs leading-relaxed mb-8 px-2">
            This hardware is reserved. Sign in to secure your allocation and track your build status.
        </p>

        <div className="space-y-3">
            <Link 
                href="/signin" 
                className="block w-full py-3 bg-brand-purple hover:bg-white hover:text-black font-orbitron font-bold uppercase tracking-widest text-xs rounded transition-all text-white shadow-lg shadow-brand-purple/20"
            >
                Initiate Login
            </Link>
            <Link 
                href="/signup" 
                className="block w-full py-3 border border-white/10 hover:border-white/50 hover:bg-white/5 font-orbitron font-bold uppercase tracking-widest text-xs rounded transition-all text-brand-silver hover:text-white"
            >
                Create Account
            </Link>
        </div>
      </div>
    </div>
  );
}