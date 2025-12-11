"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Icons for toggle
import { supabase } from "@/lib/supabaseClient"; 

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle state
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        console.log("Login Success:", data.user);
        router.push("/"); 
      }
    } catch (err: any) {
      console.error("Login Failed:", err.message);
      setError("Invalid credentials. Please check your email and password.");
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
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      
    } catch (err: any) {
      setError(err.message || "Google sign in failed.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col"> 
      <Navbar />

      <div className="flex-grow pt-24 pb-12 px-6 flex items-center justify-center w-full relative z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#4E2C8B]/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="bg-[#1A1A1A] p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md border border-white/5 relative z-20">
          <h1 className="font-orbitron text-3xl font-bold text-center mb-2 text-white">
            Welcome Back
          </h1>
          <p className="text-[#A0A0A0] text-sm text-center mb-10">Sign in to access your commissioned builds.</p>

          {error && (
            <div className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4 text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs uppercase tracking-wider text-[#A0A0A0]">
                  Password
                </label>
                <Link href="/forgot-password">
                    <span className="text-xs text-[#4E2C8B] hover:text-white cursor-pointer transition-colors">Forgot Password?</span>
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} // Toggles between text and password
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#4E2C8B] hover:bg-[#3b2169] text-white font-bold rounded uppercase tracking-widest transition-all disabled:opacity-50 font-orbitron"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1A1A1A] px-2 text-[#A0A0A0]">Or continue with</span>
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
            New to Rig Builders?
            <Link href="/signup" className="text-[#4E2C8B] font-bold hover:underline ml-1">
              Create Account
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}