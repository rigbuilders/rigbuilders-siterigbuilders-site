"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaTrash, FaUser, FaUserSecret, FaSync, FaMapMarkerAlt, FaFileInvoiceDollar, FaEdit, FaTimes } from "react-icons/fa";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Edit-order modal state
  const emptyForm = { fullName: "", email: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "India" };
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== "rigbuilders123@gmail.com") {
      router.push("/");
      return;
    }
    await fetchOrders();
    const channel = supabase
      .channel('admin-orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
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
    // The website + manual-entry flows both write to `orders`; orders_ops is a
    // legacy/ops table. This master archive reads `orders`.
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Error:", error.message);
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const deleteOrder = async (id: string) => {
    if(!confirm("⚠️ PERMANENT DELETE: Are you sure?")) return;
    await supabase.from('procurement_items').delete().eq('order_id', id);
    await supabase.from('orders').delete().eq('id', id);
    setOrders(orders.filter(o => o.id !== id));
  };

  const openEdit = (order: any) => {
    const sa = order.shipping_address || {};
    setForm({
      fullName: sa.fullName || sa.name || order.full_name || "",
      email: sa.email || order.email || "",
      phone: sa.phone || order.phone || "",
      addressLine1: sa.addressLine1 || sa.address || "",
      addressLine2: sa.addressLine2 || "",
      city: sa.city || "",
      state: sa.state || "",
      pincode: sa.pincode || "",
      country: sa.country || "India",
    });
    setEditing(order);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.fullName.trim() || !form.phone.trim()) { alert("Name and phone are required."); return; }
    setSaving(true);
    const shipping_address = { ...(editing.shipping_address || {}), ...form, name: form.fullName };
    const addressStr = `${form.addressLine1}, ${form.city}, ${form.state} - ${form.pincode}`;

    const { error } = await supabase.from('orders').update({
      full_name: form.fullName,
      email: form.email,
      phone: form.phone,
      shipping_address,
      address: addressStr,
    }).eq('id', editing.id);
    if (error) { alert(error.message); setSaving(false); return; }

    // Best-effort mirror to the legacy orders_ops row (harmless if none exists).
    await supabase.from('orders_ops').update({ guest_info: { ...form } }).eq('order_display_id', editing.display_id);

    setOrders(orders.map(o => o.id === editing.id ? { ...o, full_name: form.fullName, email: form.email, phone: form.phone, shipping_address } : o));
    setSaving(false);
    setEditing(null);
  };

  const getCustomerDetails = (order: any) => {
    const sa = order.shipping_address || {};
    const name = order.full_name || sa.fullName || sa.name || "Unknown";
    const email = order.email || sa.email || "No Email";
    const phone = order.phone || sa.phone || "No Phone";
    const line1 = sa.addressLine1 || sa.address || order.address || '';
    const shipping = `${line1}${sa.addressLine2 ? ', ' + sa.addressLine2 : ''}\n${sa.city || ''}, ${sa.state || ''} - ${sa.pincode || ''}\n${sa.country || 'India'}`;
    return { name, email, phone, shipping };
  };

  // Helper for Billing Address
  const getBillingAddress = (order: any) => {
    if (!order.billing_address) return "Same as Shipping";
    const b = order.billing_address;
    return `${b.addressLine1}, ${b.addressLine2 || ''}\n${b.city}, ${b.state} - ${b.pincode}\n${b.country || 'India'}`;
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
                const { name, email, phone, shipping } = getCustomerDetails(order);
                const billing = getBillingAddress(order);
                const isMember = !!order.user_id;

                return (
                    <div key={order.id} className="bg-[#1A1A1A] border border-white/5 p-6 rounded-lg hover:border-brand-purple/30 transition-all relative">
                        
                        {/* --- HEADER --- */}
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 border-b border-white/10 pb-4">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded flex items-center justify-center text-xl ${isMember ? "bg-brand-purple text-white" : "bg-white/10 text-brand-silver"}`}>
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
                                    <p className="text-[10px] text-white/30 font-mono mt-1">ID: {order.display_id}</p>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 text-right">
                                <p className="font-saira text-2xl font-bold text-white">₹{(order.total_amount || 0).toLocaleString("en-IN")}</p>
                                <p className="text-xs text-brand-silver">{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* --- DETAILS GRID --- */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            
                            {/* SHIPPING ADDRESS */}
                            <div className="text-sm bg-black/20 p-4 rounded border border-white/5">
                                <span className="text-[10px] text-brand-purple uppercase tracking-wider mb-2 font-bold flex items-center gap-2">
                                    <FaMapMarkerAlt /> Shipping To
                                </span>
                                <p className="text-white/80 whitespace-pre-line leading-relaxed text-xs">{shipping}</p>
                            </div>

                            {/* BILLING ADDRESS */}
                            <div className="text-sm bg-brand-blue/5 p-4 rounded border border-brand-blue/10">
                                <span className="text-[10px] text-brand-blue uppercase tracking-wider mb-2 font-bold flex items-center gap-2">
                                    <FaFileInvoiceDollar /> Billed To
                                </span>
                                <p className="text-white/80 whitespace-pre-line leading-relaxed text-xs">{billing}</p>
                            </div>

                            {/* ITEMS */}
                            <div className="text-sm bg-black/20 p-4 rounded border border-white/5">
                                <span className="text-[10px] text-brand-purple uppercase tracking-wider block mb-2 font-bold">Items ({order.items?.length || 0})</span>
                                <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-2">
                                    {(order.items || []).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 last:border-0">
                                            <span className="text-white/90 truncate pr-2">{item.name || item.product_name || "Item"}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-white/5 text-white/40">x{item.quantity || 1}</span>
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
                                <button onClick={() => openEdit(order)} className="flex items-center justify-center gap-2 w-full py-2 mb-2 bg-brand-purple/15 hover:bg-brand-purple hover:text-white text-brand-purple text-xs font-bold uppercase rounded transition-all">
                                    <FaEdit size={10} /> Edit Details
                                </button>
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

      {/* EDIT ORDER (customer details) MODAL */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-orbitron text-lg font-bold text-white">Edit Customer Details</h3>
                <p className="text-[10px] text-brand-silver font-mono mt-0.5">ID: {editing.display_id}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-brand-silver hover:text-white"><FaTimes /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="sm:col-span-2 bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="Full Name *" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <input className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="Phone *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="sm:col-span-2 bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="Address Line 1" value={form.addressLine1} onChange={e => setForm({ ...form, addressLine1: e.target.value })} />
              <input className="sm:col-span-2 bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="Address Line 2 (optional)" value={form.addressLine2} onChange={e => setForm({ ...form, addressLine2: e.target.value })} />
              <input className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              <input className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
              <input className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="Pincode" maxLength={6} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
              <input className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none" placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 border border-white/10 rounded-lg text-sm font-bold text-brand-silver hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-3 bg-brand-purple hover:bg-white hover:text-black rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}