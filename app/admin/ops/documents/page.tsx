"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaFileInvoice, FaPrint, FaSearch, FaTruck } from "react-icons/fa";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { OrderPDF } from "./OrderPDF"; 

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

    // Fetching from 'orders' table
    const { data, error } = await supabase
      .from('orders')
      .select('*') 
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data || []);
    setLoading(false);
  };

  // --- 1. GENERATE INVOICE NUMBER ---
  const generateInvoice = async (order: any) => {
    if (order.invoice_no) {
      setSelectedOrder(order);
      return;
    }

    if (!confirm("Generate Invoice Number for this order?")) return;

    // Get next sequence from counters
    const { data: counter } = await supabase.from('counters').select('current_value').eq('name', 'invoice').single();
    const nextVal = (counter?.current_value || 0) + 1;
    
    const year = new Date().getFullYear().toString().slice(-2);
    const newInvoiceNo = `INV-RB-${year}-${String(nextVal).padStart(3, '0')}`;

    // Update Order
    const { error } = await supabase
      .from('orders')
      .update({ 
        invoice_no: newInvoiceNo,
        // Rough tax calculation for the DB (The PDF calculates it precisely)
        tax_details: { 
            cgst: Math.round(order.total_amount * 0.09), 
            sgst: Math.round(order.total_amount * 0.09),
            igst: 0 
        }
      })
      .eq('id', order.id);

    if (error) {
      alert("Failed to generate: " + error.message);
    } else {
      // Update Counter
      await supabase.from('counters').upsert({ name: 'invoice', current_value: nextVal });
      
      alert(`Generated Invoice: ${newInvoiceNo}`);
      fetchOrders();
      
      // Select the order immediately to show preview
      const { data: freshOrder } = await supabase.from('orders').select('*').eq('id', order.id).single();
      setSelectedOrder(freshOrder);
    }
  };

  // --- 2. NEW ACTION: DISPATCH ORDER ---
  const markShipped = async (order: any) => {
    if(!confirm("Confirm Dispatch? This will mark the order as 'Shipped'.")) return;

    const { error } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', order.id);

    if (error) alert(error.message);
    else {
        alert("Order Dispatched!");
        // Update local state immediately to reflect change in the UI
        setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'shipped' } : o));
        setSelectedOrder({ ...order, status: 'shipped' });
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading Documents...</div>;

  // Filter Logic: Updated to use 'full_name' instead of 'billing_address.fullName'
  const filteredOrders = orders.filter(o => 
    (o.display_id || "").toLowerCase().includes(search.toLowerCase()) || 
    (o.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-4 max-w-7xl mx-auto">
        
        <h1 className="font-orbitron text-3xl font-bold text-brand-purple mb-2">DOCUMENTS & DISPATCH</h1>
        <p className="text-brand-silver mb-8">Phase 5: Generate Invoice, Print Bill & Mark Dispatched.</p>

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
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${order.status === 'shipped' ? 'bg-blue-500 text-white' : (order.invoice_no ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500')}`}>
                                {order.status === 'shipped' ? "SHIPPED" : (order.invoice_no ? "INVOICED" : "PENDING")}
                            </span>
                        </div>
                        {/* FIX: Using full_name directly from DB column */}
                        <div className="text-xs text-gray-400 mt-1">{order.full_name || "Guest User"}</div>
                        <div className="text-xs text-brand-silver mt-1 font-mono">₹{order.total_amount?.toLocaleString()}</div>
                    </div>
                ))}
            </div>
          </div>

          {/* RIGHT: PDF PREVIEW & ACTIONS */}
          <div className="lg:col-span-2 bg-[#525659] rounded-xl border border-white/5 flex flex-col h-[75vh] overflow-hidden">
            {selectedOrder ? (
                <>
                    <div className="bg-[#323639] p-3 flex justify-between items-center shadow-lg z-10">
                        <div className="text-sm font-bold text-white">
                            {selectedOrder.invoice_no || "DRAFT PREVIEW"}
                        </div>
                        
                        <div className="flex gap-3">
                            {/* DISPATCH BUTTON */}
                            {selectedOrder.invoice_no && selectedOrder.status !== 'shipped' && (
                                <button 
                                    onClick={() => markShipped(selectedOrder)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                                >
                                    <FaTruck /> Dispatch
                                </button>
                            )}

                            {/* DOWNLOAD BUTTON */}
                            <PDFDownloadLink 
                                document={<OrderPDF order={selectedOrder} />} 
                                fileName={`Invoice_${selectedOrder.display_id}.pdf`}
                                className="bg-brand-purple hover:bg-brand-purple/80 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                            >
                                {({ loading }) => loading ? 'Generating...' : <><FaPrint /> Download PDF</>}
                            </PDFDownloadLink>
                        </div>
                    </div>

                    <div className="flex-grow w-full h-full">
                        <PDFViewer width="100%" height="100%" className="w-full h-full">
                            {/* Using the order object directly since user confirmed addresses are fine */}
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