"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Check your email for the password reset link.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-[#1A1A1A] p-8 rounded-xl border border-white/5">
          <h1 className="font-orbitron text-2xl font-bold mb-4">Reset Password</h1>
          <p className="text-brand-silver text-sm mb-6">Enter your email to receive a reset link.</p>
          
          {message && (
            <div className={`p-3 rounded mb-4 text-sm ${message.includes("Error") ? "bg-red-900/50 text-red-200" : "bg-green-900/50 text-green-200"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <input 
              type="email" 
              required 
              placeholder="Enter your email"
              className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-brand-purple outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button disabled={loading} className="w-full py-3 bg-brand-purple rounded font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}