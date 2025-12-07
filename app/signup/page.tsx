"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

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

    // Debug: Log what we are sending
    console.log("Sending Sign Up Data:", formData);

    try {
      // 1. Send data to the API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Success
        alert("Account Created! Please Log In.");
        router.push("/signin");
      } else {
        // 3. Server Error (e.g. Email exists)
        console.error("Server Error:", data.error);
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      // 4. Network/Path Error
      console.error("Network Error:", err);
      setError("Connection failed. Check your internet or API path.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-md bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
          
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl font-bold mb-2">Join Rig Builders</h1>
            <p className="text-[#A0A0A0] text-sm">Commission your masterpiece today.</p>
          </div>

          {/* ERROR BOX */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Full Name</label>
              <input 
                required 
                type="text" 
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
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
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Mobile Number</label>
              <div className="flex gap-3">
                 <span className="p-3 bg-[#121212] border border-white/10 rounded text-[#A0A0A0]">+91</span>
                 <input 
                   required 
                   type="tel" 
                   className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
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
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                placeholder="Create a password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="pt-2">
                <button 
                    disabled={loading}
                    className="w-full py-4 bg-[#4E2C8B] hover:bg-[#3b2169] text-white font-bold rounded uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </div>
          </form>

          {/* Social Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1A1A1A] px-2 text-[#A0A0A0]">Or join with</span>
            </div>
          </div>
          <button className="w-full py-3 bg-white text-black font-bold rounded flex items-center justify-center gap-3 hover:bg-[#D0D0D0] transition-colors">
            <FcGoogle size={24} />
            <span>Google</span>
          </button>

          <div className="mt-8 text-center text-sm text-[#A0A0A0]">
            Already have an account? <Link href="/signin" className="text-[#4E2C8B] font-bold hover:underline">Log In</Link>
          </div>
        </div>
      </div>
    </main>
  );
}