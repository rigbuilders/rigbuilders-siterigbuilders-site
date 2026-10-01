"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import AuthLayout, { authInput, authLabel } from "@/components/auth/AuthLayout";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      if (data.user) {
        toast.success("Welcome Back", {
          description: "Access granted to your workstation.",
          duration: 3000,
        });
        router.push("/");
      }
    } catch (err: any) {
      console.error("Login Failed:", err.message);
      toast.error("Access Denied", {
        description: "Invalid credentials. Please check your email and password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("Connection Failed", { description: err.message || "Google sign in failed." });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="Access Terminal"
      title="Welcome"
      highlight="Back"
      subtitle="Sign in to access your commissioned builds, saved configurations and order timeline."
      bullets={["Compatibility verified", "Thermals validated", "Performance proven"]}
    >
      <div className="mb-8">
        <h2 className="font-orbitron text-2xl font-bold text-white">Sign In</h2>
        <p className="text-rb-silver text-sm mt-1">Enter your credentials to continue.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabel}>Email Address</label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={authInput}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="text-[11px] uppercase tracking-[0.15em] text-rb-silver">Password</label>
            <Link href="/forgot-password" className="text-xs text-rb-orange hover:text-white transition-colors">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`${authInput} pr-10`}
              placeholder="•••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-rb-silver hover:text-rb-orange transition-colors"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rb-cta rb-sheen w-full py-3.5 rounded-lg uppercase tracking-widest text-sm font-orbitron disabled:opacity-50"
        >
          {loading ? "Authenticating…" : "Sign In"}
        </button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-rb-line" /></div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
          <span className="bg-rb-surface px-3 text-rb-silver">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="rb-sheen w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-rb-mist transition-colors disabled:opacity-50"
      >
        <FcGoogle size={22} />
        <span>Google</span>
      </button>

      <div className="mt-8 text-center text-sm text-rb-silver">
        New to Rig Builders?
        <Link href="/signup" className="text-rb-orange font-bold hover:underline ml-1">Create Account</Link>
      </div>
    </AuthLayout>
  );
}
