"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { pdf } from "@react-pdf/renderer"; // Import the generator function
import { OrderPDF } from "./OrderPDF";
import { FaFilePdf, FaCheckDouble, FaSpinner } from "react-icons/fa";

export default function DocumentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null); // Track which button is loading

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders_ops')
        .select(`*, procurement_items ( product_name, category, serial_number, price:cost_price )`)
        .eq('status', 'ready_to_ship')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    };
    fetchOrders();
  }, []);

  // --- MANUAL DOWNLOAD FUNCTION ---
  const handleDownload = async (order: any) => {
    setGeneratingId(order.id);
    try {
        // 1. Generate the Blob manually
        const blob = await pdf(<OrderPDF order={order} items={order.procurement_items || []} />).toBlob();
        
        // 2. Create a temporary download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_${order.order_display_id}.pdf`;
        document.body.appendChild(link);
        
        // 3. Click it programmatically
        link.click();
        
        // 4. Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (err: any) {
        console.error("PDF Error:", err);
        alert("Failed to generate PDF. Check console for details.\nError: " + err.message);
    } finally {
        setGeneratingId(null);
    }
  };

  const markShipped = async (id: string) => {
    if(!confirm("Mark as Shipped and Archive?")) return;
    await supabase.from('orders_ops').update({ status: 'shipped' }).eq('id', id);
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-5xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold text-brand-purple mb-8">DOCUMENT GENERATION</h1>
        
        <div className="grid gap-6">
            {orders.map(order => (
                <div key={order.id} className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">{order.order_display_id}</h2>
                            <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded border border-green-500/50">Ready for Docs</span>
                        </div>
                        <p className="text-brand-silver text-sm mt-1">{order.guest_info?.name}</p>
                    </div>

                    <div className="flex gap-4">
                        {/* MANUAL BUTTON */}
                        <button 
                            onClick={() => handleDownload(order)}
                            disabled={generatingId === order.id}
                            className="bg-brand-purple hover:bg-white hover:text-black text-white px-6 py-3 rounded font-bold uppercase flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {generatingId === order.id ? (
                                <><FaSpinner className="animate-spin" /> Generating...</>
                            ) : (
                                <><FaFilePdf /> Download Print Pack</>
                            )}
                        </button>

                        <button onClick={() => markShipped(order.id)} className="bg-white/10 hover:bg-white/20 px-4 rounded border border-white/10">
                            <FaCheckDouble /> Dispatch
                        </button>
                    </div>
                </div>
            ))}
            
            {orders.length === 0 && <div className="text-center text-brand-silver">No orders pending documentation.</div>}
        </div>
      </div>
    </div>
  );
}