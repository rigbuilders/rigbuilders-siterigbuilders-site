"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // FIX: Fetch from 'orders_ops'
        const { data } = await supabase
          .from('orders_ops')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 px-[80px] 2xl:px-[100px]">
        <h1 className="font-orbitron text-4xl font-bold mb-8">ORDER HISTORY</h1>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <p className="text-brand-silver text-xl">You haven&apos;t placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#1A1A1A] p-6 border border-white/5 rounded flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{order.order_display_id}</p>
                  <p className="text-brand-silver text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-brand-purple">₹{order.total_amount?.toLocaleString("en-IN")}</p>
                  <span className="text-xs uppercase bg-white/10 px-2 py-1 rounded text-white">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}