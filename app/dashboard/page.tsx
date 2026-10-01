"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaBoxOpen, FaSave, FaMicrochip, FaTrash, FaMapMarkerAlt, FaImage, FaSignOutAlt } from "react-icons/fa";
import OrderTimeline from "@/components/OrderTimeline";
import AddressBook from "@/components/account/AddressBook";

// Statuses a customer may still cancel (mirrors the API's allow-list).
const CANCELLABLE = ["pending", "paid", "payment_received", "processing", "procurement"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);

  // Open a specific tab when arrived via ?tab= (e.g. redirect from /account/addresses).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && ["orders", "saved", "addresses"].includes(t)) setActiveTab(t);
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

          {activeTab === "addresses" && <AddressBook />}
        </section>
      </div>

      <Footer />
    </main>
  );
}

function SidebarBtn({ icon, label, isActive, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full text-left px-5 py-3.5 rounded-lg flex items-center gap-3 transition-all ${isActive ? "bg-rb-orange text-rb-orange-ink font-bold shadow-[0_0_20px_-6px_rgba(255,90,31,0.7)]" : "text-rb-silver hover:bg-white/5 hover:text-rb-white"}`}>
      <span className="text-base">{icon}</span>
      <span className="font-saira">{label}</span>
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
