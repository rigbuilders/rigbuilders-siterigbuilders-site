"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaBoxOpen, FaSave, FaTicketAlt, FaDownload, FaMicrochip, FaUserCircle } from "react-icons/fa"; 

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Fetch User & Orders on Load
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/signin");
        return;
      }
      setUser(user);

      // Fetch Orders AND their Items
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (orderData) setOrders(orderData);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 pt-32 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 mb-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#4E2C8B] to-[#265DAB] rounded-full mx-auto mb-4 flex items-center justify-center font-orbitron font-bold text-2xl">
              {user.user_metadata.full_name ? user.user_metadata.full_name[0].toUpperCase() : "U"}
            </div>
            <h2 className="font-orbitron font-bold text-lg">{user.user_metadata.full_name || "Valued User"}</h2>
            <p className="text-xs text-[#A0A0A0] truncate px-2">{user.email}</p>
          </div>

          <nav className="space-y-2">
            <SidebarBtn 
              icon={<FaBoxOpen />} 
              label="My Orders" 
              isActive={activeTab === "orders"} 
              onClick={() => setActiveTab("orders")} 
            />
            <SidebarBtn 
              icon={<FaSave />} 
              label="Saved Configurations" 
              isActive={activeTab === "saved"} 
              onClick={() => setActiveTab("saved")} 
            />
            <SidebarBtn 
              icon={<FaTicketAlt />} 
              label="Support & Warranty" 
              isActive={activeTab === "support"} 
              onClick={() => setActiveTab("support")} 
            />
            <button 
                onClick={handleSignOut}
                className="w-full text-left px-6 py-4 rounded-lg text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
            >
               <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3 bg-[#1A1A1A] rounded-xl border border-white/5 p-8 min-h-[600px]">
          
          {/* TAB: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h2 className="font-orbitron text-2xl font-bold mb-6">Order History</h2>
              
              {orders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded">
                      <p className="text-[#A0A0A0]">No orders found.</p>
                      <Link href="/products" className="text-brand-purple text-sm mt-2 inline-block">Browse Products</Link>
                  </div>
              ) : (
                orders.map((order) => (
                    <div key={order.id} className="border border-[#4E2C8B]/30 bg-[#121212] rounded-lg p-6 relative overflow-hidden mb-4">
                        <div className="absolute top-0 right-0 bg-[#4E2C8B] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
                           {order.status || "Processing"}
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                           <div className="w-16 h-16 bg-[#1A1A1A] rounded flex items-center justify-center border border-white/10 shrink-0">
                              <FaMicrochip size={24} className="text-[#4E2C8B]" />
                           </div>
                           <div className="flex-1">
                              <h3 className="font-bold text-white">Order #{order.id.slice(0, 8)}</h3>
                              <p className="text-xs text-[#A0A0A0] mb-2">{new Date(order.created_at).toLocaleDateString()}</p>
                              <div className="flex flex-wrap gap-2 text-[10px]">
                                {order.order_items?.slice(0, 3).map((item: any, i: number) => (
                                    <span key={i} className="bg-white/5 px-2 py-1 rounded border border-white/5">
                                        {item.product_name}
                                    </span>
                                ))}
                                {order.order_items?.length > 3 && (
                                    <span className="bg-white/5 px-2 py-1 rounded text-[#A0A0A0]">+{order.order_items.length - 3} more</span>
                                )}
                              </div>
                           </div>
                           <div className="text-right flex flex-col items-end">
                              <p className="font-bold text-lg mb-2">₹{order.total_amount.toLocaleString("en-IN")}</p>
                              
                              {/* ADDED: Checkout Button for Pending Orders */}
                              {order.status === "pending" && (
                                <button 
                                  onClick={() => router.push("/cart")} // Redirects to cart to retry (Simplest logic for now)
                                  className="bg-brand-purple text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded hover:bg-white hover:text-black transition-all"
                                >
                                  Complete Payment
                                </button>
                              )}
                           </div>
                        </div>

                        {/* Progress Bar Mockup */}
                        <div className="mt-6 pt-4 border-t border-white/5">
                          <div className="flex justify-between text-[10px] uppercase text-[#A0A0A0] mb-2 tracking-wider">
                            <span className="text-white">Placed</span>
                            <span>Processing</span>
                            <span>Shipping</span>
                            <span>Delivered</span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-1/4 h-full bg-gradient-to-r from-[#4E2C8B] to-[#265DAB]"></div>
                          </div>
                        </div>
                    </div>
                ))
              )}
            </div>
          )}

          {/* TAB: SAVED BUILDS (Static Placeholder) */}
          {activeTab === "saved" && (
            <div>
              <h2 className="font-orbitron text-2xl font-bold mb-6">Saved Configurations</h2>
              <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                 <p className="text-[#A0A0A0]">You don't have any saved configurations yet.</p>
                 <Link href="/configure">
                    <button className="mt-4 py-2 px-6 bg-[#4E2C8B] text-white text-xs font-bold rounded uppercase tracking-wider">Start New Build</button>
                 </Link>
              </div>
            </div>
          )}

          {/* TAB: SUPPORT (Static Placeholder) */}
          {activeTab === "support" && (
            <div>
              <h2 className="font-orbitron text-2xl font-bold mb-6">Support & Warranty</h2>
              <div className="bg-[#4E2C8B]/10 border border-[#4E2C8B] p-6 rounded-lg mb-8">
                 <h3 className="font-bold text-white mb-2">Premium Support</h3>
                 <p className="text-sm text-[#A0A0A0]">Contact us directly for issues regarding Order #{orders[0]?.id.slice(0,8) || "N/A"}</p>
                 <p className="text-[#4E2C8B] font-bold mt-2">+91 99999 XXXXX</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

// Helper Component for Sidebar Buttons
function SidebarBtn({ icon, label, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-6 py-4 rounded-lg flex items-center gap-3 transition-all
        ${isActive ? "bg-[#4E2C8B] text-white font-bold shadow-[0_0_15px_rgba(78,44,139,0.3)]" : "text-[#A0A0A0] hover:bg-white/5 hover:text-white"}
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}