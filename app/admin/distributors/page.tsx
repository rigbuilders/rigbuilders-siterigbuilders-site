"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaHandshake, FaPlus, FaTrash, FaInbox, FaHistory, FaExternalLinkAlt, FaPen, FaKey, FaSearch } from "react-icons/fa";

const money = (n: any) => (n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN"));
const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDateTime = (d: any) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—");

export default function DistributorsAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [distributors, setDistributors] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [log, setLog] = useState<any[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  // edit distributor
  const [editing, setEditing] = useState<any>(null); // { user_id, email, label, newPassword }
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState("");

  // access / scope
  const [scopeFor, setScopeFor] = useState<any>(null); // the distributor row
  const [scope, setScope] = useState<any>(null);        // { mode, categories[], brands[], products[] }
  const [catalog, setCatalog] = useState<any>({ categories: [], brands: [], products: [] });
  const [scopeLoading, setScopeLoading] = useState(false);
  const [savingScope, setSavingScope] = useState(false);
  const [scopeErr, setScopeErr] = useState("");
  const [prodSearch, setProdSearch] = useState("");

  const authToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;
  const api = async (path: string, init?: RequestInit) => {
    const token = await authToken();
    if (!token) throw new Error("Session expired — sign in again.");
    const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") { router.push("/"); return; }
      await refreshAll();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDistributors = async () => { try { setDistributors((await api("/api/admin/distributors")).distributors || []); } catch {} };
  const loadPending = async () => { try { setPending((await api("/api/admin/pending-products")).pending || []); } catch {} };
  const loadLog = async () => { try { setLog((await api("/api/admin/distributor-log")).entries || []); } catch {} };
  const refreshAll = async () => { await Promise.all([loadDistributors(), loadPending(), loadLog()]); };

  const addDistributor = async () => {
    setAddErr("");
    if (!email.trim() || !password) { setAddErr("Email and password are required."); return; }
    setAdding(true);
    try {
      await api("/api/admin/distributors", { method: "POST", body: JSON.stringify({ email, password, label }) });
      setEmail(""); setPassword(""); setLabel("");
      await loadDistributors();
    } catch (e: any) { setAddErr(e.message); }
    setAdding(false);
  };

  const saveEdit = async () => {
    setEditErr("");
    setSavingEdit(true);
    try {
      await api("/api/admin/distributors", {
        method: "PATCH",
        body: JSON.stringify({
          userId: editing.user_id,
          label: editing.label,
          email: editing.email,
          password: editing.newPassword || undefined,
        }),
      });
      setEditing(null);
      await loadDistributors();
    } catch (e: any) { setEditErr(e.message); }
    setSavingEdit(false);
  };

  // --- access / scope ---
  const openScope = async (d: any) => {
    setScopeFor(d); setScope(null); setScopeErr(""); setProdSearch(""); setScopeLoading(true);
    try {
      const j = await api(`/api/admin/distributor-scope?userId=${d.user_id}`);
      setCatalog(j.catalog || { categories: [], brands: [], products: [] });
      setScope(j.scope || { mode: "all", categories: [], brands: [], products: [] });
    } catch (e: any) { setScopeErr(e.message); setScope({ mode: "all", categories: [], brands: [], products: [] }); }
    setScopeLoading(false);
  };
  const toggleIn = (key: "categories" | "brands" | "products", value: string) =>
    setScope((s: any) => {
      const set = new Set(s[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...s, [key]: Array.from(set) };
    });
  const saveScope = async () => {
    setSavingScope(true); setScopeErr("");
    try {
      await api("/api/admin/distributor-scope", {
        method: "PUT",
        body: JSON.stringify({ userId: scopeFor.user_id, ...scope }),
      });
      setScopeFor(null);
    } catch (e: any) { setScopeErr(e.message); }
    setSavingScope(false);
  };

  const removeDistributor = async (d: any) => {
    if (!confirm(`Revoke distributor access for ${d.email}?\n\nTheir login stays active but they'll see nothing until re-added.`)) return;
    try { await api(`/api/admin/distributors?userId=${d.user_id}`, { method: "DELETE" }); await loadDistributors(); }
    catch (e: any) { alert(e.message); }
  };

  const inp = "bg-black border border-white/15 rounded px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none";
  const th = "px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-500";
  const td = "px-4 py-3 text-sm";

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-24">
      <Navbar />
      <div className="pt-28 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/90 flex items-center justify-center text-2xl text-black"><FaHandshake /></div>
          <div>
            <h1 className="font-orbitron text-3xl font-bold">DISTRIBUTORS</h1>
            <p className="text-gray-400 text-sm">Partner accounts, submissions & price history</p>
          </div>
        </div>

        {/* Add + list */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4"><FaPlus className="text-cyan-400" /> Add a distributor</h2>
            <div className="flex flex-col gap-3">
              <input className={inp} type="email" placeholder="partner@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inp} type="text" placeholder="Temporary password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input className={inp} type="text" placeholder="Label (e.g. company name)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <button onClick={addDistributor} disabled={adding} className="py-2.5 rounded-lg text-sm font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50">
                {adding ? "Creating…" : "Create distributor"}
              </button>
              {addErr && <span className="text-xs text-red-400">{addErr}</span>}
              <p className="text-[11px] text-gray-500">Creates a Supabase Auth login and grants portal access. Share the email + password with the partner.</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 text-sm font-bold">Active distributors ({distributors.length})</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10"><th className={th}>Email</th><th className={th}>Label</th><th className={th}>Added</th><th className={`${th} text-right`}>·</th></tr></thead>
                <tbody>
                  {distributors.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">No distributors yet.</td></tr>}
                  {distributors.map((d) => (
                    <tr key={d.user_id} className="border-b border-white/5">
                      <td className={`${td} font-mono text-xs`}>{d.email}</td>
                      <td className={td}>{d.label || "—"}</td>
                      <td className={`${td} text-gray-400`}>{fmtDate(d.created_at)}</td>
                      <td className={`${td} text-right`}>
                        <span className="inline-flex gap-3">
                          <button onClick={() => openScope(d)} title="Product access" className="text-gray-400 hover:text-amber-400"><FaKey /></button>
                          <button onClick={() => setEditing({ user_id: d.user_id, email: d.email, label: d.label || "", newPassword: "" })} title="Edit details" className="text-gray-400 hover:text-cyan-400"><FaPen /></button>
                          <button onClick={() => removeDistributor(d)} title="Revoke access" className="text-gray-400 hover:text-red-400"><FaTrash /></button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending submissions */}
        <h2 className="font-orbitron text-lg font-bold flex items-center gap-2 mb-4 text-cyan-400"><FaInbox /> Pending submissions <span className="text-[11px] font-normal text-gray-500 normal-case tracking-normal">· products distributors added, awaiting research</span></h2>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10"><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Brand</th><th className={th}>Cost</th><th className={th}>MRP</th><th className={th}>Added</th><th className={`${th} text-right`}>·</th></tr></thead>
              <tbody>
                {pending.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">Nothing pending — the inbox is clear.</td></tr>}
                {pending.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className={td}>{p.breadcrumb_name || p.name || p.nickname || "—"}</td>
                    <td className={`${td} text-gray-300`}>{p.category || "—"}</td>
                    <td className={`${td} text-gray-300`}>{p.brand || "—"}</td>
                    <td className={td}>{money(p.distributor_price)}</td>
                    <td className={`${td} text-gray-400`}>{money(p.mrp)}</td>
                    <td className={`${td} text-gray-500 text-xs`}>{fmtDate(p.created_at)}</td>
                    <td className={`${td} text-right`}>
                      <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline">Research <FaExternalLinkAlt className="text-[9px]" /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price history */}
        <h2 className="font-orbitron text-lg font-bold flex items-center gap-2 mb-4 text-cyan-400"><FaHistory /> Recent price changes</h2>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10"><th className={th}>When</th><th className={th}>Distributor</th><th className={th}>Product</th><th className={th}>Cost</th><th className={th}>Stock</th></tr></thead>
              <tbody>
                {log.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No price changes logged yet.</td></tr>}
                {log.map((l, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className={`${td} text-gray-400 text-xs whitespace-nowrap`}>{fmtDateTime(l.created_at)}</td>
                    <td className={`${td} text-gray-300`}>{l.who}</td>
                    <td className={td}>{l.product}</td>
                    <td className={td}>
                      <span className="text-gray-500">{money(l.old_price)}</span>
                      <span className="text-gray-600 mx-1">→</span>
                      <span className="text-white font-semibold">{money(l.new_price)}</span>
                    </td>
                    <td className={`${td} text-xs`}>
                      <span className="text-gray-500">{l.old_in_stock ? "In" : "Out"}</span>
                      <span className="text-gray-600 mx-1">→</span>
                      <span className={l.new_in_stock ? "text-emerald-400" : "text-red-400"}>{l.new_in_stock ? "In" : "Out"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit distributor modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !savingEdit && setEditing(null)} />
          <div className="relative z-10 w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-orbitron text-lg font-bold mb-5 flex items-center gap-2"><FaPen className="text-cyan-400" /> Edit distributor</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Label</label>
                <input className={`${inp} w-full mt-1`} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Company name" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Email (login)</label>
                <input className={`${inp} w-full mt-1`} type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Reset password (optional)</label>
                <input className={`${inp} w-full mt-1`} type="text" value={editing.newPassword} onChange={(e) => setEditing({ ...editing, newPassword: e.target.value })} placeholder="Leave blank to keep current" />
              </div>
              {editErr && <span className="text-xs text-red-400">{editErr}</span>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} disabled={savingEdit} className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button onClick={saveEdit} disabled={savingEdit} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50">{savingEdit ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Product access (scope) modal */}
      {scopeFor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !savingScope && setScopeFor(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="font-orbitron text-lg font-bold mb-1 flex items-center gap-2"><FaKey className="text-amber-400" /> Product access</h3>
            <p className="text-[11px] text-gray-400 font-mono mb-5">{scopeFor.email}</p>

            {scopeLoading || !scope ? (
              <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>
            ) : (
              <>
                {/* Mode */}
                <div className="flex gap-3 mb-5">
                  {[["all", "Full catalogue"], ["custom", "Restricted"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => setScope({ ...scope, mode: val })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${scope.mode === val ? "bg-amber-500 text-black border-amber-500" : "border-white/15 text-gray-300 hover:bg-white/5"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {scope.mode === "all" ? (
                  <p className="text-sm text-gray-400 bg-black/30 border border-white/5 rounded-lg p-4">This distributor can see and price the entire catalogue.</p>
                ) : (
                  <div className="space-y-5">
                    {/* Categories */}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {catalog.categories.map((c: string) => (
                          <button key={c} onClick={() => toggleIn("categories", c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${scope.categories.includes(c) ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "border-white/15 text-gray-400 hover:bg-white/5"}`}>
                            {c}
                          </button>
                        ))}
                        {catalog.categories.length === 0 && <span className="text-xs text-gray-600">none</span>}
                      </div>
                    </div>

                    {/* Brands */}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-2">Brands</p>
                      <div className="flex flex-wrap gap-2">
                        {catalog.brands.map((b: string) => (
                          <button key={b} onClick={() => toggleIn("brands", b)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${scope.brands.includes(b) ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "border-white/15 text-gray-400 hover:bg-white/5"}`}>
                            {b}
                          </button>
                        ))}
                        {catalog.brands.length === 0 && <span className="text-xs text-gray-600">none</span>}
                      </div>
                    </div>

                    {/* Individual products */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Individual products ({scope.products.length})</p>
                        <div className="relative">
                          <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]" />
                          <input value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} placeholder="search…" className="bg-black border border-white/15 rounded pl-7 pr-2 py-1.5 text-xs text-white focus:border-amber-500 outline-none w-48" />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto border border-white/10 rounded-lg divide-y divide-white/5">
                        {catalog.products
                          .filter((p: any) => { const q = prodSearch.toLowerCase(); return !q || `${p.label} ${p.category} ${p.brand}`.toLowerCase().includes(q); })
                          .slice(0, 300)
                          .map((p: any) => (
                            <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-white/[0.03]">
                              <input type="checkbox" className="accent-amber-500 w-4 h-4" checked={scope.products.includes(p.id)} onChange={() => toggleIn("products", p.id)} />
                              <span className="flex-1">{p.label}</span>
                              <span className="text-[10px] text-gray-500">{p.category}{p.brand ? ` · ${p.brand}` : ""}</span>
                            </label>
                          ))}
                      </div>
                    </div>

                    {scope.categories.length === 0 && scope.brands.length === 0 && scope.products.length === 0 && (
                      <p className="text-xs text-amber-400">⚠ Nothing selected — this distributor will see an empty catalogue.</p>
                    )}
                  </div>
                )}

                {scopeErr && <p className="text-xs text-red-400 mt-4">{scopeErr}</p>}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setScopeFor(null)} disabled={savingScope} className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 disabled:opacity-50">Cancel</button>
                  <button onClick={saveScope} disabled={savingScope} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50">{savingScope ? "Saving…" : "Save access"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
