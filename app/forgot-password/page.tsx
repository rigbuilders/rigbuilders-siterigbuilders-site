"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner"; // <--- IMPORT SONNER

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      // CINEMATIC SUCCESS TOAST
      toast.success("Reset Link Sent", { 
        description: "Please check your inbox (and spam) for the recovery link.",
        duration: 5000,
      });

    } catch (err: any) {
      // CINEMATIC ERROR TOAST
      toast.error("Request Failed", { 
        description: err.message || "We could not find an account with that email." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-brand-purple/5 blur-[120px] pointer-events-none z-0" />
      
      <Navbar />
      
      <div className="flex-grow pt-32 pb-12 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md bg-[#1A1A1A] p-8 rounded-xl border border-white/5 shadow-2xl">
          <h1 className="font-orbitron text-2xl font-bold mb-4 text-white">Reset Password</h1>
          <p className="text-brand-silver text-sm mb-8">
            Enter the email address associated with your Rig Builders account.
          </p>
          
          {/* OLD MESSAGE BOX REMOVED - Handled by Toast now */}

          <form onSubmit={handleReset} className="space-y-6">
            <div>
                <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="you@example.com"
                  className="w-full bg-[#121212] border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            
            <button 
                disabled={loading} 
                className="w-full py-4 bg-brand-purple rounded font-orbitron font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg hover:shadow-brand-purple/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}