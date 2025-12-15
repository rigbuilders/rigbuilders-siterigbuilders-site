"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaBoxOpen, FaSave, FaTicketAlt, FaMicrochip, FaTrash } from "react-icons/fa"; 

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let channel: any;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setUser(user);

      // FIX: Fetch from 'orders_ops' and get items from 'procurement_items'
      const { data: orderData } = await supabase
        .from('orders_ops')
        .select(`
            *,
            procurement_items ( product_name, category )
        `)
        .eq('customer_id', user.id)
        .neq('status', 'cancelled') // Optional: Hide cancelled?
        .order('created_at', { ascending: false });

      if (orderData) setOrders(orderData);
      setLoading(false);

      // FIX: Listen to 'orders_ops' table updates
      channel = supabase
        .channel(`dashboard-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders_ops' },
          (payload) => {
             // Only update if it belongs to this user
             if (payload.new.customer_id === user.id) {
                 setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
             }
          }
        )
        .subscribe();
    };

    fetchData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  // --- NEW DELETE FUNCTIONALITY ---
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to CANCEL and DELETE this order?")) return;
    
    // 1. Delete items first (Foreign Key Constraint)
    await supabase.from('procurement_items').delete().eq('order_id', orderId);
    
    // 2. Delete the order
    const { error } = await supabase.from('orders_ops').delete().eq('id', orderId);
    
    if (error) {
        alert("Error deleting order: " + error.message);
    } else {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        alert("Order Cancelled.");
    }
  };

  const getProgressWidth = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) return "100%";
    if (s.includes("shipped") || s.includes("dispatch")) return "75%";
    if (s.includes("assembly") || s.includes("ready")) return "50%";
    if (s.includes("procurement") || s.includes("paid")) return "25%";
    return "5%";
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 pt-32 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 mb-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#4E2C8B] to-[#265DAB] rounded-full mx-auto mb-4 flex items-center justify-center font-orbitron font-bold text-2xl">
              {user.user_metadata.full_name ? user.user_metadata.full_name[0].toUpperCase() : "U"}
            </div>
            <h2 className="font-orbitron font-bold text-lg">{user.user_metadata.full_name || "Valued User"}</h2>
            <p className="text-xs text-[#A0A0A0] truncate px-2">{user.email}</p>
          </div>
          <nav className="space-y-2">
            <SidebarBtn icon={<FaBoxOpen />} label="My Orders" isActive={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
            <SidebarBtn icon={<FaSave />} label="Saved Configs" isActive={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
            <button onClick={handleSignOut} className="w-full text-left px-6 py-4 rounded-lg text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
               <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-3 bg-[#1A1A1A] rounded-xl border border-white/5 p-8 min-h-[600px]">
          
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h2 className="font-orbitron text-2xl font-bold mb-6">Order History</h2>
              
              {orders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded">
                      <p className="text-[#A0A0A0]">No active orders found.</p>
                      <Link href="/products" className="text-brand-purple text-sm mt-2 inline-block">Browse Products</Link>
                  </div>
              ) : (
                orders.map((order) => (
                    <div key={order.id} className="border border-[#4E2C8B]/30 bg-[#121212] rounded-lg p-6 relative overflow-hidden mb-4 transition-all">
                        
                        {/* HEADER */}
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                           <div className="w-16 h-16 bg-[#1A1A1A] rounded flex items-center justify-center border border-white/10 shrink-0">
                              <FaMicrochip size={24} className="text-[#4E2C8B]" />
                           </div>
                           <div className="flex-1">
                              <h3 className="font-bold text-white text-lg">{order.order_display_id}</h3>
                              <p className="text-xs text-[#A0A0A0] mb-2">{new Date(order.created_at).toLocaleDateString()}</p>
                              
                              {/* ITEMS LIST (From procurement_items) */}
                              <div className="flex flex-wrap gap-2 text-[10px]">
                                {order.procurement_items && order.procurement_items.slice(0, 4).map((item: any, i: number) => (
                                    <span key={i} className="bg-white/5 px-2 py-1 rounded border border-white/5 text-brand-silver">
                                        {item.product_name}
                                    </span>
                                ))}
                                {(order.procurement_items?.length || 0) > 4 && (
                                    <span className="bg-white/5 px-2 py-1 rounded text-[#A0A0A0]">+{order.procurement_items.length - 4} more</span>
                                )}
                              </div>
                           </div>
                           
                           {/* PRICE & DELETE BUTTON */}
                           <div className="text-right flex flex-col items-end gap-2">
                              <p className="font-bold text-lg">₹{order.total_amount?.toLocaleString("en-IN")}</p>
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase bg-brand-purple/20 text-brand-purple px-2 py-1 rounded font-bold">{order.status}</span>
                                  
                                  {/* ALLOW DELETE ONLY IF NOT SHIPPED */}
                                  {['payment_received', 'procurement'].includes(order.status) && (
                                    <button 
                                        onClick={() => handleDeleteOrder(order.id)} 
                                        className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors"
                                        title="Cancel Order"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                  )}
                              </div>
                           </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="mt-6 pt-4 border-t border-white/5">
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#4E2C8B] to-[#265DAB]" 
                                style={{ width: getProgressWidth(order.status) }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase text-[#A0A0A0] mt-2 tracking-wider">
                            <span>Placed</span>
                            <span>Building</span>
                            <span>Shipped</span>
                          </div>
                        </div>
                    </div>
                ))
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div className="text-center text-brand-silver">Saved configs coming soon.</div>
          )}
        </div>
      </div>
    </main>
  );
}

function SidebarBtn({ icon, label, isActive, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full text-left px-6 py-4 rounded-lg flex items-center gap-3 transition-all ${isActive ? "bg-[#4E2C8B] text-white font-bold shadow-[0_0_15px_rgba(78,44,139,0.3)]" : "text-[#A0A0A0] hover:bg-white/5 hover:text-white"}`}>
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}