"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  FaTruck, FaWallet, FaBoxOpen, FaSync, FaPlus, FaTrash, FaPen,
  FaStar, FaRegStar, FaPlug, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaSearch,
} from "react-icons/fa";

const ORANGE = "#FF5A1F";

// ---- status badge styling ----
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  confirmed: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  processing: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  ready_to_ship: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  shipped: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  in_transit: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  out_for_delivery: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
  rto: "bg-red-500/15 text-red-300 border-red-500/30",
};
const statusClass = (s?: string) => STATUS_STYLE[s || ""] || "bg-white/5 text-gray-300 border-white/10";

const blankAddr = () => ({
  id: "", label: "", contact_name: "Rig Builders", phone: "",
  address_line1: "", address_line2: "", city: "", state: "", pincode: "",
  origin_area: "", is_default: false,
});

const blankPickup = () => ({
  id: "", token: "", pickup_date: new Date().toISOString().slice(0, 10),
  ready_time: "", close_time: "", pieces: "", weight_kg: "",
  location_label: "", order_display_id: "", remarks: "", status: "scheduled", source: "portal",
});

const PICKUP_STATUS: Record<string, string> = {
  scheduled: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function ShippingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [conn, setConn] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // address editor
  const [editing, setEditing] = useState<any>(null); // null = closed
  const [savingAddr, setSavingAddr] = useState(false);

  // shipment detail + live tracking
  const [detail, setDetail] = useState<any>(null); // the order being inspected
  const [live, setLive] = useState<any>(null);     // live Blue Dart track result
  const [tracking, setTracking] = useState(false);

  // pickups (unified: app-booked + portal-logged)
  const [pickups, setPickups] = useState<any[]>([]);
  const [pickupEdit, setPickupEdit] = useState<any>(null); // null = closed
  const [savingPickup, setSavingPickup] = useState(false);

  const authToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;
  const api = async (path: string, init?: RequestInit) => {
    const token = await authToken();
    if (!token) throw new Error("Session expired");
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  };

  // --- auth + initial load ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") { router.push("/"); return; }
      await Promise.all([loadOrders(), loadAddresses(), loadConn(), loadBalance(), loadPickups()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, display_id, full_name, phone, status, shipping_status, awb_number, pickup_token, pickup_date, packed_weight_kg, shipping_address, tracking_last_synced, total_amount, created_at")
      .not("awb_number", "is", null)
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };
  const loadAddresses = async () => {
    try { const j = await api("/api/shipping/pickup-addresses"); setAddresses(j.addresses || []); } catch {}
  };
  const loadConn = async () => {
    try { const j = await api("/api/shipping/diag", { method: "POST", body: "{}" }); setConn(j); }
    catch (e: any) { setConn({ error: e.message }); }
  };
  const loadBalance = async () => {
    try { const j = await api("/api/shipping/balance"); setBalance(j); }
    catch (e: any) { setBalance({ error: e.message }); }
  };

  const loadPickups = async () => {
    try { const j = await api("/api/shipping/pickups"); setPickups(j.pickups || []); } catch {}
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), loadAddresses(), loadConn(), loadBalance(), loadPickups()]);
    setRefreshing(false);
  };

  // --- address editor actions ---
  const saveAddr = async () => {
    const a = editing;
    if (!a.label || !a.phone || !a.address_line1 || !a.city || !a.state || !a.pincode) {
      alert("Label, phone, address line 1, city, state and pincode are required."); return;
    }
    setSavingAddr(true);
    try {
      if (a.id) await api("/api/shipping/pickup-addresses", { method: "PATCH", body: JSON.stringify(a) });
      else await api("/api/shipping/pickup-addresses", { method: "POST", body: JSON.stringify(a) });
      setEditing(null);
      await loadAddresses();
    } catch (e: any) { alert(e.message); }
    setSavingAddr(false);
  };
  const deleteAddr = async (id: string) => {
    if (!confirm("Delete this pickup address?")) return;
    try { await api(`/api/shipping/pickup-addresses?id=${id}`, { method: "DELETE" }); await loadAddresses(); }
    catch (e: any) { alert(e.message); }
  };
  const makeDefault = async (a: any) => {
    try { await api("/api/shipping/pickup-addresses", { method: "PATCH", body: JSON.stringify({ id: a.id, is_default: true }) }); await loadAddresses(); }
    catch (e: any) { alert(e.message); }
  };

  // --- shipment detail + live tracking ---
  const openDetail = (o: any) => {
    setDetail(o); setLive(null);
    if (o.awb_number) liveTrack(o.awb_number);
  };
  const liveTrack = async (awb: string) => {
    setTracking(true); setLive(null);
    try { const j = await api("/api/shipping/track", { method: "POST", body: JSON.stringify({ awb }) }); setLive(j); }
    catch (e: any) { setLive({ error: e.message }); }
    setTracking(false);
  };

  // --- pickups: log/edit a portal pickup ---
  const savePickup = async () => {
    const p = pickupEdit;
    if (!p.pickup_date) { alert("Pickup date is required."); return; }
    setSavingPickup(true);
    try {
      const payload = { ...p, source: p.source || "portal" };
      if (p.id) await api("/api/shipping/pickups", { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/shipping/pickups", { method: "POST", body: JSON.stringify(payload) });
      setPickupEdit(null);
      await loadPickups();
    } catch (e: any) { alert(e.message); }
    setSavingPickup(false);
  };
  const deletePickup = async (id: string) => {
    if (!confirm("Remove this pickup from the log?")) return;
    try { await api(`/api/shipping/pickups?id=${id}`, { method: "DELETE" }); await loadPickups(); }
    catch (e: any) { alert(e.message); }
  };

  // --- derived ---
  const active = orders.filter(o => !["delivered", "cancelled", "rto"].includes(o.status));
  const delivered = orders.filter(o => o.status === "delivered");
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    if (!q) return true;
    const sa = o.shipping_address || {};
    return [o.display_id, o.full_name, o.awb_number, sa.city, sa.pincode].some((v: any) => String(v || "").toLowerCase().includes(q));
  });

  const scheduledPickups = pickups.filter(p => p.status === "scheduled");
  const pastPickups = pickups.filter(p => p.status !== "scheduled");

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">Loading Shipping Hub…</div>;

  const tokenOk = conn && !conn.error && conn.token?.ok;
  const inp = "w-full mt-1 bg-black border border-white/10 p-2 rounded text-sm focus:border-amber-500 outline-none";
  const lbl = "text-[10px] uppercase tracking-wider text-gray-400";

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-24">
      <Navbar />
      <div className="pt-32 px-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: ORANGE, boxShadow: `0 0 30px ${ORANGE}55` }}>
              <FaTruck />
            </div>
            <div>
              <h1 className="font-orbitron text-3xl font-bold">SHIPPING HUB</h1>
              <p className="text-gray-400 text-sm">Blue Dart account, shipments & pickup addresses</p>
            </div>
          </div>
          <button onClick={refreshAll} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 border border-white/15 rounded-lg text-sm font-bold hover:bg-white/5 transition-colors disabled:opacity-50">
            <FaSync className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Connection */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2"><FaPlug /> Blue Dart</div>
            {conn?.error ? (
              <p className="text-red-400 font-bold flex items-center gap-2"><FaTimesCircle /> Error</p>
            ) : (
              <p className={`font-bold flex items-center gap-2 ${tokenOk ? "text-emerald-400" : "text-red-400"}`}>
                {tokenOk ? <FaCheckCircle /> : <FaTimesCircle />} {tokenOk ? "Connected" : "Not connected"}
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-1">{conn?.config?.env ? `${conn.config.env} · ${conn.config.login}` : conn?.error || "—"}</p>
          </div>

          {/* Balance */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2"><FaWallet /> Balance</div>
            {balance?.supported ? (
              <p className="font-bold text-2xl" style={{ color: ORANGE }}>₹{Number(balance.available).toLocaleString("en-IN")}</p>
            ) : (
              <p className="font-bold text-gray-300 text-sm">Not exposed by API</p>
            )}
            <p className="text-[11px] text-gray-500 mt-1">{balance?.supported ? "Live from Blue Dart" : (balance?.note || "Credit / contract account")}</p>
          </div>

          {/* Active shipments */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2"><FaBoxOpen /> In Transit</div>
            <p className="font-bold text-2xl text-white">{active.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">active shipments with an AWB</p>
          </div>

          {/* Delivered */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2"><FaCheckCircle /> Delivered</div>
            <p className="font-bold text-2xl text-emerald-400">{delivered.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">completed deliveries</p>
          </div>
        </div>

        {/* Pickup addresses */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron text-lg font-bold flex items-center gap-2" style={{ color: ORANGE }}><FaMapMarkerAlt /> Pickup Addresses</h2>
          <button onClick={() => setEditing(blankAddr())} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-opacity" style={{ background: ORANGE }}>
            <FaPlus /> Add
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {addresses.length === 0 && <p className="text-gray-500 text-sm col-span-full">No pickup addresses yet. Add your origin/warehouse locations here.</p>}
          {addresses.map((a) => (
            <div key={a.id} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-white flex items-center gap-2">
                    {a.label}
                    {a.is_default && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-black" style={{ background: ORANGE }}>DEFAULT</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.contact_name} · {a.phone}</p>
                </div>
                <div className="flex gap-2 text-gray-400">
                  <button title={a.is_default ? "Default" : "Set default"} onClick={() => !a.is_default && makeDefault(a)} className={a.is_default ? "text-amber-400" : "hover:text-amber-400"}>
                    {a.is_default ? <FaStar /> : <FaRegStar />}
                  </button>
                  <button title="Edit" onClick={() => setEditing({ ...a })} className="hover:text-white"><FaPen /></button>
                  <button title="Delete" onClick={() => deleteAddr(a.id)} className="hover:text-red-400"><FaTrash /></button>
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                {a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ""}<br />
                {a.city}, {a.state} — {a.pincode}
                {a.origin_area ? <><br /><span className="text-gray-500">Area code: {a.origin_area}</span></> : null}
              </p>
            </div>
          ))}
        </div>

        {/* Pickups */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron text-lg font-bold flex items-center gap-2" style={{ color: ORANGE }}><FaTruck /> Pickups</h2>
          <button onClick={() => setPickupEdit(blankPickup())} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-opacity" style={{ background: ORANGE }}>
            <FaPlus /> Log Portal Pickup
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mb-4">App-booked pickups appear automatically. Blue Dart's API can't list portal-booked pickups, so log those here to keep everything in one place.</p>

        {pickups.length === 0 && <p className="text-gray-500 text-sm mb-12">No pickups yet.</p>}

        {pickups.length > 0 && (
          <div className="space-y-8 mb-12">
            {[{ title: "Scheduled", items: scheduledPickups }, { title: "Completed / Past", items: pastPickups }].map(group => group.items.length > 0 && (
              <div key={group.title}>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">{group.title} ({group.items.length})</p>
                <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Token</th>
                          <th className="px-4 py-3">Source</th>
                          <th className="px-4 py-3">Order</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Pcs · Wt</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">·</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p) => (
                          <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3">{p.pickup_date ? new Date(p.pickup_date).toLocaleDateString("en-IN") : "—"}{(p.ready_time || p.close_time) ? <div className="text-[11px] text-gray-500">{[p.ready_time, p.close_time].filter(Boolean).join("–")}</div> : null}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-300">{p.token || "—"}</td>
                            <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.source === "app" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-purple-500/15 text-purple-300 border-purple-500/30"}`}>{p.source}</span></td>
                            <td className="px-4 py-3 font-mono text-xs">{p.order_display_id || "—"}</td>
                            <td className="px-4 py-3 text-gray-300">{p.location_label || "—"}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{[p.pieces ? `${p.pieces} pc` : null, p.weight_kg ? `${p.weight_kg} kg` : null].filter(Boolean).join(" · ") || "—"}</td>
                            <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${PICKUP_STATUS[p.status] || "bg-white/5 text-gray-300 border-white/10"}`}>{p.status}</span></td>
                            <td className="px-4 py-3 text-right">
                              {p._kind === "logged" ? (
                                <span className="inline-flex gap-3 text-gray-400">
                                  <button title="Edit" onClick={() => setPickupEdit({ ...p })} className="hover:text-white"><FaPen /></button>
                                  <button title="Remove" onClick={() => deletePickup(p.id)} className="hover:text-red-400"><FaTrash /></button>
                                </span>
                              ) : <span className="text-[10px] text-gray-600">via order</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shipments */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-orbitron text-lg font-bold flex items-center gap-2" style={{ color: ORANGE }}><FaBoxOpen /> Shipments <span className="text-[11px] font-normal text-gray-500 normal-case tracking-normal">· click a row for live tracking</span></h2>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order, name, AWB, city…" className="bg-black border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm w-64 focus:border-amber-500 outline-none" />
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">AWB</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Synced</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No shipments with an AWB yet.</td></tr>
                )}
                {filtered.map((o) => {
                  const sa = o.shipping_address || {};
                  return (
                    <tr key={o.id} onClick={() => openDetail(o)} className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer">
                      <td className="px-4 py-3 font-mono text-xs">{o.display_id}</td>
                      <td className="px-4 py-3">{o.full_name || "—"}<div className="text-[11px] text-gray-500">{o.phone || ""}</div></td>
                      <td className="px-4 py-3 text-gray-300">{sa.city || "—"}{sa.pincode ? ` · ${sa.pincode}` : ""}</td>
                      <td className="px-4 py-3 font-mono text-xs text-amber-300">{o.awb_number || "—"}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusClass(o.shipping_status || o.status)}`}>{(o.shipping_status || o.status || "—").replace(/_/g, " ")}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{o.pickup_date ? new Date(o.pickup_date).toLocaleDateString("en-IN") : "—"}{o.pickup_token ? <div className="text-[10px] text-gray-500">#{o.pickup_token}</div> : null}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{o.tracking_last_synced ? new Date(o.tracking_last_synced).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shipment detail + live tracking modal */}
      {detail && (() => {
        const sa = detail.shipping_address || {};
        const dest = [sa.addressLine1 || sa.address, sa.addressLine2, sa.city, sa.state, sa.pincode].filter(Boolean).join(", ");
        const cell = "bg-black/30 border border-white/5 rounded-lg p-3";
        const k = "text-[10px] uppercase tracking-wider text-gray-500";
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-orbitron text-lg font-bold flex items-center gap-3">{detail.display_id}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusClass(detail.shipping_status || detail.status)}`}>{(detail.shipping_status || detail.status || "—").replace(/_/g, " ")}</span>
                </h3>
                <p className="text-xs text-amber-300 font-mono mt-1">AWB {detail.awb_number || "—"}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className={cell}><p className={k}>Customer</p><p className="text-sm text-white mt-1">{detail.full_name || "—"}</p><p className="text-xs text-gray-400">{detail.phone || ""}</p></div>
              <div className={cell}><p className={k}>Order Value</p><p className="text-sm text-white mt-1">₹{Number(detail.total_amount || 0).toLocaleString("en-IN")}</p></div>
              <div className={`${cell} col-span-2`}><p className={k}>Destination</p><p className="text-sm text-gray-200 mt-1">{dest || "—"}</p></div>
              <div className={cell}><p className={k}>Pickup</p><p className="text-sm text-white mt-1">{detail.pickup_date ? new Date(detail.pickup_date).toLocaleDateString("en-IN") : "Not booked"}</p>{detail.pickup_token ? <p className="text-[11px] text-gray-500">Token #{detail.pickup_token}</p> : null}</div>
              <div className={cell}><p className={k}>Packed Weight</p><p className="text-sm text-white mt-1">{detail.packed_weight_kg ? `${detail.packed_weight_kg} kg` : "—"}</p></div>
            </div>

            {/* Live tracking */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: ORANGE }}><FaTruck /> Live from Blue Dart</h4>
              <button onClick={() => detail.awb_number && liveTrack(detail.awb_number)} disabled={tracking || !detail.awb_number} className="flex items-center gap-2 px-3 py-1.5 border border-white/15 rounded-lg text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-50">
                <FaSync className={tracking ? "animate-spin" : ""} /> {tracking ? "Checking…" : "Refresh"}
              </button>
            </div>

            {tracking && <p className="text-sm text-gray-400">Fetching live status…</p>}
            {!tracking && live?.error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">{live.error}</div>}
            {!tracking && live && !live.error && (
              <>
                <p className="text-sm mb-3">Latest: <span className="font-bold text-white">{live.latest || "No scans yet"}</span></p>
                {(!live.scans || live.scans.length === 0) ? (
                  <p className="text-xs text-gray-500">Blue Dart has no scans for this AWB yet — the parcel hasn't been picked up / entered the network.</p>
                ) : (
                  <ol className="relative border-l border-white/10 ml-2 space-y-4">
                    {live.scans.map((s: any, i: number) => (
                      <li key={i} className="ml-4">
                        <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full" style={{ background: i === 0 ? ORANGE : "#555" }} />
                        <p className="text-sm text-white">{s.status || "—"}</p>
                        <p className="text-[11px] text-gray-500">{[s.date, s.location].filter(Boolean).join(" · ") || ""}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
            {!tracking && !live && !detail.awb_number && <p className="text-xs text-gray-500">No AWB on this order yet.</p>}
          </div>
        </div>
        );
      })()}

      {/* Pickup log editor modal */}
      {pickupEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !savingPickup && setPickupEdit(null)} />
          <div className="relative z-10 w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="font-orbitron text-lg font-bold mb-5">{pickupEdit.id ? "Edit" : "Log"} Pickup</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Pickup Date *</label><input type="date" value={pickupEdit.pickup_date || ""} onChange={e => setPickupEdit({ ...pickupEdit, pickup_date: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Blue Dart Token</label><input value={pickupEdit.token || ""} onChange={e => setPickupEdit({ ...pickupEdit, token: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Ready By</label><input type="time" value={pickupEdit.ready_time || ""} onChange={e => setPickupEdit({ ...pickupEdit, ready_time: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Closing</label><input type="time" value={pickupEdit.close_time || ""} onChange={e => setPickupEdit({ ...pickupEdit, close_time: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Pieces</label><input type="number" min="0" value={pickupEdit.pieces || ""} onChange={e => setPickupEdit({ ...pickupEdit, pieces: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Weight (kg)</label><input type="number" min="0" step="0.1" value={pickupEdit.weight_kg || ""} onChange={e => setPickupEdit({ ...pickupEdit, weight_kg: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Location / City</label><input value={pickupEdit.location_label || ""} onChange={e => setPickupEdit({ ...pickupEdit, location_label: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Order ID (optional)</label><input value={pickupEdit.order_display_id || ""} onChange={e => setPickupEdit({ ...pickupEdit, order_display_id: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Status</label>
                <select value={pickupEdit.status} onChange={e => setPickupEdit({ ...pickupEdit, status: e.target.value })} className={inp}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-span-2"><label className={lbl}>Remarks</label><input value={pickupEdit.remarks || ""} onChange={e => setPickupEdit({ ...pickupEdit, remarks: e.target.value })} className={inp} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPickupEdit(null)} disabled={savingPickup} className="flex-1 py-3 border border-white/10 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={savePickup} disabled={savingPickup} className="flex-1 py-3 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: ORANGE }}>
                {savingPickup ? "Saving…" : "Save Pickup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address editor modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !savingAddr && setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="font-orbitron text-lg font-bold mb-5">{editing.id ? "Edit" : "Add"} Pickup Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={lbl}>Label *</label><input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} placeholder="Bathinda HQ" className={inp} /></div>
              <div><label className={lbl}>Contact Name</label><input value={editing.contact_name} onChange={e => setEditing({ ...editing, contact_name: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Phone *</label><input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} className={inp} /></div>
              <div className="col-span-2"><label className={lbl}>Address Line 1 *</label><input value={editing.address_line1} onChange={e => setEditing({ ...editing, address_line1: e.target.value })} className={inp} /></div>
              <div className="col-span-2"><label className={lbl}>Address Line 2</label><input value={editing.address_line2 || ""} onChange={e => setEditing({ ...editing, address_line2: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>City *</label><input value={editing.city} onChange={e => setEditing({ ...editing, city: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>State *</label><input value={editing.state} onChange={e => setEditing({ ...editing, state: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Pincode *</label><input value={editing.pincode} onChange={e => setEditing({ ...editing, pincode: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Blue Dart Area Code</label><input value={editing.origin_area || ""} onChange={e => setEditing({ ...editing, origin_area: e.target.value })} placeholder="151001" className={inp} /></div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm mt-1">
                  <input type="checkbox" className="accent-amber-500 w-4 h-4" checked={!!editing.is_default} onChange={e => setEditing({ ...editing, is_default: e.target.checked })} />
                  Set as default pickup address
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} disabled={savingAddr} className="flex-1 py-3 border border-white/10 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={saveAddr} disabled={savingAddr} className="flex-1 py-3 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: ORANGE }}>
                {savingAddr ? "Saving…" : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
