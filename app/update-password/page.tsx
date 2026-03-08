"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // UI Validation: Ensure passwords match before sending to backend
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    // Backend remains untouched
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
        {/* Expanded max-w to md:max-w-xl to accommodate the two columns */}
        <div className="w-full max-w-xl bg-[#1A1A1A] p-8 rounded-xl border border-white/5">
          <h1 className="font-orbitron text-2xl font-bold mb-6">Set New Password</h1>
          
          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* TWO COLUMNS: New Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: New Password */}
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="New Password"
                  className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-brand-purple outline-none pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-brand-silver hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>

              {/* Box 2: Confirm Password */}
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="Confirm Password"
                  className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-brand-purple outline-none pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-brand-silver hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>

            </div>

            <button 
                disabled={loading} 
                className="w-full py-3 bg-brand-purple rounded font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}