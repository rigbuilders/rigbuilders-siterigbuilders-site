"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. REAL DB SIGN UP
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName, // Saving the name to metadata
            phone: formData.phone         // Saving the phone to metadata
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Success!
        alert("Account Created Successfully! Please Log In.");
        router.push("/signin");
      }
    } catch (err: any) {
      console.error("Sign Up Failed:", err.message);
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
            // FIX: Redirect to Home Page
            redirectTo: `${window.location.origin}/` 
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    // FIX: Main wrapper set to flex-col and min-h-screen to handle scrolling & footer positioning
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      
      {/* FIX: Added pt-28 to push content below the fixed navbar. flex-grow pushes footer down. */}
      <div className="flex-grow pt-28 pb-12 px-6 flex items-center justify-center w-full relative z-10">
        
        {/* Background Glow Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#4E2C8B]/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#1A1A1A] p-8 md:p-12 rounded-2xl border border-white/5 shadow-2xl relative z-20">
          
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl font-bold mb-2 text-white">Join Rig Builders</h1>
            <p className="text-[#A0A0A0] text-sm">Commission your masterpiece today.</p>
          </div>

          {/* ERROR BOX */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/50 border border-red-800 rounded text-red-300 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Full Name</label>
              <input 
                required 
                type="text" 
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors" 
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Email Address</label>
              <input 
                required 
                type="email" 
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors" 
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Mobile Number</label>
              <div className="flex gap-3">
                 <span className="p-3 bg-[#121212] border border-white/10 rounded text-[#A0A0A0] select-none">+91</span>
                 <input 
                   required 
                   type="tel" 
                   className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors" 
                   placeholder="99999 XXXXX" 
                   value={formData.phone}
                   onChange={(e) => setFormData({...formData, phone: e.target.value})}
                 />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Password</label>
              <input 
                required 
                type="password" 
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors" 
                placeholder="Create a password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="pt-4">
                <button 
                    disabled={loading}
                    className="w-full py-4 bg-[#4E2C8B] hover:bg-[#3b2169] text-white font-bold rounded uppercase tracking-widest transition-all disabled:opacity-50 font-orbitron"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </div>
          </form>

          {/* Social Login */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1A1A1A] px-2 text-[#A0A0A0]">Or join with</span>
            </div>
          </div>
          
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white text-black font-bold rounded flex items-center justify-center gap-3 hover:bg-[#D0D0D0] transition-colors disabled:opacity-50"
          >
            <FcGoogle size={24} />
            <span>Google</span>
          </button>

          <div className="mt-8 text-center text-sm text-[#A0A0A0]">
            Already have an account? <Link href="/signin" className="text-[#4E2C8B] font-bold hover:underline ml-1">Log In</Link>
          </div>
        </div>
      </div>
      
      {/* Footer Component */}
      <Footer />
    </div>
  );
}