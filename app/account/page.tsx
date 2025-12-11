"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
      } else {
        setUser(user);
      }
    };
    getUser();
  }, [router]);

  if (!user) return <div className="bg-[#121212] min-h-screen text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 px-[80px] 2xl:px-[100px]">
        <h1 className="font-orbitron text-4xl font-bold mb-8">MY ACCOUNT</h1>
        
        <div className="bg-[#1A1A1A] border border-white/5 p-8 rounded-lg max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-brand-silver text-xs uppercase tracking-wider mb-1">Full Name</label>
              <p className="text-xl font-bold">{user.user_metadata.full_name || "N/A"}</p>
            </div>
            <div>
              <label className="block text-brand-silver text-xs uppercase tracking-wider mb-1">Email Address</label>
              <p className="text-xl font-bold">{user.email}</p>
            </div>
            <div>
              <label className="block text-brand-silver text-xs uppercase tracking-wider mb-1">Phone Number</label>
              <p className="text-xl font-bold">{user.user_metadata.phone || "Not provided"}</p>
            </div>
            <div className="pt-4 border-t border-white/10">
               <p className="text-xs text-brand-silver">Member since: {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}