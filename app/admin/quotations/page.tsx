"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaPlus, FaTrash, FaPrint } from "react-icons/fa";

const CATS = ["cpu","gpu","motherboard","ram","storage","psu","cabinet","cooler","monitor","keyboard","mouse","combo","mousepad","usb","prebuilt"];
const inr = (n: any) => Number(n || 0).toLocaleString("en-IN");
const uid = () => Math.random().toString(36).slice(2, 9);

type Part = { id: string; productId: string | null; name: string; price: number; qty: number };
type Cat = { id: string; dbCat: string; label: string; parts: Part[] };

export default function QuotationBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [catalog, setCatalog] = useState<Record<string, any[]>>({});
  const [catLabels, setCatLabels] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [delivery, setDelivery] = useState<string>("");
  const [cats, setCats] = useState<Cat[]>([]);

  // inline "add new part" form per category
  const [adding, setAdding] = useState<Record<string, { name: string; dist: string; sell: string; save?: boolean; busy?: boolean }>>({});
  // searchable part picker
  const [partQuery, setPartQuery] = useState<Record<string, string>>({});
  const [openPart, setOpenPart] = useState<string | null>(null);

  const authToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;
  const pretty = (slug: string) => catLabels[slug] || slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") { router.push("/"); return; }

      const [{ data: prods }, { data: labels }] = await Promise.all([
        supabase.from("products").select("id, name, breadcrumb_name, nickname, category, price, distributor_price"),
        supabase.from("categories").select("id, name, short_name"),
      ]);
      const byCat: Record<string, any[]> = {};
      for (const p of prods || []) {
        const c = p.category || "other";
        (byCat[c] ||= []).push({ id: p.id, label: p.breadcrumb_name || p.name || p.nickname || "Unnamed", price: Number(p.price) || 0, cost: Number(p.distributor_price) || 0 });
      }
      for (const c of Object.keys(byCat)) byCat[c].sort((a, b) => a.label.localeCompare(b.label));
      setCatalog(byCat);
      const lm: Record<string, string> = {};
      for (const c of (labels as any[]) || []) lm[c.id] = c.name || c.short_name || c.id;
      setCatLabels(lm);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- mutators ----
  const patchCat = (id: string, patch: Partial<Cat>) => setCats((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCategory = () => setCats((cs) => [...cs, { id: uid(), dbCat: "cpu", label: pretty("cpu"), parts: [{ id: uid(), productId: null, name: "", price: 0, qty: 1 }] }]);
  const removeCategory = (id: string) => setCats((cs) => cs.filter((c) => c.id !== id));
  const setCatDb = (cat: Cat, dbCat: string) => patchCat(cat.id, { dbCat, label: pretty(dbCat), parts: cat.parts.map((p) => ({ ...p, productId: null, name: "", price: 0 })) });

  const addPart = (cat: Cat) => patchCat(cat.id, { parts: [...cat.parts, { id: uid(), productId: null, name: "", price: 0, qty: 1 }] });
  const removePart = (cat: Cat, pid: string) => patchCat(cat.id, { parts: cat.parts.filter((p) => p.id !== pid) });
  const patchPart = (cat: Cat, pid: string, patch: Partial<Part>) =>
    patchCat(cat.id, { parts: cat.parts.map((p) => (p.id === pid ? { ...p, ...patch } : p)) });

  const selectProduct = (cat: Cat, part: Part, productId: string) => {
    const prod = (catalog[cat.dbCat] || []).find((x) => x.id === productId);
    if (prod) patchPart(cat, part.id, { productId: prod.id, name: prod.label, price: prod.price });
    else patchPart(cat, part.id, { productId: null, name: "", price: 0 });
  };

  const submitNewPart = async (cat: Cat) => {
    const f = adding[cat.id];
    const save = f?.save !== false; // default: save to catalogue
    if (!f?.name?.trim() || !Number(f.sell)) { alert("Part name and selling price are required."); return; }
    if (save && !Number(f.dist)) { alert("Distributor price is required to save to the catalogue (or uncheck ‘Save to catalogue’ for a one-time part)."); return; }

    // One-time part: used only on this quotation, NOT written to the DB or the dropdown.
    if (!save) {
      patchCat(cat.id, { parts: [...cat.parts, { id: uid(), productId: null, name: f.name.trim(), price: Number(f.sell), qty: 1 }] });
      setAdding((a) => ({ ...a, [cat.id]: { name: "", dist: "", sell: "", save: true } }));
      return;
    }

    setAdding((a) => ({ ...a, [cat.id]: { ...f, busy: true } }));
    try {
      const token = await authToken();
      const res = await fetch("/api/admin/quick-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nickname: f.name.trim(), category: cat.dbCat, distributor_price: Number(f.dist) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to add part");
      const prod = { id: json.product.id, label: f.name.trim(), price: Number(json.product.price) || 0, cost: Number(f.dist) };
      // add to catalog so it appears in the search dropdown
      setCatalog((c) => ({ ...c, [cat.dbCat]: [...(c[cat.dbCat] || []), prod].sort((a, b) => a.label.localeCompare(b.label)) }));
      // add it to this category with the ONE-TIME selling price (not the DB price)
      patchCat(cat.id, { parts: [...cat.parts, { id: uid(), productId: prod.id, name: f.name.trim(), price: Number(f.sell), qty: 1 }] });
      setAdding((a) => ({ ...a, [cat.id]: { name: "", dist: "", sell: "", save: true } }));
    } catch (e: any) { alert(e.message); setAdding((a) => ({ ...a, [cat.id]: { ...f, busy: false } })); }
  };

  const lines = useMemo(() => cats.flatMap((c) => c.parts.filter((p) => p.name).map((p) => ({ label: c.label, name: p.name, qty: p.qty, total: p.price * p.qty }))), [cats]);
  const itemCount = lines.length;
  const deliveryFee = Number(delivery) || 0;
  const itemsTotal = lines.reduce((s, l) => s + l.total, 0);
  const grandTotal = itemsTotal + deliveryFee;

  const inp = "bg-black border border-white/15 rounded px-3 py-2 text-sm text-white focus:border-[#ff5a1f] outline-none";

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-24 print:bg-white print:pb-0">
      {/* quotation preview styles (scoped to .qp) + print rules */}
      <style>{`
        .qp{ --accent:#ff5a1f; max-width:860px; margin:0 auto; }
        .qp .brand{ text-align:center; font-size:15px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:18px; }
        .qp .brand span{ color:var(--accent); }
        .qp .qh1{ text-align:center; font-size:30px; font-weight:800; text-transform:uppercase; margin:0 0 4px; }
        .qp .subtitle{ text-align:center; color:#9a9a9a; margin-bottom:26px; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
        .qp .card{ background:#1a1a1a; border:1px solid #2e2e2e; border-top:3px solid var(--accent); border-radius:12px; overflow:hidden; margin-bottom:22px; }
        .qp .ch{ background:#161616; padding:15px 20px; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2e2e2e; }
        .qp .ch .badge{ font-size:11px; font-weight:500; color:var(--accent); }
        .qp table{ width:100%; border-collapse:collapse; }
        .qp th,.qp td{ text-align:left; padding:11px 20px; border-bottom:1px solid #2e2e2e; font-size:13.5px; color:#f5f5f5; }
        .qp th{ color:#9a9a9a; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:.06em; }
        .qp td.price,.qp th.price{ text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
        .qp .total-row td{ background:var(--accent); color:#0e0e0e; font-weight:800; font-size:15px; text-transform:uppercase; border-bottom:none; padding:15px 20px; }
        .qp .gt{ text-align:center; padding:22px; border-radius:12px; background:#1a1a1a; border:1px solid #2e2e2e; border-top:3px solid var(--accent); margin-bottom:18px; }
        .qp .gt .label{ color:#9a9a9a; font-size:12px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
        .qp .gt .amount{ font-size:28px; font-weight:800; color:var(--accent); }
        .qp .note{ font-size:12px; color:#9a9a9a; text-align:center; margin-top:16px; line-height:1.6; }
        .qp .ty{ text-align:center; border-top:1px solid #2e2e2e; margin-top:22px; padding-top:18px; font-size:12px; color:#9a9a9a; }
        .qp .ty b{ color:#f5f5f5; font-size:14px; letter-spacing:.04em; }

        @media print{
          @page{ size:A4; margin:14mm; }
          body{ background:#fff !important; }
          .no-print{ display:none !important; }
          .qp-wrap{ padding:0 !important; }
          *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          /* A card may flow onto the next page, but never split a row; the @page
             margin keeps the padding identical on every page. */
          .qp .card{ break-inside:auto; }
          .qp tr{ break-inside:avoid; }
          .qp .ch,.qp .gt,.qp .ty{ break-inside:avoid; }
        }
      `}</style>

      <div className="no-print">
        <Navbar />
        <div className="pt-28 px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#ff5a1f] flex items-center justify-center text-2xl text-black"><FaFileInvoiceDollar /></div>
            <div>
              <h1 className="font-orbitron text-3xl font-bold">QUOTATION BUILDER</h1>
              <p className="text-gray-400 text-sm">Build a customer quotation, then print or save as PDF</p>
            </div>
            <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 bg-[#ff5a1f] text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90">
              <FaPrint /> Print / Save PDF
            </button>
          </div>

          {/* Meta */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 mb-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Quotation title / build name</label><input className={`${inp} w-full mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Nvidia Build (2x RTX 5060)" /></div>
            <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Customer (optional)</label><input className={`${inp} w-full mt-1`} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" /></div>
            <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Valid until</label><input type="date" className={`${inp} w-full mt-1`} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400">Delivery charges (₹)</label>
              <div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" min="0" className={`${inp} w-full pl-6`} value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="0 = free / included" /></div>
            </div>
          </div>

          {/* Categories */}
          {cats.map((cat) => (
            <div key={cat.id} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 mb-4">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <select value={cat.dbCat} onChange={(e) => setCatDb(cat, e.target.value)} className={inp}>
                  {CATS.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                </select>
                <input value={cat.label} onChange={(e) => patchCat(cat.id, { label: e.target.value })} className={`${inp} flex-1 min-w-[180px]`} placeholder="Label shown on quotation (e.g. Graphics Card)" />
                <button onClick={() => removeCategory(cat.id)} className="text-gray-400 hover:text-red-400 px-2" title="Remove category"><FaTrash /></button>
              </div>

              {cat.parts.map((part) => (
                <div key={part.id} className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="relative flex-1 min-w-[220px]">
                    <input
                      className={`${inp} w-full`}
                      placeholder={`Search ${pretty(cat.dbCat).toLowerCase()}…`}
                      value={openPart === part.id ? (partQuery[part.id] ?? part.name ?? "") : (part.name || "")}
                      onFocus={() => { setOpenPart(part.id); setPartQuery((q) => ({ ...q, [part.id]: part.name || "" })); }}
                      onChange={(e) => { setOpenPart(part.id); setPartQuery((q) => ({ ...q, [part.id]: e.target.value })); }}
                      onBlur={() => setTimeout(() => setOpenPart((o) => (o === part.id ? null : o)), 160)}
                    />
                    {openPart === part.id && (() => {
                      const q = (partQuery[part.id] ?? "").toLowerCase();
                      const list = (catalog[cat.dbCat] || []).filter((p) => !q || p.label.toLowerCase().includes(q)).slice(0, 50);
                      return (
                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#1A1A1A] border border-white/15 rounded-lg shadow-2xl">
                          {list.length === 0 && <div className="px-3 py-2 text-xs text-gray-500">No matches — use “Add a new part”.</div>}
                          {list.map((p) => (
                            <button key={p.id} type="button"
                              onMouseDown={(e) => { e.preventDefault(); selectProduct(cat, part, p.id); setPartQuery((qq) => ({ ...qq, [part.id]: p.label })); setOpenPart(null); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex justify-between gap-3">
                              <span className="truncate">{p.label}</span>
                              <span className="text-gray-400 shrink-0">₹{inr(p.price)}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <input type="number" min="1" value={part.qty} onChange={(e) => patchPart(cat, part.id, { qty: Math.max(1, Number(e.target.value) || 1) })} className={`${inp} w-16`} title="Qty" />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input type="number" value={part.price || ""} onChange={(e) => patchPart(cat, part.id, { price: Number(e.target.value) || 0 })} className={`${inp} w-32 pl-6`} title="Selling price (one-time)" placeholder="price" />
                  </div>
                  <span className="text-xs text-gray-500 w-24 text-right">= ₹{inr(part.price * part.qty)}</span>
                  <button onClick={() => removePart(cat, part.id)} className="text-gray-500 hover:text-red-400 px-1" title="Remove part"><FaTrash size={12} /></button>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button onClick={() => addPart(cat)} className="text-xs font-bold text-[#ff5a1f] hover:underline flex items-center gap-1"><FaPlus size={9} /> Add part</button>
                <button onClick={() => setAdding((a) => ({ ...a, [cat.id]: a[cat.id] ? a[cat.id] : { name: "", dist: "", sell: "" } }))} className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"><FaPlus size={9} /> Add a new part (not in catalogue)</button>
              </div>

              {adding[cat.id] && (() => {
                const f = adding[cat.id];
                const save = f.save !== false;
                return (
                <div className="mt-3 bg-black/30 border border-white/10 rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={f.name} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], name: e.target.value } }))} className={`${inp} flex-1 min-w-[200px]`} placeholder="New part name / model" />
                    {save && (
                      <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" value={f.dist} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], dist: e.target.value } }))} className={`${inp} w-36 pl-6`} placeholder="distributor price" /></div>
                    )}
                    <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" value={f.sell} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], sell: e.target.value } }))} className={`${inp} w-36 pl-6`} placeholder="selling price (this quote)" /></div>
                    <button onClick={() => submitNewPart(cat)} disabled={f.busy} className="bg-cyan-500 text-black px-4 py-2 rounded text-sm font-bold disabled:opacity-50">{f.busy ? "Adding…" : "Add"}</button>
                  </div>
                  <label className="flex items-center gap-2 mt-3 text-[12px] text-gray-300 cursor-pointer">
                    <input type="checkbox" className="accent-cyan-500 w-4 h-4" checked={save} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], save: e.target.checked } }))} />
                    Save this part to the catalogue
                  </label>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {save
                      ? "Saves the name + distributor price to the catalogue (the system auto-calculates the real selling price). The selling price above is used only on this quotation."
                      : "One-time part — used only on this quotation. Nothing is saved to the database."}
                  </p>
                </div>
                );
              })()}
            </div>
          ))}

          <button onClick={addCategory} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm font-bold text-gray-300 hover:border-[#ff5a1f] hover:text-[#ff5a1f] transition-colors flex items-center justify-center gap-2 mb-10">
            <FaPlus /> Add category
          </button>
        </div>
      </div>

      {/* ===== PRINTABLE QUOTATION PREVIEW ===== */}
      <div className="qp-wrap px-6 py-10 bg-[#0e0e0e] print:bg-white">
        <div className="qp">
          <div className="brand">RIG<span>BUILDERS</span></div>
          <div className="qh1">Quotation</div>
          <div className="subtitle">
            {customer ? `Prepared for ${customer}` : "Custom build quotation"}
            {validUntil ? ` · Valid until ${new Date(validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
          </div>

          <div className="card">
            <div className="ch">
              <span>{title || "Quotation"}</span>
              <span className="badge">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
            </div>
            <table>
              <tbody>
                <tr><th>Component</th><th>Spec</th><th className="price">Price (Rs.)</th></tr>
                {lines.length === 0 && <tr><td colSpan={3} style={{ color: "#9a9a9a", textAlign: "center" }}>Add parts to see them here.</td></tr>}
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td>{l.label}{l.qty > 1 ? ` x${l.qty}` : ""}</td>
                    <td>{l.name}</td>
                    <td className="price">{inr(l.total)}</td>
                  </tr>
                ))}
                {deliveryFee > 0 && (
                  <tr>
                    <td>Delivery</td>
                    <td>Insured shipping, pan-India</td>
                    <td className="price">{inr(deliveryFee)}</td>
                  </tr>
                )}
                <tr className="total-row"><td colSpan={2}>Total{deliveryFee > 0 ? " (incl. delivery)" : ""}</td><td className="price">Rs.{inr(grandTotal)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="gt">
            <div className="label">Total Quotation Value</div>
            <div className="amount">Rs.{inr(grandTotal)}</div>
          </div>

          <div className="ty">
            <b>Thank you for considering Rig Builders.</b>
            <div style={{ marginTop: "8px" }}>
              Every system is professionally assembled, stress-tested and delivered insured across India.
              {validUntil ? ` This quotation is valid until ${new Date(validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}.` : ""}
              {" "}Prices are subject to stock availability. · info@rigbuilders.in · www.rigbuilders.in
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
