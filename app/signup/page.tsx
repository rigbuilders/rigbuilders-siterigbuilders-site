"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import AuthLayout, { authInput, authLabel } from "@/components/auth/AuthLayout";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Password Mismatch", { description: "The passwords you entered do not match." });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.username, phone: formData.phone } },
      });
      if (error) throw error;
      if (data.user) {
        toast.success("Account Created", {
          description: "Welcome to Rig Builders! Redirecting to login…",
          duration: 4000,
        });
        setTimeout(() => router.push("/signin"), 2000);
      }
    } catch (err: any) {
      console.error("Sign Up Failed:", err.message);
      toast.error("Registration Failed", { description: err.message || "Could not create your account." });
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
      kicker="New Commission"
      title="Join The"
      highlight="Build"
      subtitle="Create an account to configure rigs, save builds, track orders and unlock the Signature experience."
      bullets={["Save your configurations", "Track every build stage", "Members-only drops"]}
    >
      <div className="mb-6">
        <h2 className="font-orbitron text-2xl font-bold text-white">Create Account</h2>
        <p className="text-rb-silver text-sm mt-1">Commission your masterpiece today.</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className={authLabel}>Username</label>
          <input
            required
            type="text"
            className={authInput}
            placeholder="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        <div>
          <label className={authLabel}>Email Address</label>
          <input
            required
            type="email"
            className={authInput}
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className={authLabel}>Mobile Number</label>
          <div className="flex gap-3">
            <span className="p-3 bg-rb-black border border-rb-line rounded-lg text-rb-silver select-none">+91</span>
            <input
              required
              type="tel"
              className={authInput}
              placeholder="99999 XXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={authLabel}>Password</label>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              className={`${authInput} pr-10`}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

        <div>
          <label className={authLabel}>Confirm Password</label>
          <div className="relative">
            <input
              required
              type={showConfirmPassword ? "text" : "password"}
              className={`${authInput} pr-10`}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-rb-silver hover:text-rb-orange transition-colors"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          className="rb-cta rb-sheen w-full py-3.5 rounded-lg uppercase tracking-widest text-sm font-orbitron disabled:opacity-50 !mt-6"
        >
          {loading ? "Creating Account…" : "Sign Up"}
        </button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-rb-line" /></div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
          <span className="bg-rb-surface px-3 text-rb-silver">Or join with</span>
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
        Already have an account?
        <Link href="/signin" className="text-rb-orange font-bold hover:underline ml-1">Log In</Link>
      </div>
    </AuthLayout>
  );
}
