"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { 
  FaBox, FaClipboardList, FaPlusCircle, FaShoppingCart, FaTools, 
  FaFileInvoice, FaChartPie, FaPenNib, FaTags, FaShieldAlt, FaArrowRight 
} from "react-icons/fa";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // --- AUTH CHECK ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Replace with your actual admin email logic or role check
      if (!user || user.email !== "rigbuilders123@gmail.com") {
        router.push("/");
        return;
      }
      setLoading(false);
    };
    init();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">Initializing Control Panel...</div>;

  const adminSections = [
    {
      category: "Core Operations",
      items: [
        {
          title: "Manual Entry",
          href: "/admin/ops/create",
          icon: <FaPlusCircle />,
          desc: "Create offline orders or import sales from Amazon. Phase 1 of order lifecycle.",
          color: "text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
        },
        {
          title: "Procurement",
          href: "/admin/ops/procurement",
          icon: <FaShoppingCart />,
          desc: "Manage supply chain. Track items to buy, distributor costs, and intake.",
          color: "text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10"
        },
        {
          title: "Build Station",
          href: "/admin/ops/builds",
          icon: <FaTools />,
          desc: "Assembly queue. Manage QC checklists, serial scanning, and packing.",
          color: "text-purple-400 border-purple-400/20 hover:bg-purple-400/10"
        },
        {
          title: "Docs & Dispatch",
          href: "/admin/ops/documents",
          icon: <FaFileInvoice />,
          desc: "Generate tax invoices (PDF), print bills, and mark orders as shipped.",
          color: "text-green-400 border-green-400/20 hover:bg-green-400/10"
        },
      ]
    },
    {
      category: "Management & Finance",
      items: [
        {
          title: "Product Inventory",
          href: "/admin/products",
          icon: <FaBox />,
          desc: "Add or edit website products, manage prices, specs, and stock levels.",
          color: "text-brand-silver border-white/10 hover:border-brand-purple hover:bg-brand-purple/5"
        },
        {
          title: "Master Order List",
          href: "/admin/orders",
          icon: <FaClipboardList />,
          desc: "Searchable archive of all orders. Force-update statuses or delete records.",
          color: "text-brand-silver border-white/10 hover:border-brand-purple hover:bg-brand-purple/5"
        },
        {
          title: "Financial Overview",
          href: "/admin/ops/finance",
          icon: <FaChartPie />,
          desc: "Real-time P&L analysis. Track revenue vs costs and export for CA.",
          color: "text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10"
        },
      ]
    },
    {
      category: "Marketing & Content",
      items: [
        {
          title: "Blog Editor",
          href: "/admin/blog",
          icon: <FaPenNib />,
          desc: "Write and publish news, build guides, and manage comments.",
          color: "text-pink-400 border-pink-400/20 hover:bg-pink-400/10"
        },
        {
          title: "Coupon Manager",
          href: "/admin/coupons",
          icon: <FaTags />,
          desc: "Create discount codes and track influencer/affiliate performance.",
          color: "text-orange-400 border-orange-400/20 hover:bg-orange-400/10"
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      
      <div className="pt-32 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-purple flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                <FaShieldAlt />
            </div>
            <div>
                <h1 className="font-orbitron text-4xl font-bold text-white">COMMAND CENTER</h1>
                <p className="text-brand-silver">Welcome back, Admin. Select a module to begin.</p>
            </div>
        </div>

        <div className="space-y-12">
            {adminSections.map((section, idx) => (
                <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <h2 className="font-orbitron text-xl font-bold text-brand-purple mb-6 uppercase tracking-widest flex items-center gap-4">
                        {section.category}
                        <div className="h-[1px] bg-white/10 flex-grow"></div>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {section.items.map((item) => (
                            <Link href={item.href} key={item.title} className={`group p-6 rounded-xl border transition-all duration-300 relative overflow-hidden bg-[#1A1A1A] ${item.color}`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-500">
                                    <span className="text-6xl">{item.icon}</span>
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="text-2xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</div>
                                    <h3 className="font-orbitron font-bold text-lg text-white mb-2 group-hover:text-brand-purple transition-colors">{item.title}</h3>
                                    <p className="text-xs text-brand-silver leading-relaxed min-h-[40px]">{item.desc}</p>
                                    
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                        Access Module <FaArrowRight />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}