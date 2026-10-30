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

  // Blue Dart pickup modal
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [pickupOrder, setPickupOrder] = useState<any>(null);
  const [pickupForm, setPickupForm] = useState({ date: tomorrow, time: "16:00", closeTime: "19:00", pieces: "1", weightKg: "1", remarks: "" });
  const [booking, setBooking] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

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

  // --- GENERATE AWB (Blue Dart waybill + label), in-app ---
  const generateAwb = async (order: any) => {
    if (!confirm("Generate a Blue Dart AWB + shipping label for this order?")) return;
    setGenLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { alert("Your session expired — please sign in again."); setGenLoading(false); return; }

    const res = await fetch("/api/shipping/waybill", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId: order.id }),
    });
    const json = await res.json().catch(() => ({}));
    setGenLoading(false);
    if (!res.ok) { alert(json.error || "AWB generation failed."); return; }

    alert(`AWB generated: ${json.awb}`);
    setOrders(orders.map(o => o.id === order.id ? { ...o, awb_number: json.awb } : o));
    setSelectedOrder((s: any) => s && s.id === order.id ? { ...s, awb_number: json.awb } : s);

    // Auto-download the label if Blue Dart returned one.
    if (json.labelBase64) {
      const isPdf = /^JVBER/.test(json.labelBase64);
      const a = document.createElement("a");
      a.href = `data:${isPdf ? "application/pdf" : "image/png"};base64,${json.labelBase64}`;
      a.download = `AWB_${json.awb}.${isPdf ? "pdf" : "png"}`;
      a.click();
    }
  };

  // --- DISPATCH ORDER (uses the generated/pasted AWB) ---
  const markShipped = async (order: any) => {
    const trackingId = prompt("AWB / Tracking Number:", order.awb_number || "");
    if (trackingId === null) return; // Cancelled
    if(!confirm("Confirm Dispatch? This will mark the order as 'Shipped'.")) return;

    const awb = trackingId || order.awb_number || null;
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'shipped',
            awb_number: awb,
            shipping_address: { ...order.shipping_address, tracking_id: awb },
        })
        .eq('id', order.id);

    if (error) { alert(error.message); return; }

    alert("Order Dispatched. The customer is WhatsApp'd the AWB automatically once Blue Dart logs the pickup — or use 'WhatsApp AWB' to send now.");
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'shipped', awb_number: awb } : o));
    setSelectedOrder({ ...order, status: 'shipped', awb_number: awb });
  };

  // --- BLUE DART: open the pickup form for an order ---
  const openPickup = (order: any) => {
    setPickupForm({ date: tomorrow, time: "16:00", closeTime: "19:00", pieces: "1", weightKg: "1", remarks: "" });
    setPickupOrder(order);
  };

  // --- BLUE DART: submit the pickup booking ---
  const submitPickup = async () => {
    if (!pickupOrder) return;
    if (!pickupForm.date) { alert("Pickup date is required."); return; }
    setBooking(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { alert("Your session expired — please sign in again."); setBooking(false); return; }

    const res = await fetch("/api/shipping/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        orderId: pickupOrder.id,
        date: pickupForm.date,
        time: pickupForm.time.replace(":", ""),          // "16:00" -> "1600"
        closeTime: pickupForm.closeTime.replace(":", ""),
        pieces: Number(pickupForm.pieces) || 1,
        weightKg: Number(pickupForm.weightKg) || 1,
        remarks: pickupForm.remarks,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBooking(false);
    if (!res.ok) { alert(json.error || "Pickup booking failed."); return; }

    alert(`Blue Dart pickup booked for ${pickupForm.date}.\nToken: ${json.token || "—"}`);
    setOrders(orders.map(o => o.id === pickupOrder.id ? { ...o, pickup_token: json.token, pickup_date: pickupForm.date } : o));
    setSelectedOrder((s: any) => s && s.id === pickupOrder.id ? { ...s, pickup_token: json.token, pickup_date: pickupForm.date } : s);
    setPickupOrder(null);
  };

  // --- Share the AWB tracking number with the customer via WhatsApp ---
  const notifyAwb = async (order: any, awb: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch("/api/shipping/notify-awb", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId: order.id, awb }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) alert(`AWB ${awb} sent to the customer on WhatsApp.`);
    else alert(`Dispatched, but WhatsApp notification failed: ${json.error || "unknown error"}`);
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
                            {/* BLUE DART PICKUP — book a slot, or show the booked token */}
                            {selectedOrder.invoice_no && selectedOrder.status !== 'shipped' && (
                                selectedOrder.pickup_token ? (
                                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-2 rounded text-xs font-bold flex items-center gap-2">
                                        <FaTruck /> Pickup {selectedOrder.pickup_date || "booked"}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => openPickup(selectedOrder)}
                                        className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                                    >
                                        <FaTruck /> Book Pickup
                                    </button>
                                )
                            )}

                            {/* GENERATE AWB — in-app Blue Dart waybill + label */}
                            {selectedOrder.invoice_no && !selectedOrder.awb_number && selectedOrder.status !== 'shipped' && (
                                <button
                                    onClick={() => generateAwb(selectedOrder)}
                                    disabled={genLoading}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FaFileInvoice /> {genLoading ? "Generating…" : "Generate AWB"}
                                </button>
                            )}

                            {/* AWB chip once generated */}
                            {selectedOrder.awb_number && (
                                <span className="bg-white/5 border border-white/15 text-white px-3 py-2 rounded text-xs font-bold font-mono flex items-center gap-2">
                                    AWB {selectedOrder.awb_number}
                                </span>
                            )}

                            {/* DISPATCH BUTTON */}
                            {/* Shows if: 1. Invoice Exists, 2. Not yet shipped */}
                            {selectedOrder.invoice_no && selectedOrder.status !== 'shipped' && (
                                <button
                                    onClick={() => markShipped(selectedOrder)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                                >
                                    <FaTruck /> Dispatch
                                </button>
                            )}

                            {/* MANUAL WHATSAPP AWB — fallback / send now */}
                            {selectedOrder.status === 'shipped' && selectedOrder.awb_number && (
                                <button
                                    onClick={() => notifyAwb(selectedOrder, selectedOrder.awb_number)}
                                    className="bg-[#25D366] hover:bg-[#1da851] text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                                >
                                    <FaTruck /> WhatsApp AWB
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

      {/* BLUE DART — PICKUP BOOKING MODAL */}
      {pickupOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !booking && setPickupOrder(null)} />
          <div className="relative z-10 w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-1 text-amber-400">
              <FaTruck /> <h3 className="font-orbitron text-lg font-bold text-white">Book Blue Dart Pickup</h3>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mb-5">Order {pickupOrder.display_id}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Pickup Date</label>
                <input type="date" value={pickupForm.date} min={new Date().toISOString().slice(0,10)} onChange={e => setPickupForm({ ...pickupForm, date: e.target.value })} className="w-full mt-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Ready By</label>
                <input type="time" value={pickupForm.time} onChange={e => setPickupForm({ ...pickupForm, time: e.target.value })} className="w-full mt-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Closing Time</label>
                <input type="time" value={pickupForm.closeTime} onChange={e => setPickupForm({ ...pickupForm, closeTime: e.target.value })} className="w-full mt-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Pieces</label>
                <input type="number" min="1" value={pickupForm.pieces} onChange={e => setPickupForm({ ...pickupForm, pieces: e.target.value })} className="w-full mt-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Weight (kg)</label>
                <input type="number" min="0" step="0.1" value={pickupForm.weightKg} onChange={e => setPickupForm({ ...pickupForm, weightKg: e.target.value })} className="w-full mt-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-amber-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Remarks (optional)</label>
                <input type="text" value={pickupForm.remarks} onChange={e => setPickupForm({ ...pickupForm, remarks: e.target.value })} placeholder="Fragile, handle with care…" className="w-full mt-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-amber-500 outline-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setPickupOrder(null)} disabled={booking} className="flex-1 py-3 border border-white/10 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={submitPickup} disabled={booking} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                {booking ? "Booking…" : "Book Pickup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}