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
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // SECURITY CHECK (Frontend only - DB RLS is the real protection)
      if (!user || user.email !== "rigbuilders123@gmail.com") { // REPLACE WITH YOUR EMAIL
        router.push("/");
        return;
      }

      // Fetch all orders with their items
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [router]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading Portal...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      <div className="pt-32 pb-12 px-6 max-w-[1400px] mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-8 text-brand-purple">ADMIN ORDER PORTAL</h1>
        
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#1A1A1A] border border-white/5 p-6 rounded-lg">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-bold text-lg text-white">{order.full_name}</h2>
                  <p className="text-sm text-brand-silver">{order.email} • {order.phone}</p>
                  <p className="text-xs text-white/50 mt-1">ID: {order.id}</p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="font-orbitron text-xl font-bold text-brand-purple">₹{order.total_amount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-brand-silver">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Shipping Address */}
                <div className="text-sm">
                  <span className="text-xs text-brand-silver uppercase tracking-wider block mb-2">Shipping Address</span>
                  <p className="text-white/80 whitespace-pre-line">{order.address}</p>
                </div>

                {/* 2. Order Items */}
                <div className="text-sm">
                  <span className="text-xs text-brand-silver uppercase tracking-wider block mb-2">Items Ordered</span>
                  <ul className="space-y-1">
                    {order.order_items.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between text-white/80">
                        <span>{item.product_name} <span className="text-brand-purple">x{item.quantity}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Status Control */}
                <div>
                  <span className="text-xs text-brand-silver uppercase tracking-wider block mb-2">Order Status</span>
                  <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="w-full bg-[#121212] border border-white/20 rounded p-2 text-sm focus:border-brand-purple outline-none"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Assembling">Assembling</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}