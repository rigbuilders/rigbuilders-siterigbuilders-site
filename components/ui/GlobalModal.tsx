"use client";

import { useModal } from "@/app/context/ModalContext";
import { AnimatePresence, motion } from "framer-motion";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle } from "react-icons/fa";

export default function GlobalModal() {
  const { isOpen, modalContent, closeModal } = useModal();
  const { title, message, type, onConfirm } = modalContent;

  // Cinematic Icons based on type
  const getIcon = () => {
    switch (type) {
      case "success": return <FaCheckCircle className="text-green-500 text-3xl drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />;
      case "error": return <FaTimesCircle className="text-red-500 text-3xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />;
      case "warning": return <FaExclamationTriangle className="text-yellow-500 text-3xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />;
      default: return <FaInfoCircle className="text-brand-purple text-3xl drop-shadow-[0_0_10px_rgba(78,44,139,0.5)]" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
        case "success": return "border-green-500/50";
        case "error": return "border-red-500/50";
        case "warning": return "border-yellow-500/50";
        default: return "border-brand-purple/50";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          
          {/* 1. Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 2. The Modal Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative bg-[#1A1A1A] border ${getBorderColor()} w-full max-w-md p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden`}
          >
            {/* Cinematic Scanline Effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scan" />

            <div className="flex flex-col items-center text-center">
                
                {/* Icon Wrapper */}
                <div className="mb-6 bg-black/30 p-4 rounded-full border border-white/5">
                    {getIcon()}
                </div>

                {/* Text Content */}
                <h2 className="font-orbitron font-bold text-2xl text-white mb-2 uppercase tracking-wide">
                    {title}
                </h2>
                <p className="font-saira text-brand-silver text-sm leading-relaxed mb-8">
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex gap-4 w-full">
                    {onConfirm ? (
                        <>
                            <button 
                                onClick={closeModal}
                                className="flex-1 py-3 border border-white/10 text-brand-silver font-orbitron text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { onConfirm(); closeModal(); }}
                                className="flex-1 py-3 bg-white text-black font-orbitron text-xs font-bold uppercase tracking-wider hover:bg-brand-purple hover:text-white transition-all shadow-lg"
                            >
                                Confirm
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={closeModal}
                            className="w-full py-3 bg-white text-black font-orbitron text-xs font-bold uppercase tracking-wider hover:bg-brand-purple hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-brand-purple/40"
                        >
                            ACKNOWLEDGE
                        </button>
                    )}
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}