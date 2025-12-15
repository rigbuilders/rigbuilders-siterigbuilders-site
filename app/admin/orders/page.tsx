"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaTrash, FaUser, FaUserSecret, FaSync } from "react-icons/fa";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // 1. Auth Check (Security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== "rigbuilders123@gmail.com") {
      router.push("/");
      return;
    }

    // 2. Fetch Data
    await fetchOrders();

    // 3. Real-Time Listener (Auto-Refresh)
    const channel = supabase
      .channel('admin-orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders_ops' },
        (payload) => {
          if (payload.eventType === 'INSERT') fetchOrders(); 
          else if (payload.eventType === 'UPDATE') {
             setOrders((prev) => prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const fetchOrders = async () => {
    // We select EVERYTHING to ensure we don't miss data
    const { data, error } = await supabase
      .from('orders_ops')
      .select(`
        *,
        procurement_items ( product_name, category, status )
      `)
      .order('created_at', { ascending: false });

    if (error) console.error("Error:", error.message);
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // 1. Instant UI update
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    // 2. Database update
    await supabase.from('orders_ops').update({ status: newStatus }).eq('id', id);
  };

  const deleteOrder = async (id: string) => {
    if(!confirm("⚠️ PERMANENT DELETE: Are you sure?")) return;
    await supabase.from('procurement_items').delete().eq('order_id', id);
    await supabase.from('orders_ops').delete().eq('id', id);
    setOrders(orders.filter(o => o.id !== id));
  };

  // --- SMART NAME FINDER ---
  const getCustomerDetails = (order: any) => {
    const info = order.guest_info || {};
    
    // Try every possible variation of the name field
    const name = info.fullName || info.full_name || info.name || 
                 (info.firstName ? `${info.firstName} ${info.lastName}` : "Unknown Name");

    const email = info.email || "No Email";
    const phone = info.phone || info.contact || "No Phone";
    const address = info.address || info.fullAddress || "No Address";

    return { name, email, phone, address };
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading Portal...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-[1400px] mx-auto">
        
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="font-orbitron text-3xl font-bold text-brand-purple">ADMIN ORDERS</h1>
                <p className="text-brand-silver text-sm">Master Database & Archive</p>
            </div>
            <button onClick={fetchOrders} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold border border-white/10 transition-all">
                <FaSync /> Refresh
            </button>
        </div>
        
        {orders.length === 0 ? (
            <div className="text-center py-20 text-brand-silver border border-dashed border-white/10 rounded-xl">No orders found.</div>
        ) : (
            <div className="space-y-6">
            {orders.map((order) => {
                const { name, email, phone, address } = getCustomerDetails(order);
                const isMember = !!order.customer_id; // True if they were logged in

                return (
                    <div key={order.id} className="bg-[#1A1A1A] border border-white/5 p-6 rounded-lg hover:border-brand-purple/30 transition-all relative">
                        
                        {/* --- HEADER --- */}
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 border-b border-white/10 pb-4">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded flex items-center justify-center text-xl ${isMember ? "bg-brand-purple text-white shadow-[0_0_15px_#4E2C8B]" : "bg-white/10 text-brand-silver"}`}>
                                    {isMember ? <FaUser /> : <FaUserSecret />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-lg text-white">{name}</h2>
                                        <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold border ${isMember ? "bg-brand-purple text-white border-brand-purple" : "bg-black text-brand-silver border-white/20"}`}>
                                            {isMember ? "MEMBER" : "GUEST"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-brand-silver">{email} • {phone}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-white/30 font-mono">ID: {order.order_display_id}</span>
                                        <span className="text-[10px] text-white/30">•</span>
                                        <span className="text-[10px] text-white/30 uppercase">{order.source}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 md:mt-0 text-right">
                                <p className="font-orbitron text-2xl font-bold text-white">₹{(order.total_amount || 0).toLocaleString("en-IN")}</p>
                                <p className="text-xs text-brand-silver">{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* --- DETAILS GRID --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* ADDRESS */}
                            <div className="text-sm bg-black/20 p-4 rounded border border-white/5">
                                <span className="text-[10px] text-brand-purple uppercase tracking-wider block mb-2 font-bold">Shipping Address</span>
                                <p className="text-white/80 whitespace-pre-line leading-relaxed text-xs">{address}</p>
                            </div>

                            {/* ITEMS */}
                            <div className="text-sm bg-black/20 p-4 rounded border border-white/5">
                                <span className="text-[10px] text-brand-purple uppercase tracking-wider block mb-2 font-bold">Items ({order.procurement_items?.length || 0})</span>
                                <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-2">
                                    {(order.procurement_items || []).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 last:border-0">
                                            <span className="text-white/90 truncate pr-2">{item.product_name}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${item.status === 'received' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="bg-brand-purple/5 p-4 rounded border border-brand-purple/20 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] text-brand-purple uppercase tracking-wider block mb-2 font-bold">Status Override</span>
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => updateStatus(order.id, e.target.value)}
                                        className="w-full bg-[#121212] border border-white/20 rounded p-2 text-xs focus:border-brand-purple outline-none text-white font-bold cursor-pointer hover:bg-white/5 transition-colors uppercase mb-3"
                                    >
                                        <option value="payment_received">Payment Received</option>
                                        <option value="procurement">Procurement</option>
                                        <option value="assembly">Assembly</option>
                                        <option value="ready_to_ship">Ready to Ship</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <button onClick={() => deleteOrder(order.id)} className="flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-bold uppercase rounded transition-all">
                                    <FaTrash size={10} /> Delete Record
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
        )}
      </div>
    </div>
  );
}