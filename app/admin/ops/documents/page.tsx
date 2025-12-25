"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaFileInvoice, FaPrint, FaSearch } from "react-icons/fa";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { OrderPDF } from "./OrderPDF"; // Importing the template we fixed

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/");

    // FATAL FIX: We must explicitly select new columns like 'invoice_no', 'tax_details', etc.
    const { data, error } = await supabase
      .from('orders')
      .select('*') 
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data || []);
    setLoading(false);
  };

  // --- GENERATE INVOICE NUMBER IF MISSING ---
  const generateInvoice = async (order: any) => {
    if (order.invoice_no) {
      setSelectedOrder(order);
      return;
    }

    if (!confirm("This order has no Invoice Number. Generate one now?")) return;

    // 1. Get next sequence
    const { data: counter } = await supabase.from('counters').select('current_value').eq('name', 'invoice').single();
    const nextVal = (counter?.current_value || 0) + 1;
    const year = new Date().getFullYear().toString().slice(-2);
    const newInvoiceNo = `INV-RB-${year}-${String(nextVal).padStart(3, '0')}`;

    // 2. Update Order
    const { error } = await supabase
      .from('orders')
      .update({ 
        invoice_no: newInvoiceNo,
        tax_details: { 
            cgst: order.total_amount * 0.09, // Rough calc for display 
            sgst: order.total_amount * 0.09,
            igst: 0 
        }
      })
      .eq('id', order.id);

    if (error) {
      alert("Failed to generate: " + error.message);
    } else {
      // 3. Update Counter
      await supabase.from('counters').update({ current_value: nextVal }).eq('name', 'invoice');
      
      // 4. Refresh & Select
      alert(`Generated Invoice: ${newInvoiceNo}`);
      fetchOrders();
      // We need to re-fetch the specific order to get the new data
      const { data: freshOrder } = await supabase.from('orders').select('*').eq('id', order.id).single();
      setSelectedOrder(freshOrder);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading Documents...</div>;

  const filteredOrders = orders.filter(o => 
    o.display_id?.toLowerCase().includes(search.toLowerCase()) || 
    o.billing_address?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-4 max-w-7xl mx-auto">
        
        <h1 className="font-orbitron text-3xl font-bold text-brand-purple mb-2">INVOICE GENERATOR</h1>
        <p className="text-brand-silver mb-8">Select an order to generate and print the Official Tax Invoice.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: ORDER LIST */}
          <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-4 h-[75vh] flex flex-col">
            <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-3 text-gray-500" />
                <input 
                    placeholder="Search Order ID or Name..." 
                    className="w-full bg-black/40 border border-white/10 rounded p-2 pl-9 text-sm focus:border-brand-purple/50 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {filteredOrders.map(order => (
                    <div 
                        key={order.id}
                        onClick={() => generateInvoice(order)}
                        className={`p-3 rounded border cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-brand-purple/20 border-brand-purple' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-white">{order.display_id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded ${order.invoice_no ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {order.invoice_no ? "INVOICED" : "PENDING"}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{order.billing_address?.fullName || "Guest User"}</div>
                        <div className="text-xs text-brand-silver mt-1 font-mono">₹{order.total_amount?.toLocaleString()}</div>
                    </div>
                ))}
            </div>
          </div>

          {/* RIGHT: PDF PREVIEW */}
          <div className="lg:col-span-2 bg-[#525659] rounded-xl border border-white/5 flex flex-col h-[75vh] overflow-hidden">
            {selectedOrder ? (
                <>
                    <div className="bg-[#323639] p-3 flex justify-between items-center shadow-lg z-10">
                        <div className="text-sm font-bold text-white">
                            PREVIEW: {selectedOrder.invoice_no || "DRAFT MODE"}
                        </div>
                        <PDFDownloadLink 
                            document={<OrderPDF order={selectedOrder} />} 
                            fileName={`Invoice_${selectedOrder.display_id}.pdf`}
                            className="bg-brand-purple hover:bg-brand-purple/80 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                        >
                            {({ loading }) => loading ? 'Generating...' : <><FaPrint /> Download PDF</>}
                        </PDFDownloadLink>
                    </div>
                    <div className="flex-grow w-full h-full">
                        <PDFViewer width="100%" height="100%" className="w-full h-full">
                            <OrderPDF order={selectedOrder} />
                        </PDFViewer>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FaFileInvoice className="text-6xl mb-4 opacity-20" />
                    <p>Select an order to view Invoice</p>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}