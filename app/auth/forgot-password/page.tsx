"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CALL OUR CUSTOM API instead of supabase.auth.reset...
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Reset Link Sent", {
        description: "If an account exists, you will receive an email shortly.",
        duration: 5000,
      });
      
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 px-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 shadow-2xl">
          <h1 className="font-orbitron text-2xl font-bold mb-2 text-white text-center">Reset Password</h1>
          <p className="text-brand-silver text-sm text-center mb-8">
            Enter your email to receive a secure reset link.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2">Email Address</label>
              <input 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-brand-purple outline-none" 
                placeholder="you@example.com"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full py-3 bg-brand-purple hover:bg-white hover:text-black text-white font-bold rounded uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/signin" className="text-brand-purple hover:underline">Back to Login</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}