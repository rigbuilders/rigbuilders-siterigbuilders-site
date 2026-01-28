"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaTicketAlt, FaChartLine } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function CollaboratorDashboard() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            router.push("/signin"); // Redirect if not logged in
            return;
        }

        // Fetch coupons where assigned_to_email MATCHES the logged-in user
        const { data } = await supabase
            .from('coupons')
            .select('*')
            .eq('assigned_to_email', user.email);

        if (data) setCoupons(data);
        setLoading(false);
    };
    init();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
            <h1 className="font-orbitron text-4xl font-bold text-white mb-2">CREATOR <span className="text-brand-purple">DASHBOARD</span></h1>
            <p className="text-brand-silver uppercase tracking-widest text-sm">Track your exclusive coupon performance</p>
        </div>

        {loading ? (
            <div className="text-center text-brand-purple animate-pulse">Loading data...</div>
        ) : coupons.length === 0 ? (
            <div className="bg-[#1A1A1A] p-8 rounded-xl border border-white/10 text-center">
                <FaTicketAlt className="text-4xl text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold">No Active Campaigns</h3>
                <p className="text-brand-silver mt-2">You don't have any active discount codes assigned to your account yet.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coupons.map(coupon => (
                    <div key={coupon.id} className="bg-[#1A1A1A] p-6 rounded-xl border border-white/10 hover:border-brand-purple/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FaChartLine size={80} />
                        </div>
                        
                        <div className="relative z-10">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase mb-4 inline-block ${coupon.active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                                {coupon.active ? "Active" : "Inactive"}
                            </span>

                            <h2 className="font-orbitron text-4xl font-bold text-white mb-1">{coupon.code}</h2>
                            <p className="text-brand-purple font-bold text-sm mb-6">
                                {coupon.discount_type === 'percent' ? `${coupon.value}% Discount` : `₹${coupon.value} Flat Discount`}
                            </p>

                            <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                                <div>
                                    <p className="text-[10px] text-brand-silver uppercase font-bold">Total Uses</p>
                                    <p className="text-2xl font-bold text-white">{coupon.usage_count}</p>
                                </div>
                                <div className="h-8 w-[1px] bg-white/10"></div>
                                <div>
                                    <p className="text-[10px] text-brand-silver uppercase font-bold">Status</p>
                                    <p className="text-sm font-bold text-white">{coupon.active ? "Live Now" : "Paused"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}