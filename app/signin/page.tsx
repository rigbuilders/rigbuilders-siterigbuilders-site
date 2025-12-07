"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("Attempting Login:", formData.email);

    try {
      // 1. Send data to API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Success: Save user & Redirect
        console.log("Login Success:", data.user);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        // 3. Server Error (Wrong password)
        console.error("Login Failed:", data.error);
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      console.error("Network Error:", err);
      setError("Network connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="w-full max-w-md bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4E2C8B]/20 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <h1 className="font-orbitron text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-[#A0A0A0] text-sm">Sign in to access your commissioned builds.</p>
          </div>

          {/* ERROR BOX */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0]">Password</label>
                <Link href="/forgot-password">
                    <span className="text-xs text-[#4E2C8B] hover:text-white cursor-pointer transition-colors">Forgot Password?</span>
                </Link>
              </div>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full py-4 bg-[#4E2C8B] hover:bg-[#3b2169] text-white font-bold rounded uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Social Login */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1A1A1A] px-2 text-[#A0A0A0]">Or continue with</span>
            </div>
          </div>
          <button className="w-full py-3 bg-white text-black font-bold rounded flex items-center justify-center gap-3 hover:bg-[#D0D0D0] transition-colors">
            <FcGoogle size={24} />
            <span>Google</span>
          </button>

          <div className="mt-8 text-center text-sm text-[#A0A0A0]">
            New to Rig Builders? <Link href="/signup" className="text-[#4E2C8B] font-bold hover:underline">Create Account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}