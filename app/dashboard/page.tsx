"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaBoxOpen, FaSave, FaMicrochip, FaTrash, FaMapMarkerAlt, FaImage, FaSignOutAlt, FaFileInvoiceDollar, FaDownload, FaTimes, FaCheckCircle } from "react-icons/fa";
import OrderTimeline from "@/components/OrderTimeline";
import AddressBook from "@/components/account/AddressBook";
import { toast } from "sonner";

const inr = (n: any) => Number(n || 0).toLocaleString("en-IN");

// Statuses a customer may still cancel (mirrors the API's allow-list).
const CANCELLABLE = ["pending", "paid", "payment_received", "processing", "procurement"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [viewQuote, setViewQuote] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Open a specific tab when arrived via ?tab= (e.g. redirect from /account/addresses
  // or the quotation login link, which lands on ?tab=quotations&welcome=1).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && ["orders", "saved", "addresses", "quotations"].includes(t)) setActiveTab(t);
  }, []);

  useEffect(() => {
    let channelOrders: any;
    let channelOps: any;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setUser(user);

      // 1. FETCH ORDERS
      const { data: newOrdersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      const { data: oldOrdersData } = await supabase
        .from("orders_ops")
        .select(`*, procurement_items ( product_name, category )`)
        .eq("customer_id", user.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      const formattedNew = (newOrdersData || []).map((o) => ({
        id: o.id, display_id: o.display_id, created_at: o.created_at, total_amount: o.total_amount,
        status: o.status, source_table: "orders", awb_number: o.awb_number || null,
        itemsList: o.items?.map((i: any) => ({ product_name: i.name || i.product_name, category: i.category, image: i.image_url || i.image || i.img || null })) || [],
      }));

      const formattedOld = (oldOrdersData || []).map((o) => ({
        id: o.id, display_id: o.order_display_id, created_at: o.created_at, total_amount: o.total_amount,
        status: o.status, source_table: "orders_ops", itemsList: o.procurement_items || [],
      }));

      setOrders([...formattedNew, ...formattedOld].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // 2. FETCH SAVED CONFIGURATIONS
      const { data: savedData } = await supabase
        .from("saved_configurations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSavedConfigs(savedData || []);

      // 3. FETCH QUOTATIONS (finalized only; RLS restricts to this user).
      const { data: quoteData } = await supabase
        .from("quotations")
        .select("id, quotation_no, title, customer, total, valid_until, created_at, delivery, gst_location, gst_inclusive, data")
        .eq("user_id", user.id)
        .eq("status", "final")
        .order("created_at", { ascending: false });
      setQuotations(quoteData || []);

      // First-time welcome: the account was auto-created from a quotation and the
      // customer hasn't been onboarded yet (or arrived via the login link).
      const meta = user.user_metadata || {};
      if (meta.source === "quotation" && meta.onboarded !== true) {
        setShowWelcome(true);
      }

      setLoading(false);

      // --- REAL-TIME LISTENERS ---
      channelOrders = supabase
        .channel(`dashboard-orders-${user.id}`)
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setOrders((prev) => prev
              .map((o) => (o.id === payload.new.id && o.source_table === "orders" ? { ...o, status: payload.new.status } : o))
              .filter((o) => o.status !== "cancelled"));
          })
        .subscribe();

      channelOps = supabase
        .channel(`dashboard-ops-${user.id}`)
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders_ops", filter: `customer_id=eq.${user.id}` },
          (payload) => {
            setOrders((prev) => prev
              .map((o) => (o.id === payload.new.id && o.source_table === "orders_ops" ? { ...o, status: payload.new.status } : o))
              .filter((o) => o.status !== "cancelled"));
          })
        .subscribe();
    };

    fetchData();

    return () => {
      if (channelOrders) supabase.removeChannel(channelOrders);
      if (channelOps) supabase.removeChannel(channelOps);
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  // Cancel via the server API (service-role, ownership-checked, soft-cancel).
  const handleCancelOrder = async (orderId: string, table: string) => {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { alert("Your session expired — please sign in again."); return; }

    const res = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, table }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { alert(json.error || "Could not cancel this order."); return; }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm("Delete this saved build?")) return;
    const { error } = await supabase.from("saved_configurations").delete().eq("id", id);
    if (!error) setSavedConfigs((prev) => prev.filter((c) => c.id !== id));
    else alert("Could not delete: " + error.message);
  };

  // Download a quotation PDF (server-rendered, ownership-checked).
  const handleDownloadQuote = async (q: any) => {
    setDownloadingId(q.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Your session expired — please sign in again."); return; }
      const res = await fetch(`/api/quotations/${q.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Download failed"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${q.quotation_no || "RigBuilders_Quotation"}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || "Could not download the quotation.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Mark the customer onboarded so the welcome popup doesn't reappear.
  const dismissWelcome = async () => {
    setShowWelcome(false);
    try { await supabase.auth.updateUser({ data: { onboarded: true } }); } catch { /* best-effort */ }
  };
  const resendLoginLink = async () => {
    try {
      if (!user?.email) return;
      await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email }) });
      toast.success("Login link sent", { description: `Check ${user.email} for a secure sign-in link.` });
    } catch { toast.error("Could not send the link. Please try again."); }
  };

  // Line items + totals for the on-page quotation viewer (mirrors the PDF math).
  const quoteLines = (q: any) => {
    const lines: { label: string; name: string; qty: number; price: number }[] = [];
    for (const c of q?.data?.cats || []) for (const p of c.parts || []) if (p?.name) lines.push({ label: c.label || c.dbCat, name: p.name, qty: Number(p.qty) || 1, price: Number(p.price) || 0 });
    return lines;
  };
  const quoteTotals = (q: any) => {
    const face = quoteLines(q).reduce((s, l) => s + l.price * l.qty, 0);
    const showGst = q?.data?.showGst !== false;
    const allIn = q?.gst_inclusive ? face : face * 1.18;
    const taxable = allIn / 1.18;
    const gst = allIn - taxable;
    const delivery = Number(q?.delivery) || 0;
    const goods = showGst ? allIn : face;
    return { face, showGst, taxable, gst, gstHalf: gst / 2, delivery, grand: goods + delivery };
  };

  const getProgressWidth = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) return "100%";
    if (s.includes("shipped") || s.includes("dispatch") || s.includes("ready_to_ship")) return "75%";
    if (s.includes("assembly") || s.includes("build") || s.includes("procurement")) return "50%";
    if (s.includes("paid") || s.includes("processing") || s.includes("confirmed")) return "25%";
    return "5%";
  };

  if (loading)
    return (
      <div className="min-h-screen bg-rb-black flex items-center justify-center text-rb-silver font-saira">
        <span className="animate-pulse tracking-widest uppercase text-sm">Loading dashboard…</span>
      </div>
    );

  const fullName = user?.user_metadata?.full_name || "Valued User";

  return (
    <main className="min-h-screen bg-rb-black text-white font-saira flex flex-col">
      <NavbarNeo />

      <div className="rb-shell py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 flex-grow">

        {/* SIDEBAR */}
        <aside className="lg:col-span-1 lg:sticky lg:top-[104px] self-start space-y-4">
          <div className="rb-surface-card p-6 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-orbitron font-black text-2xl text-rb-orange-ink bg-gradient-to-br from-rb-orange to-rb-orange-deep shadow-[0_0_28px_-6px_rgba(255,90,31,0.6)]">
              {fullName[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="font-orbitron font-bold text-lg text-rb-white truncate">{fullName}</h2>
            <p className="text-xs text-rb-silver truncate px-2">{user?.email}</p>
          </div>

          <nav className="rb-surface-card p-2 space-y-1">
            <SidebarBtn icon={<FaBoxOpen />} label="My Orders" isActive={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
            <SidebarBtn icon={<FaFileInvoiceDollar />} label="Quotations" isActive={activeTab === "quotations"} onClick={() => setActiveTab("quotations")} badge={quotations.length || undefined} />
            <SidebarBtn icon={<FaSave />} label="Saved Configs" isActive={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
            <SidebarBtn icon={<FaMapMarkerAlt />} label="Address Book" isActive={activeTab === "addresses"} onClick={() => setActiveTab("addresses")} />
            <button onClick={handleSignOut} className="w-full text-left px-5 py-3.5 rounded-lg text-rb-silver hover:bg-rb-danger/10 hover:text-rb-danger transition-colors flex items-center gap-3">
              <span className="text-base"><FaSignOutAlt /></span>
              <span className="font-saira">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <section className="lg:col-span-3 rb-surface-card p-5 sm:p-8 min-h-[600px]">

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div>
                <span className="rb-kicker">Track & manage</span>
                <h2 className="mt-1 font-orbitron text-2xl sm:text-3xl font-black uppercase text-rb-white">Order <span className="rb-text-ember">History</span></h2>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-rb-line rounded-xl">
                  <p className="text-rb-silver">No active orders found.</p>
                  <Link href="/products" className="rb-text-ember text-sm mt-2 inline-block font-bold uppercase tracking-widest">Browse Products →</Link>
                </div>
              ) : (
                orders.map((order) => {
                  const status = order.status || "pending";
                  const isCancelled = status === "cancelled";
                  const canCancel = CANCELLABLE.includes(status);
                  return (
                    <div key={order.id} className="rb-surface-card !bg-rb-black p-5 sm:p-6 relative overflow-hidden">
                      {/* HEADER ROW */}
                      <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-rb-surface rounded-lg flex items-center justify-center border border-rb-line shrink-0">
                            <FaMicrochip size={20} className="text-rb-orange" />
                          </div>
                          <div>
                            <h3 className="font-orbitron font-bold text-rb-white text-lg tracking-wide">{order.display_id}</h3>
                            <p className="text-xs text-rb-silver">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-orbitron font-bold text-xl text-rb-white">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</p>
                          <div className="flex items-center justify-end gap-2 mt-1.5">
                            <span className={`text-[10px] uppercase px-2.5 py-1 rounded font-bold tracking-wider ${isCancelled ? "bg-rb-danger/20 text-rb-danger" : "bg-rb-orange/15 text-rb-orange"}`}>
                              {status.replace(/_/g, " ")}
                            </span>
                            {canCancel && (
                              <button onClick={() => handleCancelOrder(order.id, order.source_table)} className="text-rb-danger hover:bg-rb-danger/10 p-1.5 rounded transition-colors" title="Cancel order">
                                <FaTrash size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PRODUCT GRID */}
                      <div className="bg-rb-surface rounded-lg p-4 mb-5 border border-rb-line">
                        <h4 className="text-[10px] font-bold text-rb-silver uppercase mb-3 tracking-wider">Order Items</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {order.itemsList?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 bg-rb-black/60 p-2 rounded-lg border border-rb-line hover:border-rb-orange/40 transition-colors">
                              <div className="w-12 h-12 bg-rb-black rounded flex items-center justify-center overflow-hidden border border-rb-line shrink-0">
                                {item.image ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" /> : <FaImage className="text-white/20 text-lg" />}
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-rb-white truncate w-full" title={item.product_name}>{item.product_name}</p>
                                <p className="text-[10px] text-rb-silver uppercase">{item.category || "Component"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PROGRESS BAR */}
                      {!isCancelled && (
                        <div className="pt-1">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-rb-orange to-rb-orange-deep transition-all duration-1000" style={{ width: getProgressWidth(status) }} />
                          </div>
                          <div className="flex justify-between text-[10px] uppercase text-rb-silver mt-2 tracking-wider">
                            <span>Placed</span><span>Processing</span><span>Building</span><span>Shipped</span>
                          </div>
                        </div>
                      )}

                      {/* LIVE STATUS TIMELINE */}
                      <OrderTimeline orderId={order.id} awb={order.awb_number} />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div className="space-y-6">
              <div>
                <span className="rb-kicker">Your builds</span>
                <h2 className="mt-1 font-orbitron text-2xl sm:text-3xl font-black uppercase text-rb-white">Saved <span className="rb-text-ember">Configs</span></h2>
              </div>

              {savedConfigs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-rb-line rounded-xl">
                  <p className="text-rb-silver">No saved configurations found.</p>
                  <Link href="/configure" className="rb-text-ember text-sm mt-2 inline-block font-bold uppercase tracking-widest">Create New Build →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedConfigs.map((config, index) => (
                    <div key={config.id} className="rb-surface-card !bg-rb-black p-5 group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-orbitron font-bold text-rb-white text-lg">Build {index + 1}</h3>
                          <p className="text-xs text-rb-silver">Saved on {new Date(config.created_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleDeleteConfig(config.id)} className="text-rb-silver hover:text-rb-danger transition-colors p-2">
                          <FaTrash size={14} />
                        </button>
                      </div>

                      <div className="space-y-2 mb-4">
                        <SpecRow icon={<FaMicrochip />} label="Processor" value={config.specs?.cpu?.name} />
                        <SpecRow icon={<FaBoxOpen />} label="Graphics Card" value={config.specs?.gpu?.name} />
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-rb-line">
                        <span className="text-rb-white font-orbitron font-bold">₹{Number(config.total_price || 0).toLocaleString("en-IN")}</span>
                        <Link href={`/build/${config.id}`} className="text-[10px] uppercase font-bold tracking-widest text-rb-silver hover:text-rb-orange transition-colors">
                          View Config →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "quotations" && (
            <div className="space-y-6">
              <div>
                <span className="rb-kicker">Your estimates</span>
                <h2 className="mt-1 font-orbitron text-2xl sm:text-3xl font-black uppercase text-rb-white">Your <span className="rb-text-ember">Quotations</span></h2>
              </div>

              {quotations.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-rb-line rounded-xl">
                  <p className="text-rb-silver">No quotations yet.</p>
                  <p className="text-rb-silver/60 text-xs mt-1">When we prepare a quotation for you, it will appear here to view and download.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quotations.map((q) => {
                    const t = quoteTotals(q);
                    const expired = q.valid_until && new Date(q.valid_until) < new Date();
                    return (
                      <div key={q.id} className="relative rb-surface-card !bg-rb-black p-5 group overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rb-orange to-rb-orange-deep" />
                        <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-widest text-rb-orange uppercase">{q.quotation_no || "Quotation"}</p>
                            <h3 className="font-orbitron font-bold text-rb-white text-lg truncate" title={q.title}>{q.title || "Custom Build"}</h3>
                            <p className="text-xs text-rb-silver">Issued {new Date(q.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-rb-surface border border-rb-line flex items-center justify-center text-rb-orange shrink-0"><FaFileInvoiceDollar /></div>
                        </div>

                        <div className="flex items-end justify-between pt-3 border-t border-rb-line">
                          <div>
                            <p className="text-[10px] text-rb-silver uppercase tracking-wider">Final amount</p>
                            <p className="font-orbitron font-black text-xl text-rb-white">₹{inr(q.total || t.grand)}</p>
                            {q.valid_until && (
                              <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${expired ? "text-rb-danger" : "text-rb-silver"}`}>
                                {expired ? "Expired" : "Valid until"} {new Date(q.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setViewQuote(q)} className="px-3 py-2 rounded-lg text-xs font-bold border border-rb-line text-rb-silver hover:text-rb-white hover:border-rb-orange/50 transition-colors">View</button>
                            <button onClick={() => handleDownloadQuote(q)} disabled={downloadingId === q.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-rb-orange text-rb-orange-ink hover:brightness-110 transition disabled:opacity-50">
                              <FaDownload size={11} /> {downloadingId === q.id ? "…" : "PDF"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && <AddressBook />}
        </section>
      </div>

      {/* QUOTATION VIEWER */}
      {viewQuote && (() => {
        const t = quoteTotals(viewQuote);
        const lines = quoteLines(viewQuote);
        return (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewQuote(null)}>
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-[#161616] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setViewQuote(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"><FaTimes size={18} /></button>
              <div className="p-7 sm:p-9">
                <div className="flex items-start justify-between border-b-2 border-[#161616] pb-4">
                  <div>
                    <p className="font-orbitron font-black text-lg tracking-wide">RIG<span className="text-rb-orange">BUILDERS</span></p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Custom Gaming PCs &amp; Workstations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-orbitron font-bold text-lg uppercase">Quotation</p>
                    {viewQuote.quotation_no && <p className="text-sm font-bold">{viewQuote.quotation_no}</p>}
                    <p className="text-xs text-gray-500">{new Date(viewQuote.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>

                {(viewQuote.title || viewQuote.customer) && (
                  <div className="mt-4">
                    {viewQuote.title && <p className="font-bold text-sm">{viewQuote.title}</p>}
                    {viewQuote.customer && <p className="text-xs text-gray-500">Prepared for {viewQuote.customer}</p>}
                  </div>
                )}

                <table className="w-full mt-5 text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#161616] text-[10px] uppercase tracking-wider text-gray-500">
                      <th className="text-left py-2 font-bold">Component</th>
                      <th className="text-left py-2 font-bold">Specification</th>
                      <th className="text-right py-2 font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="py-2.5 font-bold whitespace-nowrap pr-3">{l.label}{l.qty > 1 ? ` ×${l.qty}` : ""}</td>
                        <td className="py-2.5 text-gray-700">{l.name}</td>
                        <td className="py-2.5 text-right tabular-nums">₹{inr(l.price * l.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="ml-auto w-full sm:w-72 mt-5 text-sm">
                  {t.showGst ? (
                    <>
                      <Row label="Taxable value" value={`₹${inr(t.taxable)}`} muted />
                      {viewQuote.gst_location === "outside"
                        ? <Row label="IGST @ 18%" value={`₹${inr(t.gst)}`} muted />
                        : <><Row label="CGST @ 9%" value={`₹${inr(t.gstHalf)}`} muted /><Row label="SGST @ 9%" value={`₹${inr(t.gstHalf)}`} muted /></>}
                    </>
                  ) : (
                    <Row label="Subtotal" value={`₹${inr(t.face)}`} muted />
                  )}
                  {t.delivery > 0 && <Row label="Delivery (insured)" value={`₹${inr(t.delivery)}`} muted />}
                  <div className="flex justify-between items-center border-t-2 border-[#161616] mt-2 pt-3">
                    <span className="font-orbitron font-black">Final Amount</span>
                    <span className="font-orbitron font-black text-rb-orange text-lg">₹{inr(viewQuote.total || t.grand)}</span>
                  </div>
                </div>

                <button onClick={() => handleDownloadQuote(viewQuote)} disabled={downloadingId === viewQuote.id} className="w-full mt-7 flex items-center justify-center gap-2 bg-[#161616] text-white py-3 rounded-xl font-bold hover:bg-rb-orange hover:text-rb-orange-ink transition disabled:opacity-50">
                  <FaDownload size={13} /> {downloadingId === viewQuote.id ? "Preparing…" : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* NEW-CUSTOMER WELCOME */}
      {showWelcome && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-rb-surface border border-rb-line rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rb-orange to-rb-orange-deep" />
            <button onClick={dismissWelcome} className="absolute top-4 right-4 text-rb-silver hover:text-rb-white"><FaTimes size={16} /></button>
            <div className="p-7 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-rb-orange bg-rb-orange/10 text-2xl"><FaCheckCircle /></div>
              <h3 className="font-orbitron font-black text-xl text-rb-white uppercase">Welcome aboard</h3>
              <p className="text-rb-silver text-sm mt-3 leading-relaxed">
                We created this account for you from your quotation. Everything we quote is right here — view the details and download a PDF anytime.
              </p>
              <p className="text-rb-silver/70 text-xs mt-2">Set a password so you can log back in whenever you like.</p>
              <div className="mt-6 space-y-2.5">
                <button onClick={() => { dismissWelcome(); router.push("/auth/update-password"); }} className="w-full bg-rb-orange text-rb-orange-ink py-3 rounded-xl font-bold hover:brightness-110 transition">Set a password</button>
                <button onClick={resendLoginLink} className="w-full border border-rb-line text-rb-silver hover:text-rb-white py-2.5 rounded-xl text-sm font-bold transition">Email me a login link</button>
                <button onClick={() => { dismissWelcome(); setActiveTab("quotations"); }} className="w-full text-rb-silver/70 hover:text-rb-white py-1.5 text-xs font-bold uppercase tracking-wider transition">Skip for now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${muted ? "text-gray-500" : "text-[#161616]"}`}>
      <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
  );
}

function SidebarBtn({ icon, label, isActive, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={`w-full text-left px-5 py-3.5 rounded-lg flex items-center gap-3 transition-all ${isActive ? "bg-rb-orange text-rb-orange-ink font-bold shadow-[0_0_20px_-6px_rgba(255,90,31,0.7)]" : "text-rb-silver hover:bg-white/5 hover:text-rb-white"}`}>
      <span className="text-base">{icon}</span>
      <span className="font-saira flex-1">{label}</span>
      {badge ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-rb-orange-ink/20 text-rb-orange-ink" : "bg-rb-orange/15 text-rb-orange"}`}>{badge}</span> : null}
    </button>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 bg-rb-surface p-2 rounded-lg border border-rb-line">
      <div className="w-8 h-8 bg-rb-black/60 rounded flex items-center justify-center text-rb-orange shrink-0">{icon}</div>
      <div className="overflow-hidden">
        <p className="text-xs text-rb-white truncate">{value || `No ${label} selected`}</p>
        <p className="text-[10px] text-rb-silver">{label}</p>
      </div>
    </div>
  );
}
