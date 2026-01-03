"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaBoxOpen, FaSave, FaMicrochip, FaTrash, FaMapMarkerAlt, FaImage } from "react-icons/fa";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let channelOrders: any;
    let channelOps: any;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setUser(user);

      // 1. FETCH NEW ORDERS (Website/Amazon) - Contains 'items' JSON with images
      const { data: newOrdersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      // 2. FETCH OLD ORDERS (Legacy) - Contains 'procurement_items' relation
      const { data: oldOrdersData } = await supabase
        .from('orders_ops')
        .select(`*, procurement_items ( product_name, category )`)
        .eq('customer_id', user.id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      // 3. NORMALIZE & MERGE DATA
      const formattedNew = (newOrdersData || []).map(o => ({
        id: o.id,
        display_id: o.display_id, 
        created_at: o.created_at,
        total_amount: o.total_amount,
        status: o.status,
        source_table: 'orders',
        // MAP ITEMS & EXTRACT IMAGE
        itemsList: o.items?.map((i: any) => ({ 
            product_name: i.name || i.product_name, 
            category: i.category,
            // Grab image from JSON (supports 'image', 'image_url', or 'img')
            image: i.image_url || i.image || i.img || null 
        })) || []
      }));

      const formattedOld = (oldOrdersData || []).map(o => ({
        id: o.id,
        display_id: o.order_display_id,
        created_at: o.created_at,
        total_amount: o.total_amount,
        status: o.status,
        source_table: 'orders_ops',
        // Old items don't have images easily accessible, keep logic simple
        itemsList: o.procurement_items || []
      }));

      // Combine and Sort
      const combined = [...formattedNew, ...formattedOld].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(combined);
      setLoading(false);

      // --- REAL-TIME LISTENERS ---
      channelOrders = supabase
        .channel(`dashboard-orders-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          (payload) => {
             setOrders(prev => prev.map(o => {
                 if (o.id === payload.new.id && o.source_table === 'orders') {
                     // Preserve the itemsList when updating status
                     return { ...o, ...payload.new, status: payload.new.status, itemsList: o.itemsList };
                 }
                 return o;
             }));
          }
        )
        .subscribe();

      channelOps = supabase
        .channel(`dashboard-ops-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders_ops', filter: `customer_id=eq.${user.id}` },
          (payload) => {
             setOrders(prev => prev.map(o => {
                 if (o.id === payload.new.id && o.source_table === 'orders_ops') {
                     return { ...o, ...payload.new, status: payload.new.status, itemsList: o.itemsList };
                 }
                 return o;
             }));
          }
        )
        .subscribe();
    };

    fetchData();

    return () => {
      if (channelOrders) supabase.removeChannel(channelOrders);
      if (channelOps) supabase.removeChannel(channelOps);
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const handleDeleteOrder = async (orderId: string, table: string) => {
    if (!confirm("Are you sure you want to CANCEL this order?")) return;
    const { error } = await supabase.from(table).delete().eq('id', orderId);
    if (error) alert("Error deleting order: " + error.message);
    else {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        alert("Order Cancelled.");
    }
  };

  const getProgressWidth = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) return "100%";
    if (s.includes("shipped") || s.includes("dispatch") || s.includes("ready_to_ship")) return "75%";
    if (s.includes("assembly") || s.includes("build") || s.includes("procurement")) return "50%";
    if (s.includes("paid") || s.includes("processing") || s.includes("confirmed")) return "25%";
    return "5%";
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 pt-24 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
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
            
            <Link href="/account/addresses">
              <div className="w-full text-left px-6 py-4 rounded-lg flex items-center gap-3 text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                <span className="text-lg"><FaMapMarkerAlt /></span>
                <span>Address Book</span>
              </div>
            </Link>

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
                    <div key={order.id} className="border border-[#4E2C8B]/30 bg-[#121212] rounded-lg p-6 relative overflow-hidden mb-6 transition-all">
                        
                        {/* HEADER ROW */}
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-6">
                           <div className="flex gap-4">
                               <div className="w-12 h-12 bg-[#1A1A1A] rounded flex items-center justify-center border border-white/10 shrink-0">
                                  <FaMicrochip size={20} className="text-[#4E2C8B]" />
                               </div>
                               <div>
                                  <h3 className="font-bold text-white text-lg tracking-wide">{order.display_id}</h3>
                                  <p className="text-xs text-[#A0A0A0]">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                               </div>
                           </div>
                           
                           {/* PRICE & STATUS */}
                           <div className="text-right">
                              <p className="font-bold text-xl text-white">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</p>
                              <div className="flex items-center justify-end gap-2 mt-1">
                                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' : 'bg-brand-purple/20 text-brand-purple'}`}>
                                    {order.status.replace('_', ' ')}
                                  </span>
                                  
                                  {/* DELETE BUTTON */}
                                  {['payment_received', 'processing', 'procurement', 'pending'].includes(order.status) && (
                                    <button 
                                        onClick={() => handleDeleteOrder(order.id, order.source_table)} 
                                        className="text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-colors"
                                        title="Cancel Order"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                  )}
                              </div>
                           </div>
                        </div>

                        {/* --- NEW: VISUAL PRODUCT GRID --- */}
                        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4 border border-white/5">
                            <h4 className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-3 tracking-wider">Order Items</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {order.itemsList && order.itemsList.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 bg-black/40 p-2 rounded border border-white/5 hover:border-brand-purple/30 transition-colors">
                                        {/* IMAGE OR ICON FALLBACK */}
                                        <div className="w-12 h-12 bg-[#121212] rounded flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <FaImage className="text-white/20 text-lg" />
                                            )}
                                        </div>
                                        {/* TEXT DETAILS */}
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-white truncate w-full" title={item.product_name}>
                                                {item.product_name}
                                            </p>
                                            <p className="text-[10px] text-[#A0A0A0] uppercase">
                                                {item.category || "Component"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="pt-2">
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#4E2C8B] to-[#265DAB] transition-all duration-1000" 
                                style={{ width: getProgressWidth(order.status) }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase text-[#A0A0A0] mt-2 tracking-wider">
                            <span>Placed</span>
                            <span>Processing</span>
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