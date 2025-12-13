"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      // 1. Auth Check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") {
        router.push("/");
        return;
      }

      // 2. Initial Fetch
      fetchOrders();

      // 3. SETUP REAL-TIME LISTENER (The Magic Part)
      const channel = supabase
        .channel('admin-orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Real-time change:', payload);
            if (payload.eventType === 'INSERT') {
              // New order coming in! Add to top.
              // We need to fetch the full order to get nested items, or trigger a re-fetch
              fetchOrders(); 
            } else if (payload.eventType === 'UPDATE') {
              // Status changed! Update local list.
              setOrders((currentOrders) => 
                currentOrders.map((order) => 
                  order.id === payload.new.id ? { ...order, ...payload.new } : order
                )
              );
            }
          }
        )
        .subscribe();

      // Cleanup listener when leaving page
      return () => {
        supabase.removeChannel(channel);
      };
    };

    init();
  }, [router]);

  const fetchOrders = async () => {
    // Fetch orders AND their items
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)') // Ensure you have foreign key set up for order_items
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching orders:", error.message);
    if (data) setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // 1. Optimistic Update (Change UI immediately for speed)
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));

    // 2. Send to Database
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);

    // 3. Error Handling
    if (error) {
      alert(`Update Failed: ${error.message}`);
      fetchOrders(); // Revert changes if failed
    } else {
      console.log(`Order ${id} updated to ${newStatus}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center font-saira">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      <div className="pt-32 pb-12 px-6 max-w-[1400px] mx-auto">
        <div className="flex justify-between items-end mb-8">
            <h1 className="font-orbitron text-3xl font-bold text-brand-purple">ADMIN ORDER PORTAL</h1>
            <span className="text-xs text-brand-silver bg-white/5 px-3 py-1 rounded border border-white/10">
                🟢 Live Connection Active
            </span>
        </div>
        
        {orders.length === 0 ? (
            <div className="text-center py-20 text-brand-silver opacity-50">No orders placed yet.</div>
        ) : (
            <div className="space-y-6">
            {orders.map((order) => (
                <div key={order.id} className="bg-[#1A1A1A] border border-white/5 p-6 rounded-lg hover:border-brand-purple/30 transition-all">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-lg text-white">{order.full_name || order.user_name}</h2>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' : 
                                order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' : 
                                'bg-brand-purple/20 text-brand-purple'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-sm text-brand-silver">{order.email} • {order.phone}</p>
                        <p className="text-[10px] text-white/30 mt-1 font-mono">ID: {order.id}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                    <p className="font-orbitron text-xl font-bold text-white">₹{(order.total_amount || order.total_price || 0).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-brand-silver">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 1. Shipping Address */}
                    <div className="text-sm bg-black/20 p-3 rounded">
                        <span className="text-[10px] text-brand-purple uppercase tracking-wider block mb-2 font-bold">Shipping Address</span>
                        <p className="text-white/80 whitespace-pre-line leading-relaxed">{order.address || order.shipping_address || "No address provided."}</p>
                    </div>

                    {/* 2. Order Items */}
                    <div className="text-sm bg-black/20 p-3 rounded">
                    <span className="text-[10px] text-brand-purple uppercase tracking-wider block mb-2 font-bold">Items Ordered</span>
                    <ul className="space-y-2">
                        {/* Support for both 'items' JSON or 'order_items' table */}
                        {(order.order_items || order.items || []).map((item: any, i: number) => (
                        <li key={i} className="flex justify-between text-white/90 border-b border-white/5 last:border-0 pb-1 last:pb-0">
                            <span>{item.product_name || item.name}</span>
                            <span className="text-brand-silver font-mono">x{item.quantity || 1}</span>
                        </li>
                        ))}
                    </ul>
                    </div>

                    {/* 3. Status Control */}
                    <div className="bg-brand-purple/5 p-3 rounded border border-brand-purple/20">
                    <span className="text-[10px] text-brand-purple uppercase tracking-wider block mb-2 font-bold">Update Status</span>
                    <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full bg-[#121212] border border-white/20 rounded p-3 text-sm focus:border-brand-purple outline-none text-white font-bold cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        <option value="Placed">Placed</option>
                        <option value="Processing">Processing</option>
                        <option value="Commissioned">Commissioned</option>
                        <option value="Assembling">Assembling</option>
                        <option value="Testing">Testing & QA</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <p className="text-[9px] text-white/40 mt-2 text-center">Changes update customer view instantly.</p>
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