"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner"; // <--- IMPORT SONNER

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "", 
    email: "",
    phone: "",
    password: "",
    confirmPassword: "" 
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // VALIDATION: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
        toast.error("Password Mismatch", {
            description: "The passwords you entered do not match."
        });
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.username, 
            phone: formData.phone
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // CINEMATIC SUCCESS TOAST
        toast.success("Account Created", {
            description: "Welcome to Rig Builders! Redirecting to login...",
            duration: 4000
        });
        
        // Slight delay so they see the success message before moving
        setTimeout(() => {
            router.push("/signin");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Sign Up Failed:", err.message);
      
      // CINEMATIC ERROR TOAST
      toast.error("Registration Failed", {
          description: err.message || "Could not create your account."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
            redirectTo: `${window.location.origin}/` 
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("Connection Failed", {
          description: err.message || "Google sign in failed."
      });
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      
      <div className="flex-grow pt-16 pb-12 px-6 flex items-center justify-center w-full relative z-10">
        
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#4E2C8B]/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#1A1A1A] p-8 md:p-12 rounded-2xl border border-white/5 shadow-2xl relative z-20">
          
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl font-bold mb-2 text-white">Join Rig Builders</h1>
            <p className="text-[#A0A0A0] text-sm">Commission your masterpiece today.</p>
          </div>

          {/* ERROR BOX REMOVED - Now handled by Toast */}

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Username</label>
              <input 
                required 
                type="text" 
                className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors" 
                placeholder="username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            {/* Email */}
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

            {/* Mobile */}
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

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Password</label>
              <div className="relative">
                <input 
                    required 
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors pr-10" 
                    placeholder="Create a password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Confirm Password</label>
              <div className="relative">
                <input 
                    required 
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none transition-colors pr-10" 
                    placeholder="Confirm password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="pt-4">
                <button 
                    disabled={loading}
                    className="w-full py-4 bg-[#4E2C8B] hover:bg-[#3b2169] text-white font-bold rounded uppercase tracking-widest transition-all disabled:opacity-50 font-orbitron shadow-[0_0_15px_rgba(78,44,139,0.3)] hover:shadow-none"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </div>
          </form>

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
      
      <Footer />
    </div>
  );
}