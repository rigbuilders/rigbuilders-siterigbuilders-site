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

  // Blue Dart shipment console
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  // Default pickup/origin = the registered business address (editable per shipment).
  const BUSINESS = {
    name: "Rig Builders", phone: "7707801014",
    addressLine1: "MCB Z2 12267, Sahibzada Jujhar Singh Nagar, Street No. 3A", addressLine2: "",
    city: "Bathinda", state: "Punjab", pincode: "151001",
  };
  const blankShip = () => ({
    pickup: { ...BUSINESS },
    drop: { name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", email: "" },
    parcel: { weightKg: "1", l: "40", w: "40", h: "40", pieces: "1", declaredValue: "0", isCOD: false, codAmount: "0" },
    slot: { date: tomorrow, time: "16:00", closeTime: "19:00", remarks: "" },
  });
  const [shipOrder, setShipOrder] = useState<any>(null);
  const [ship, setShip] = useState(blankShip());
  const [rate, setRate] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [diag, setDiag] = useState<any>(null);
  const [diagging, setDiagging] = useState(false);
  const [pickupAddrs, setPickupAddrs] = useState<any[]>([]);

  const authToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;

  useEffect(() => {
    fetchOrders();
    loadPickupAddrs();
  }, []);

  // Saved pickup/origin addresses (managed in the Shipping Hub).
  const loadPickupAddrs = async () => {
    const token = await authToken();
    if (!token) return;
    const res = await fetch("/api/shipping/pickup-addresses", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const json = await res.json().catch(() => ({}));
    setPickupAddrs(json.addresses || []);
  };

  // Map a saved pickup address onto the console's "pickup (from)" block.
  const addrToPickup = (a: any) => ({
    name: a.contact_name || "Rig Builders", phone: a.phone || "",
    addressLine1: a.address_line1 || "", addressLine2: a.address_line2 || "",
    city: a.city || "", state: a.state || "", pincode: a.pincode || "",
  });
  const applyPickupAddr = (id: string) => {
    const a = pickupAddrs.find(x => x.id === id);
    if (a) setShip(s => ({ ...s, pickup: addrToPickup(a) }));
  };

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

  // --- SHIPMENT CONSOLE: open, prefilled from the order ---
  const openShipment = (order: any) => {
    const sa = order.shipping_address || {};
    const bd = order.box_dimensions || {};
    const isCOD = order.payment_mode === "COD" || Number(order.pending_amount) > 0;
    const def = pickupAddrs.find(a => a.is_default);
    setShip({
      pickup: def ? addrToPickup(def) : { ...BUSINESS },
      drop: {
        name: sa.fullName || sa.name || order.full_name || "",
        phone: sa.phone || order.phone || "",
        addressLine1: sa.addressLine1 || sa.address || order.address || "",
        addressLine2: sa.addressLine2 || "",
        city: sa.city || "", state: sa.state || "", pincode: sa.pincode || "",
        email: sa.email || order.email || "",
      },
      parcel: {
        weightKg: String(order.packed_weight_kg || 1),
        l: String(bd.l || 40), w: String(bd.w || 40), h: String(bd.h || 40),
        pieces: String(bd.pieces || 1),
        declaredValue: String(order.total_amount || 0),
        isCOD,
        codAmount: String(order.pending_amount || (isCOD ? order.total_amount : 0) || 0),
      },
      slot: { date: tomorrow, time: "16:00", closeTime: "19:00", remarks: "" },
    });
    setRate(null);
    setShipOrder(order);
  };

  // --- SHIPMENT: sandbox connectivity test (token + read-only rate), no side effects ---
  const testConnection = async () => {
    setDiagging(true); setDiag(null);
    const token = await authToken();
    if (!token) { alert("Your session expired — please sign in again."); setDiagging(false); return; }
    const res = await fetch("/api/shipping/diag", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        rate: (ship.pickup.pincode && ship.drop.pincode) ? {
          originPincode: ship.pickup.pincode,
          destPincode: ship.drop.pincode,
          weightKg: Number(ship.parcel.weightKg) || 1,
          pieces: Number(ship.parcel.pieces) || 1,
          declaredValue: Number(ship.parcel.declaredValue) || 0,
        } : undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setDiagging(false);
    if (!res.ok) { setDiag({ error: json.error || `Request failed (${res.status})` }); return; }
    setDiag(json);
  };

  // --- SHIPMENT: estimate charges + transit ---
  const checkCharges = async () => {
    setChecking(true); setRate(null);
    const token = await authToken();
    if (!token) { alert("Your session expired — please sign in again."); setChecking(false); return; }
    const res = await fetch("/api/shipping/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        originPincode: ship.pickup.pincode,
        destPincode: ship.drop.pincode,
        weightKg: Number(ship.parcel.weightKg),
        pieces: Number(ship.parcel.pieces),
        declaredValue: Number(ship.parcel.declaredValue),
        isCOD: ship.parcel.isCOD,
        codAmount: Number(ship.parcel.codAmount),
        dims: { l: Number(ship.parcel.l), w: Number(ship.parcel.w), h: Number(ship.parcel.h) },
      }),
    });
    const json = await res.json().catch(() => ({}));
    setChecking(false);
    if (!res.ok) { alert(json.error || "Rate check failed."); return; }
    setRate(json);
  };

  // --- SHIPMENT: generate AWB + label from the console values ---
  const genAwb = async () => {
    if (!shipOrder) return;
    if (!confirm("Generate a Blue Dart AWB + shipping label with these details?")) return;
    setGenLoading(true);
    const token = await authToken();
    if (!token) { alert("Your session expired — please sign in again."); setGenLoading(false); return; }
    const res = await fetch("/api/shipping/waybill", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        orderId: shipOrder.id,
        drop: ship.drop,
        shipper: ship.pickup,
        parcel: {
          weightKg: Number(ship.parcel.weightKg), l: Number(ship.parcel.l), w: Number(ship.parcel.w), h: Number(ship.parcel.h),
          pieces: Number(ship.parcel.pieces), declaredValue: Number(ship.parcel.declaredValue),
          isCOD: ship.parcel.isCOD, codAmount: Number(ship.parcel.codAmount),
        },
      }),
    });
    const json = await res.json().catch(() => ({}));
    setGenLoading(false);
    if (!res.ok) { alert(json.error || "AWB generation failed."); return; }

    alert(`AWB generated: ${json.awb}`);
    setOrders(orders.map(o => o.id === shipOrder.id ? { ...o, awb_number: json.awb } : o));
    setSelectedOrder((s: any) => s && s.id === shipOrder.id ? { ...s, awb_number: json.awb } : s);
    setShipOrder((s: any) => s ? { ...s, awb_number: json.awb } : s);

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

  // --- SHIPMENT: book the Blue Dart pickup from the console ---
  const bookPickupNow = async () => {
    if (!shipOrder) return;
    if (!ship.slot.date) { alert("Pickup date is required."); return; }
    setBooking(true);
    const token = await authToken();
    if (!token) { alert("Your session expired — please sign in again."); setBooking(false); return; }
    const res = await fetch("/api/shipping/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        orderId: shipOrder.id,
        date: ship.slot.date,
        time: ship.slot.time.replace(":", ""),
        closeTime: ship.slot.closeTime.replace(":", ""),
        pieces: Number(ship.parcel.pieces) || 1,
        weightKg: Number(ship.parcel.weightKg) || 1,
        remarks: ship.slot.remarks,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBooking(false);
    if (!res.ok) { alert(json.error || "Pickup booking failed."); return; }

    alert(`Blue Dart pickup booked for ${ship.slot.date}.\nToken: ${json.token || "—"}`);
    setOrders(orders.map(o => o.id === shipOrder.id ? { ...o, pickup_token: json.token, pickup_date: ship.slot.date } : o));
    setSelectedOrder((s: any) => s && s.id === shipOrder.id ? { ...s, pickup_token: json.token, pickup_date: ship.slot.date } : s);
    setShipOrder((s: any) => s ? { ...s, pickup_token: json.token, pickup_date: ship.slot.date } : s);
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
                            {/* SHIPMENT CONSOLE — rates, AWB + label, pickup, addresses */}
                            {selectedOrder.invoice_no && selectedOrder.status !== 'shipped' && (
                                <button
                                    onClick={() => openShipment(selectedOrder)}
                                    className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                                >
                                    <FaTruck /> Shipment
                                </button>
                            )}

                            {/* Pickup chip once booked */}
                            {selectedOrder.pickup_token && (
                                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-2 rounded text-xs font-bold flex items-center gap-2">
                                    <FaTruck /> Pickup {selectedOrder.pickup_date || "booked"}
                                </span>
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

      {/* BLUE DART — SHIPMENT CONSOLE (addresses, parcel, charges, AWB, pickup) */}
      {shipOrder && (() => {
        const inp = "w-full mt-1 bg-black border border-white/10 p-2 rounded text-sm focus:border-amber-500 outline-none";
        const lbl = "text-[10px] uppercase tracking-wider text-gray-400";
        const addrFields: [string, string, 1 | 2][] = [
          ["name", "Name", 2], ["phone", "Phone", 1], ["pincode", "Pincode", 1],
          ["addressLine1", "Address 1", 2], ["addressLine2", "Address 2", 2],
          ["city", "City", 1], ["state", "State", 1],
        ];
        const setGrp = (grp: "pickup" | "drop", k: string, v: string) =>
          setShip(s => ({ ...s, [grp]: { ...(s as any)[grp], [k]: v } }));
        const setParcel = (k: string, v: any) => setShip(s => ({ ...s, parcel: { ...s.parcel, [k]: v } }));
        const setSlot = (k: string, v: string) => setShip(s => ({ ...s, slot: { ...s.slot, [k]: v } }));
        const busy = checking || booking || genLoading || diagging;
        const hasAwb = !!shipOrder.awb_number;
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !busy && setShipOrder(null)} />
          <div className="relative z-10 w-full max-w-3xl bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-2 text-amber-400">
                <FaTruck /> <h3 className="font-orbitron text-lg font-bold text-white">Shipment — {shipOrder.display_id}</h3>
              </div>
              <button onClick={() => !busy && setShipOrder(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Addresses */}
            <div className="grid md:grid-cols-2 gap-4">
              {(["pickup", "drop"] as const).map((grp) => (
                <div key={grp} className="bg-black/30 border border-white/5 rounded-xl p-4">
                  <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-3">{grp === "pickup" ? "Pickup (From)" : "Drop (To)"}</p>
                  {grp === "pickup" && pickupAddrs.length > 0 && (
                    <select onChange={e => e.target.value && applyPickupAddr(e.target.value)} defaultValue=""
                      className="w-full mb-3 bg-black border border-white/10 p-2 rounded text-sm focus:border-amber-500 outline-none">
                      <option value="">Use a saved pickup address…</option>
                      {pickupAddrs.map(a => <option key={a.id} value={a.id}>{a.label}{a.is_default ? " (default)" : ""} — {a.city}</option>)}
                    </select>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {addrFields.map(([k, label, span]) => (
                      <input key={k} placeholder={label} value={(ship as any)[grp][k]}
                        onChange={e => setGrp(grp, k, e.target.value)}
                        className={`${span === 2 ? "col-span-2" : "col-span-1"} ${inp} mt-0`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Parcel */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 mt-4">
              <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-3">Parcel</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><label className={lbl}>Weight (kg)</label><input type="number" min="0" step="0.1" value={ship.parcel.weightKg} onChange={e => setParcel("weightKg", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Pieces</label><input type="number" min="1" value={ship.parcel.pieces} onChange={e => setParcel("pieces", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Declared Value</label><input type="number" min="0" value={ship.parcel.declaredValue} onChange={e => setParcel("declaredValue", e.target.value)} className={inp} /></div>
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
                    <input type="checkbox" className="accent-amber-500 w-4 h-4" checked={ship.parcel.isCOD} onChange={e => setParcel("isCOD", e.target.checked)} /> COD
                  </label>
                </div>
                <div><label className={lbl}>Length (cm)</label><input type="number" min="0" value={ship.parcel.l} onChange={e => setParcel("l", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Breadth (cm)</label><input type="number" min="0" value={ship.parcel.w} onChange={e => setParcel("w", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Height (cm)</label><input type="number" min="0" value={ship.parcel.h} onChange={e => setParcel("h", e.target.value)} className={inp} /></div>
                {ship.parcel.isCOD && <div><label className={lbl}>COD Amount</label><input type="number" min="0" value={ship.parcel.codAmount} onChange={e => setParcel("codAmount", e.target.value)} className={inp} /></div>}
              </div>
            </div>

            {/* Pickup slot */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 mt-4">
              <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-3">Pickup Slot</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><label className={lbl}>Date</label><input type="date" min={new Date().toISOString().slice(0,10)} value={ship.slot.date} onChange={e => setSlot("date", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Ready By</label><input type="time" value={ship.slot.time} onChange={e => setSlot("time", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Closing</label><input type="time" value={ship.slot.closeTime} onChange={e => setSlot("closeTime", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Remarks</label><input type="text" value={ship.slot.remarks} onChange={e => setSlot("remarks", e.target.value)} placeholder="Fragile…" className={inp} /></div>
              </div>
            </div>

            {/* Rate result */}
            {rate && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-amber-300 font-bold">Estimated Charge</span>
                <span className="text-right">
                  <span className="text-lg font-bold text-white font-saira">{rate.total > 0 ? `₹${Number(rate.total).toLocaleString("en-IN")}` : "Not returned by API"}</span>
                  {rate.transit && <span className="block text-[11px] text-amber-300/80">Transit: {rate.transit}</span>}
                </span>
              </div>
            )}

            {/* Sandbox connectivity test output (raw, no side effects) */}
            {diag && (
              <div className="mt-4 bg-black border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Blue Dart Test{diag.config?.env ? ` · ${diag.config.env}` : ""}</span>
                  {!diag.error && (
                    <span className={`text-[11px] font-bold ${diag.token?.ok ? "text-emerald-400" : "text-red-400"}`}>
                      Token {diag.token?.ok ? "OK" : "FAILED"}{diag.token?.status != null ? ` (${diag.token.status})` : ""}
                      {diag.rate ? ` · Rate ${diag.rate.ok ? "OK" : "FAILED"} (${diag.rate.status ?? "—"})` : ""}
                    </span>
                  )}
                </div>
                <pre className="text-[10px] leading-relaxed text-gray-300 whitespace-pre-wrap break-words max-h-64 overflow-y-auto custom-scrollbar">{JSON.stringify(diag, null, 2)}</pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={testConnection} disabled={busy} className="px-4 py-3 border border-white/20 text-gray-200 rounded-lg text-sm font-bold hover:bg-white/5 transition-colors disabled:opacity-50">
                {diagging ? "Testing…" : "Test Connection"}
              </button>
              <button onClick={checkCharges} disabled={busy} className="px-4 py-3 border border-amber-500/40 text-amber-400 rounded-lg text-sm font-bold hover:bg-amber-500/10 transition-colors disabled:opacity-50">
                {checking ? "Checking…" : "Check Charges"}
              </button>
              <button onClick={genAwb} disabled={busy || hasAwb} className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                {hasAwb ? `AWB ${shipOrder.awb_number}` : genLoading ? "Generating…" : "Generate AWB + Label"}
              </button>
              <button onClick={bookPickupNow} disabled={busy} className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                {booking ? "Booking…" : shipOrder.pickup_token ? "Re-book Pickup" : "Book Pickup"}
              </button>
              <button onClick={() => !busy && setShipOrder(null)} className="ml-auto px-4 py-3 border border-white/10 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">Close</button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}