"use client";

// Distributor Portal — styled to match the storefront (navbar capsule, left
// FilterSidebar, rb-surface-card product cards). Security model is unchanged:
// reads only the distributor_products view, writes only the two RPCs, never
// touches the products table. Access is gated behind a dedicated login form.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import FilterSidebar, { FilterGroupDef } from "@/components/ui/FilterSidebar";
import { FaSearch, FaPlus, FaArrowRight } from "react-icons/fa";

const CATEGORIES = [
  "cpu", "gpu", "motherboard", "ram", "storage", "psu", "cabinet", "cooler", "os",
  "prebuilt", "monitor", "keyboard", "mouse", "combo", "mousepad", "usb",
];

const money = (n: any) => (n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN"));
const maxPriceOf = (rows: Row[]) => {
  const ps = rows.map((r) => Number(r.distributor_price)).filter((n) => Number.isFinite(n) && n > 0);
  return ps.length ? Math.max(1000, Math.ceil(Math.max(...ps) / 1000) * 1000) : 100000;
};

type Phase = "loading" | "login" | "portal" | "denied";
type Row = {
  id: string; display_name: string; nickname: string | null; category: string;
  brand: string | null; image_url: string | null; mrp: number | null;
  distributor_price: number | null; in_stock: boolean;
  _status?: string; _ok?: boolean; _saving?: boolean;
};

export default function DistributorPortal() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [who, setWho] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  // Navbar is portaled to <body> so position:fixed escapes template.tsx's
  // transform/filter wrapper (same reason NavbarNeo does it).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Proper category display names (same source as the storefront navbar).
  const [catLabels, setCatLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase.from("categories").select("id, name, short_name").then(({ data }) => {
      if (!data) return;
      const m: Record<string, string> = {};
      for (const c of data as any[]) m[c.id] = c.name || c.short_name || c.id;
      setCatLabels(m);
    });
  }, []);
  const pretty = (slug: string) =>
    catLabels[slug] || String(slug).replace(/[-_]/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

  // filters: { category: string[], price: [lo,hi] } — wired to FilterSidebar
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({ category: [], price: null });

  // add form
  const [showAdd, setShowAdd] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newMrp, setNewMrp] = useState("");
  const [addStatus, setAddStatus] = useState<{ msg: string; ok?: boolean }>({ msg: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) { setWho(data.session.user.email || ""); await resolveAccess(); }
      else setPhase("login");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveAccess = async () => {
    const { data, error } = await supabase
      .from("distributor_products").select("*").order("category").order("display_name");
    if (error || !data || data.length === 0) { setPhase("denied"); return; }
    const mapped = data as Row[];
    setRows(mapped);
    setFilters((f) => ({ ...f, price: [0, maxPriceOf(mapped)] }));
    setPhase("portal");
  };

  const signIn = async () => {
    setLoginError(""); setSigningIn(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSigningIn(false);
    if (error) { setLoginError(error.message); return; }
    setWho(data.user?.email || ""); setPhase("loading"); await resolveAccess();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRows([]); setEmail(""); setPassword(""); setPhase("login");
  };

  const patchRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (row: Row) => {
    const price = Number(row.distributor_price);
    if (!Number.isFinite(price) || price <= 0) { patchRow(row.id, { _status: "enter a price", _ok: false }); return; }
    patchRow(row.id, { _saving: true, _status: "saving…", _ok: undefined });
    const { error } = await supabase.rpc("distributor_update_price", {
      p_id: row.id, p_distributor_price: price, p_in_stock: !!row.in_stock,
    });
    if (error) { patchRow(row.id, { _saving: false, _status: error.message, _ok: false }); return; }
    patchRow(row.id, { _saving: false, _status: "saved", _ok: true });
    setTimeout(() => patchRow(row.id, { _status: "" }), 2500);
  };

  const addProduct = async () => {
    const price = parseFloat(newPrice);
    const mrp = parseFloat(newMrp);
    if (!newNickname.trim() || !newCategory || !Number.isFinite(price)) {
      setAddStatus({ msg: "name, category and price are all needed", ok: false }); return;
    }
    setAdding(true); setAddStatus({ msg: "adding…" });
    const { error } = await supabase.rpc("distributor_add_product", {
      p_nickname: newNickname.trim(), p_category: newCategory,
      p_distributor_price: price, p_mrp: Number.isFinite(mrp) ? mrp : null,
    });
    setAdding(false);
    if (error) { setAddStatus({ msg: error.message, ok: false }); return; }
    setAddStatus({ msg: "sent for review", ok: true });
    setNewNickname(""); setNewPrice(""); setNewMrp("");
    await resolveAccess();
  };

  // --- filter config + filtering ---
  const groups: FilterGroupDef[] = useMemo(() => {
    const cats = Array.from(new Set(rows.map((r) => r.category).filter(Boolean)))
      .sort((a, b) => pretty(a).localeCompare(pretty(b)));
    return [
      { key: "category", label: "Category", type: "checkbox", options: cats.map((c) => ({ value: c, label: pretty(c) })), defaultOpen: true },
      { key: "price", label: "Your Price", type: "range", min: 0, max: maxPriceOf(rows), step: 500, prefix: "₹", defaultOpen: true },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, catLabels]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cats: string[] = filters.category || [];
    const range: [number, number] | null = filters.price || null;
    return rows.filter((p) => {
      if (cats.length && !cats.includes(p.category)) return false;
      if (q && !`${p.display_name} ${p.nickname ?? ""}`.toLowerCase().includes(q)) return false;
      if (range) { const price = Number(p.distributor_price); if (p.distributor_price != null && (price < range[0] || price > range[1])) return false; }
      return true;
    });
  }, [rows, search, filters]);

  const setFilter = (key: string, next: any) => setFilters((f) => ({ ...f, [key]: next }));
  const clearAll = () => setFilters({ category: [], price: [0, maxPriceOf(rows)] });

  // ---- LOADING ----
  if (phase === "loading") {
    return <div className="min-h-screen bg-rb-black flex items-center justify-center text-rb-white font-orbitron animate-pulse">Loading distributor portal…</div>;
  }

  // ---- SPECIALIZED LOGIN / DENIED GATE ----
  if (phase === "login" || phase === "denied") {
    return (
      <div className="min-h-screen bg-rb-black text-rb-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <img src="/icons/icon_only.svg" alt="Rig Builders" className="w-9 h-9" />
            <span className="font-orbitron font-black tracking-[0.18em] text-sm">RIG<span className="text-rb-orange">BUILDERS</span></span>
          </div>
          <div className="rb-surface-card p-7">
            <h1 className="font-orbitron text-lg font-bold tracking-wide">Distributor Portal</h1>
            <p className="text-xs text-rb-silver mt-1">Partner access only. Sign in with the account Rig Builders created for you.</p>
            {phase === "denied" ? (
              <div className="mt-6">
                <div className="bg-rb-danger/10 border border-rb-danger/30 rounded-lg p-3 text-sm text-rb-danger">
                  This account doesn’t have distributor access. If you believe this is an error, contact Rig Builders.
                </div>
                <button onClick={signOut} className="w-full mt-4 py-2.5 border border-rb-line rounded-lg text-sm font-bold text-rb-silver hover:bg-white/5">Use a different account</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-6">
                <input className="bg-rb-black/50 border border-rb-line rounded-lg px-3 py-2.5 text-sm focus:border-rb-orange outline-none" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="bg-rb-black/50 border border-rb-line rounded-lg px-3 py-2.5 text-sm focus:border-rb-orange outline-none" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") signIn(); }} />
                <button onClick={signIn} disabled={signingIn} className="rb-cta py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-50">{signingIn ? "Signing in…" : "Sign in"}</button>
                {loginError && <span className="text-xs text-rb-danger">{loginError}</span>}
              </div>
            )}
          </div>
          <p className="text-[11px] text-rb-silver/50 text-center mt-5">Rig Builders · Partner Portal</p>
        </div>
      </div>
    );
  }

  // ---- PORTAL ----
  const fieldCls = "bg-rb-black/50 border border-rb-line rounded-lg px-3 py-2 text-sm text-rb-white focus:border-rb-orange outline-none";
  return (
    <div className="min-h-screen bg-rb-black text-rb-white">
      {/* Minimal storefront-style navbar capsule (logo + portal + sign out only).
          Portaled to <body> so position:fixed isn't trapped by template.tsx. */}
      {mounted && createPortal(
        <header className="fixed top-0 inset-x-0 z-[100]">
          <div className="rb-shell">
            <div className="relative mt-3 sm:mt-4 flex items-center justify-between gap-3 h-[56px] sm:h-[60px] px-4 sm:px-8 rounded-[18px] sm:rounded-full backdrop-blur-md backdrop-saturate-150 bg-rb-black/85 border border-white/10 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.6)]">
              <span className="absolute top-0 left-8 right-8 h-[1.5px] rb-bar-anim rounded-full opacity-70" />
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/icons/icon_only.svg" alt="Rig Builders" className="w-8 h-8 shrink-0" />
                <div className="leading-tight min-w-0">
                  <div className="font-orbitron font-black tracking-[0.16em] text-[12px]">RIG<span className="text-rb-orange">BUILDERS</span></div>
                  <div className="text-[10px] text-rb-silver truncate">Distributor Portal · {who}</div>
                </div>
              </div>
              <button onClick={signOut} className="shrink-0 px-4 py-2 border border-rb-line rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-rb-silver hover:text-rb-white hover:border-rb-orange/50 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </header>,
        document.body
      )}
      <div aria-hidden style={{ height: 84 }} />

      <section className="rb-shell py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
          {/* LEFT — reusable filter sidebar */}
          <FilterSidebar groups={groups} value={filters} onChange={setFilter} onClearAll={clearAll} resultCount={visible.length} stickyTop={104} title="Filters" />

          {/* RIGHT — toolbar + add form + grid */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-rb-silver/60 text-xs" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or nickname" className={`${fieldCls} w-full pl-9`} />
              </div>
              <span className="text-[10px] text-rb-silver uppercase tracking-widest">{visible.length} of {rows.length}</span>
              <button onClick={() => setShowAdd((s) => !s)} className="rb-cta px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.14em] flex items-center gap-2">
                <FaPlus size={10} /> Add a product
              </button>
            </div>

            {showAdd && (
              <div className="rb-surface-card p-5 mb-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <input className={`${fieldCls} flex-1 min-w-[220px]`} placeholder="Product name / model" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} />
                  <select className={fieldCls} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    <option value="">category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                  </select>
                  <input className={`${fieldCls} w-[140px]`} type="number" placeholder="your price ₹" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                  <input className={`${fieldCls} w-[150px]`} type="number" placeholder="MRP ₹ (optional)" value={newMrp} onChange={(e) => setNewMrp(e.target.value)} />
                  <button onClick={addProduct} disabled={adding} className="rb-cta px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-50">Add</button>
                  {addStatus.msg && <span className={`text-xs ${addStatus.ok === false ? "text-rb-danger" : addStatus.ok ? "text-emerald-400" : "text-rb-silver"}`}>{addStatus.msg}</span>}
                </div>
                <p className="text-[11px] text-rb-silver/70 mt-3">Added products go to Rig Builders for review — they don’t appear on the website until checked.</p>
              </div>
            )}

            {visible.length === 0 ? (
              <div className="h-[40vh] flex flex-col items-center justify-center text-rb-silver border border-dashed border-rb-line rounded-2xl">
                <p className="font-orbitron text-lg mb-1 uppercase">Nothing matches</p>
                <p className="text-xs text-rb-silver/50 uppercase tracking-widest">Try adjusting the filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                {visible.map((p) => (
                  <div key={p.id} className="group relative rb-surface-card overflow-hidden flex flex-col h-full">
                    {!p.in_stock && (
                      <div className="absolute top-3 right-3 z-20 bg-rb-danger text-white text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-widest">Out of Stock</div>
                    )}
                    <div className="relative aspect-square w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-rb-surface to-transparent border-b border-rb-line">
                      <div className="absolute inset-0 bg-rb-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl z-0" />
                      {p.image_url
                        ? <img src={p.image_url} alt={p.display_name} loading="lazy" className="w-full h-full object-contain relative z-10 group-hover:scale-[1.1] transition-transform duration-700 p-2" />
                        : <span className="text-rb-silver/20 font-saira text-xl font-bold -rotate-12 select-none px-4 text-center">{p.display_name}</span>}
                    </div>

                    <div className="p-5 flex flex-col flex-grow relative z-10">
                      <span className="text-[10px] font-bold text-rb-orange tracking-[0.2em] uppercase mb-2 block">{p.brand || pretty(p.category)}</span>
                      <h4 className="text-rb-white font-saira text-sm leading-tight line-clamp-2 uppercase mb-2 min-h-[36px]">{p.display_name}</h4>
                      <div className="text-[11px] text-rb-silver/70 mb-4">{pretty(p.category)}{p.mrp ? ` · MRP ${money(p.mrp)}` : ""}</div>

                      <div className="mt-auto pt-4 border-t border-rb-line">
                        <p className="text-[10px] text-rb-silver uppercase tracking-widest mb-2">Your Price</p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rb-silver/60 text-sm">₹</span>
                            <input type="number" value={p.distributor_price ?? ""} placeholder="price"
                              onChange={(e) => patchRow(p.id, { distributor_price: e.target.value === "" ? null : Number(e.target.value) })}
                              className={`${fieldCls} w-full pl-6`} />
                          </div>
                          <select value={p.in_stock ? "true" : "false"} onChange={(e) => patchRow(p.id, { in_stock: e.target.value === "true" })} className={fieldCls}>
                            <option value="true">In stock</option>
                            <option value="false">Out</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => save(p)} disabled={p._saving} className="rb-cta px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50 flex items-center gap-1.5">
                            {p._saving ? "Saving…" : <>Save <FaArrowRight size={9} /></>}
                          </button>
                          {p._status && <span className={`text-[11px] ${p._ok === false ? "text-rb-danger" : p._ok ? "text-emerald-400" : "text-rb-silver"}`}>{p._status}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
