"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Password updated successfully! You can now log in.");
      router.push("/signin");
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-[#1A1A1A] p-8 rounded-xl border border-white/5">
          <h1 className="font-orbitron text-2xl font-bold mb-4">Set New Password</h1>
          <form onSubmit={handleUpdate} className="space-y-4">
            <input 
              type="password" 
              required 
              placeholder="New Password"
              className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-brand-purple outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button disabled={loading} className="w-full py-3 bg-brand-purple rounded font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}