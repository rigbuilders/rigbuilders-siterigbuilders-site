"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaTag, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface CouponProps {
  subtotal: number;
  onApply: (discountAmount: number, code: string) => void;
}

export default function CouponCode({ subtotal, onApply }: CouponProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleApply = async () => {
    if (!code) return;
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null; // Pass null if guest (logic will fail for NEW_USER checks, which is good)

      // CALL THE SMART DB FUNCTION
      const { data, error } = await supabase
        .rpc('validate_coupon', { 
           input_code: code, 
           cart_value: subtotal,
           user_id: userId 
        });

      if (error) throw error;

      // Handle the Logic returned from DB
      if (data.valid === false) {
          setStatus("error");
          setMessage(data.message);
          onApply(0, "");
      } else {
          // Calculate Discount based on returned type
          let discountAmount = 0;
          if (data.type === "PERCENT") {
              discountAmount = Math.round((subtotal * data.value) / 100);
              setMessage(`${data.value}% Off Applied!`);
          } else {
              discountAmount = data.value;
              setMessage(`₹${data.value} Off Applied!`);
          }
          
          if (discountAmount > subtotal) discountAmount = subtotal;

          onApply(discountAmount, code.toUpperCase());
          setStatus("success");
      }

    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("System Error checking coupon");
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 font-saira">
      <div className="flex items-center gap-2 mb-4 text-brand-silver">
        <FaTag className="text-brand-purple" />
        <span className="text-sm font-bold uppercase tracking-wider">Coupon Code</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Enter Code (e.g. RIG10)"
            className={`w-full bg-black/40 border ${status === 'error' ? 'border-red-500/50' : 'border-white/10'} rounded p-3 text-white text-sm focus:outline-none focus:border-brand-purple transition-colors uppercase`}
            value={code}
            onChange={(e) => {
                setCode(e.target.value);
                if (status !== 'idle') setStatus('idle'); // Reset status on type
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            disabled={status === "success"} // Disable input if already applied
          />
        </div>

        <button
          onClick={handleApply}
          disabled={loading || !code || status === "success"}
          className={`px-6 rounded font-bold text-xs uppercase tracking-wider transition-all border ${
            status === "success" 
              ? "bg-green-500/10 border-green-500 text-green-500 cursor-default" 
              : "bg-brand-purple hover:bg-brand-purple/80 border-transparent text-white"
          }`}
        >
          {loading ? (
            <FaSpinner className="animate-spin" />
          ) : status === "success" ? (
            <FaCheck />
          ) : (
            "Apply"
          )}
        </button>
      </div>

      {/* Message Animation */}
      <AnimatePresence>
        {status !== "idle" && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs mt-3 flex items-center gap-2 ${status === "success" ? "text-green-400" : "text-red-400"}`}
            >
                {status === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
                {message}
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Icons helper
const FaCheckCircle = () => <FaCheck className="text-[10px]" />;
const FaTimesCircle = () => <FaTimes className="text-[10px]" />;