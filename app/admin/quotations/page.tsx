"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaPlus, FaTrash, FaPrint, FaPen, FaUser, FaThLarge } from "react-icons/fa";

const CATS = ["cpu","gpu","motherboard","ram","storage","psu","cabinet","cooler","monitor","keyboard","mouse","combo","mousepad","usb","prebuilt"];
const inr = (n: any) => Number(n || 0).toLocaleString("en-IN");
const inr2 = (n: any) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Math.random().toString(36).slice(2, 9);

// Exact replica of the DB's compute_selling_price(). includeFloor=false is the
// "percent only" variant (floor forced to 0). Both keep the 49/99 rounding.
type Rules = Record<string, { pct: number | null; floor: number }>;
function computeSp(cost: any, category: string, includeFloor: boolean, rules: Rules, defaultPct: number): number {
  const c = Number(cost) || 0;
  if (c <= 0) return 0;
  const rule = rules[category];
  const pct = rule && rule.pct != null ? rule.pct : defaultPct;
  const floor = includeFloor ? (rule ? rule.floor : 0) : 0;
  const raw = c + Math.max(pct * c, floor);
  const base = Math.floor(raw / 100) * 100;
  if (base + 49 >= raw) return base + 49;
  if (base + 99 >= raw) return base + 99;
  return base + 149;
}

type CatalogItem = { id: string; label: string; nickname: string; breadcrumb: string; price: number; cost: number; draft: boolean };
type Part = { id: string; productId: string | null; name: string; cost: number; price: number; qty: number; manual: boolean };
type Cat = { id: string; dbCat: string; label: string; parts: Part[] };

export default function QuotationBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [catalog, setCatalog] = useState<Record<string, CatalogItem[]>>({});
  const [catLabels, setCatLabels] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<Rules>({});
  const [defaultPct, setDefaultPct] = useState(0.05);

  const [title, setTitle] = useState("");
  const [quoteDate, setQuoteDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [validUntil, setValidUntil] = useState("");
  const [delivery, setDelivery] = useState<string>("");
  const [includeFloor, setIncludeFloor] = useState(false); // false = percent only
  const [gstLocation, setGstLocation] = useState<"punjab" | "outside">("punjab");
  const [gstInclusive, setGstInclusive] = useState(false); // false = add 18% on top
  const [showGst, setShowGst] = useState(true);            // show the GST breakdown on the quote
  const [cats, setCats] = useState<Cat[]>([]);

  // saving / loading
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [quotationNo, setQuotationNo] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "final">("draft");
  const [saving, setSaving] = useState(false);
  const [savedList, setSavedList] = useState<any[]>([]);

  // Entry flow: a chooser screen with 3 paths, then the builder.
  const [stage, setStage] = useState<"choose" | "build">("choose");
  const [chooserView, setChooserView] = useState<"menu" | "customer" | "quote">("menu");
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [custQuery, setCustQuery] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");

  const [adding, setAdding] = useState<Record<string, { name: string; cost: string; sell: string; save?: boolean; busy?: boolean }>>({});
  const [partQuery, setPartQuery] = useState<Record<string, string>>({});
  const [openPart, setOpenPart] = useState<string | null>(null);

  const authToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;
  const pretty = (slug: string) => catLabels[slug] || slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const sp = (cost: any, category: string) => computeSp(cost, category, includeFloor, rules, defaultPct);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") { router.push("/"); return; }
      const token = await authToken();

      const [{ data: prods }, { data: labels }, cfgRes] = await Promise.all([
        supabase.from("products").select("id, name, breadcrumb_name, nickname, category, price, distributor_price, listing_status"),
        supabase.from("categories").select("id, name, short_name"),
        fetch("/api/admin/pricing-config", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const byCat: Record<string, CatalogItem[]> = {};
      for (const p of prods || []) {
        const c = p.category || "other";
        (byCat[c] ||= []).push({
          id: p.id,
          label: p.breadcrumb_name || p.name || p.nickname || "Unnamed",
          nickname: p.nickname || "",
          breadcrumb: p.breadcrumb_name || "",
          price: Number(p.price) || 0,
          cost: Number(p.distributor_price) || 0,
          draft: p.listing_status !== "published",
        });
      }
      for (const c of Object.keys(byCat)) byCat[c].sort((a, b) => a.label.localeCompare(b.label));
      setCatalog(byCat);

      const lm: Record<string, string> = {};
      for (const c of (labels as any[]) || []) lm[c.id] = c.name || c.short_name || c.id;
      setCatLabels(lm);

      const cfg = await cfgRes.json().catch(() => ({}));
      if (cfg?.rules) setRules(cfg.rules);
      if (cfg?.defaultPct != null) setDefaultPct(Number(cfg.defaultPct));
      await loadSavedList();
      await loadCustomers();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute every auto-priced line when the mode or the pricing config changes.
  useEffect(() => {
    setCats((cs) => cs.map((c) => ({ ...c, parts: c.parts.map((p) => (!p.manual && Number(p.cost) > 0 ? { ...p, price: computeSp(p.cost, c.dbCat, includeFloor, rules, defaultPct) } : p)) })));
  }, [includeFloor, rules, defaultPct]);

  // ---- mutators ----
  const patchCat = (id: string, patch: Partial<Cat>) => setCats((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCategory = () => setCats((cs) => [...cs, { id: uid(), dbCat: "cpu", label: pretty("cpu"), parts: [{ id: uid(), productId: null, name: "", cost: 0, price: 0, qty: 1, manual: false }] }]);
  const removeCategory = (id: string) => setCats((cs) => cs.filter((c) => c.id !== id));
  const setCatDb = (cat: Cat, dbCat: string) => patchCat(cat.id, { dbCat, label: pretty(dbCat), parts: cat.parts.map((p) => ({ ...p, productId: null, name: "", cost: 0, price: 0, manual: false })) });
  const addPart = (cat: Cat) => patchCat(cat.id, { parts: [...cat.parts, { id: uid(), productId: null, name: "", cost: 0, price: 0, qty: 1, manual: false }] });
  const removePart = (cat: Cat, pid: string) => patchCat(cat.id, { parts: cat.parts.filter((p) => p.id !== pid) });
  const patchPart = (cat: Cat, pid: string, patch: Partial<Part>) => patchCat(cat.id, { parts: cat.parts.map((p) => (p.id === pid ? { ...p, ...patch } : p)) });

  const selectProduct = (cat: Cat, part: Part, productId: string) => {
    const prod = (catalog[cat.dbCat] || []).find((x) => x.id === productId);
    if (prod) patchPart(cat, part.id, { productId: prod.id, name: prod.label, cost: prod.cost, price: sp(prod.cost, cat.dbCat), manual: false });
    else patchPart(cat, part.id, { productId: null, name: "", cost: 0, price: 0 });
  };

  // Editing an existing part's cost → live recompute, and persist to products.distributor_price.
  const editCost = (cat: Cat, part: Part, value: string) => patchPart(cat, part.id, { cost: Number(value) || 0, price: sp(Number(value) || 0, cat.dbCat) });
  const persistCost = async (cat: Cat, part: Part) => {
    if (!part.productId || !(part.cost > 0)) return;
    try {
      const token = await authToken();
      const res = await fetch("/api/admin/update-product", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: part.productId, distributor_price: part.cost }) });
      if (res.ok) setCatalog((c) => ({ ...c, [cat.dbCat]: (c[cat.dbCat] || []).map((x) => (x.id === part.productId ? { ...x, cost: part.cost } : x)) }));
    } catch {}
  };

  // Rename the field actually read for the display name:
  //  • listed product (has breadcrumb_name) → breadcrumb_name (configurator_name
  //    mirrors it via trigger). Note: this is the public catalogue name too.
  //  • draft / quick-add (no breadcrumb_name) → nickname + name (label reads name).
  const renameItem = async (cat: Cat, item: CatalogItem) => {
    const hasBread = !!item.breadcrumb;
    const next = window.prompt(
      hasBread ? "Rename this product — updates the catalogue name (also shown on the website):" : "Rename this part (saved to the catalogue):",
      item.label
    );
    if (next == null) return;
    const name = next.trim();
    if (!name || name === item.label) return;

    const patch: any = { id: item.id };
    if (hasBread) patch.breadcrumb_name = name;
    else { patch.nickname = name; patch.name = name; }

    try {
      const token = await authToken();
      const res = await fetch("/api/admin/update-product", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(patch) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Rename failed");
      setCatalog((c) => ({ ...c, [cat.dbCat]: (c[cat.dbCat] || []).map((x) => (x.id === item.id ? { ...x, label: name, breadcrumb: hasBread ? name : x.breadcrumb, nickname: hasBread ? x.nickname : name } : x)).sort((a, b) => a.label.localeCompare(b.label)) }));
      setCats((cs) => cs.map((cc) => ({ ...cc, parts: cc.parts.map((p) => (p.productId === item.id ? { ...p, name } : p)) })));
    } catch (e: any) { alert(e.message); }
  };

  const submitNewPart = async (cat: Cat) => {
    const f = adding[cat.id];
    const save = f?.save !== false;
    if (!f?.name?.trim()) { alert("Part name is required."); return; }
    if (save && !Number(f.cost)) { alert("Distributor price (cost) is required to save to the catalogue."); return; }
    if (!save && !Number(f.sell)) { alert("Selling price is required for a one-time part."); return; }

    // One-time part — manual selling price, nothing written to the DB.
    if (!save) {
      patchCat(cat.id, { parts: [...cat.parts, { id: uid(), productId: null, name: f.name.trim(), cost: 0, price: Number(f.sell), qty: 1, manual: true }] });
      setAdding((a) => ({ ...a, [cat.id]: { name: "", cost: "", sell: "", save: true } }));
      return;
    }

    // Save to catalogue — write nickname + cost; quote SP computed from cost.
    setAdding((a) => ({ ...a, [cat.id]: { ...f, busy: true } }));
    try {
      const token = await authToken();
      const res = await fetch("/api/admin/quick-product", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ nickname: f.name.trim(), category: cat.dbCat, distributor_price: Number(f.cost) }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to add part");
      const item: CatalogItem = { id: json.product.id, label: f.name.trim(), nickname: f.name.trim(), price: Number(json.product.price) || 0, cost: Number(f.cost), draft: true };
      setCatalog((c) => ({ ...c, [cat.dbCat]: [...(c[cat.dbCat] || []), item].sort((a, b) => a.label.localeCompare(b.label)) }));
      patchCat(cat.id, { parts: [...cat.parts, { id: uid(), productId: item.id, name: item.label, cost: item.cost, price: sp(item.cost, cat.dbCat), qty: 1, manual: false }] });
      setAdding((a) => ({ ...a, [cat.id]: { name: "", cost: "", sell: "", save: true } }));
    } catch (e: any) { alert(e.message); setAdding((a) => ({ ...a, [cat.id]: { ...f, busy: false } })); }
  };

  // ---- save / load ----
  const loadSavedList = async () => {
    const token = await authToken();
    const res = await fetch("/api/admin/quotations", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const j = await res.json(); setSavedList(j.quotations || []); }
  };
  const loadCustomers = async () => {
    const token = await authToken();
    const res = await fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const j = await res.json(); setCustomersList(j.customers || []); }
  };
  const saveQuotation = async (asStatus: "draft" | "final") => {
    setSaving(true);
    try {
      const token = await authToken();
      const payload = {
        id: quotationId || undefined,
        title, customer, valid_until: validUntil || null, quote_date: quoteDate || null, status: asStatus,
        customer_email: customerEmail || null, customer_phone: customerPhone || null, customer_address: customerAddress || null,
        show_email: showEmail, show_phone: showPhone, show_address: showAddress,
        include_floor: includeFloor, gst_location: gstLocation, gst_inclusive: gstInclusive,
        delivery: Number(delivery) || 0, total: grandTotal, data: { cats, showGst },
      };
      const res = await fetch("/api/admin/quotations", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Save failed");
      setQuotationId(j.quotation.id); setStatus(asStatus);
      if (j.quotation?.quotation_no) setQuotationNo(j.quotation.quotation_no);
      await loadSavedList();
      if (asStatus === "draft") {
        alert("Saved as draft.");
      } else {
        const no = j.quotation_no || j.quotation?.quotation_no;
        const parts = [`Quotation finalized${no ? ` as ${no}` : ""}.`];
        if (j.emailed) parts.push(customerEmail ? `A login link was emailed to ${customerEmail}.` : "");
        else if (customerEmail) parts.push("Customer account linked — the quotation is in their dashboard.");
        alert(parts.filter(Boolean).join("\n"));
      }
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };
  const loadQuotation = async (id: string) => {
    if (!id) return;
    const token = await authToken();
    const res = await fetch(`/api/admin/quotations?id=${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { alert(j.error || "Load failed"); return; }
    const q = j.quotation;
    setQuotationId(q.id); setQuotationNo(q.quotation_no || null); setStatus(q.status || "draft");
    setTitle(q.title || ""); setCustomer(q.customer || ""); setValidUntil(q.valid_until || "");
    setQuoteDate(q.quote_date || new Date().toISOString().slice(0, 10));
    setCustomerEmail(q.customer_email || ""); setCustomerPhone(q.customer_phone || ""); setCustomerAddress(q.customer_address || "");
    setShowEmail(q.show_email !== false); setShowPhone(q.show_phone !== false); setShowAddress(q.show_address !== false);
    setDelivery(q.delivery != null ? String(q.delivery) : "");
    setIncludeFloor(!!q.include_floor); setGstLocation(q.gst_location || "punjab"); setGstInclusive(!!q.gst_inclusive);
    setShowGst(q.data?.showGst !== false);
    setCats(q.data?.cats || []);
  };
  const newQuotation = () => {
    setQuotationId(null); setQuotationNo(null); setStatus("draft"); setTitle(""); setCustomer("");
    setCustomerEmail(""); setCustomerPhone(""); setCustomerAddress(""); setShowEmail(true); setShowPhone(true); setShowAddress(true);
    setValidUntil(""); setQuoteDate(new Date().toISOString().slice(0, 10)); setDelivery(""); setCats([]);
  };

  // ---- entry flow ----
  const startBlank = () => { newQuotation(); setStage("build"); };
  const startForCustomer = (c: any) => {
    newQuotation();
    setCustomer(c.name || ""); setCustomerEmail(c.email || ""); setCustomerPhone(c.phone || ""); setCustomerAddress(c.address || "");
    setStage("build");
  };
  const editQuote = async (id: string) => { await loadQuotation(id); setStage("build"); };
  const backToMenu = () => { setStage("choose"); setChooserView("menu"); setCustQuery(""); setQuoteSearch(""); loadSavedList(); loadCustomers(); };

  const lines = useMemo(() => cats.flatMap((c) => c.parts.filter((p) => p.name).map((p) => ({ label: c.label, name: p.name, qty: p.qty, price: p.price }))), [cats]);
  const itemCount = lines.length;
  const deliveryFee = Number(delivery) || 0;
  // Per-line GST breakdown. `lineTotal` is the all-in (incl GST) amount per line;
  // `face` is the price as entered (used when GST isn't shown/applied).
  const perLine = lines.map((l) => {
    const face = l.price * l.qty;
    const lineTotal = gstInclusive ? face : face * 1.18; // all-in incl GST
    const taxable = lineTotal / 1.18;
    return { ...l, face, taxable, gst: lineTotal - taxable, lineTotal };
  });
  const goodsTotal = showGst ? perLine.reduce((s, x) => s + x.lineTotal, 0) : perLine.reduce((s, x) => s + x.face, 0);
  const totalTaxable = perLine.reduce((s, x) => s + x.taxable, 0);
  const totalGst = perLine.reduce((s, x) => s + x.gst, 0);
  const gstHalf = totalGst / 2; // CGST / SGST split
  const grandTotal = goodsTotal + deliveryFee;

  const fmtD = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const inp = "bg-black border border-white/15 rounded px-3 py-2 text-sm text-white focus:border-[#ff5a1f] outline-none";

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">Loading…</div>;

  // ===== ENTRY CHOOSER =====
  if (stage === "choose") {
    const cq = custQuery.trim().toLowerCase();
    const custFiltered = !cq ? customersList : customersList.filter((c) => [c.name, c.email, c.phone].some((v) => (v || "").toLowerCase().includes(cq)));
    const sq = quoteSearch.trim().toLowerCase();
    const quoteFiltered = !sq ? savedList : savedList.filter((q) => [q.title, q.customer, q.quotation_no, q.status].some((v) => (v || "").toLowerCase().includes(sq)));
    return (
      <div className="min-h-screen bg-[#121212] text-white font-saira pb-24">
        <Navbar />
        <div className="pt-28 px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#ff5a1f] flex items-center justify-center text-2xl text-black"><FaFileInvoiceDollar /></div>
            <div>
              <h1 className="font-orbitron text-3xl font-bold">QUOTATIONS</h1>
              <p className="text-gray-400 text-sm">Start a new quotation or continue a previous one</p>
            </div>
          </div>

          {chooserView === "menu" && (
            <div className="grid md:grid-cols-3 gap-5">
              <button onClick={startBlank} className="text-left bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 hover:border-[#ff5a1f] hover:bg-[#ff5a1f]/5 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#ff5a1f]/15 text-[#ff5a1f] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"><FaPlus /></div>
                <h3 className="font-orbitron font-bold text-lg mb-1">New customer</h3>
                <p className="text-sm text-gray-400">Create a quotation for someone new. Fill their details as you go.</p>
              </button>
              <button onClick={() => { setChooserView("customer"); loadCustomers(); }} className="text-left bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 hover:border-cyan-400 hover:bg-cyan-400/5 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-cyan-400/15 text-cyan-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"><FaUser /></div>
                <h3 className="font-orbitron font-bold text-lg mb-1">Existing customer</h3>
                <p className="text-sm text-gray-400">New quotation for someone you&apos;ve quoted before — contact pre-filled.</p>
              </button>
              <button onClick={() => { setChooserView("quote"); loadSavedList(); }} className="text-left bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 hover:border-amber-400 hover:bg-amber-400/5 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"><FaPen /></div>
                <h3 className="font-orbitron font-bold text-lg mb-1">Edit previous</h3>
                <p className="text-sm text-gray-400">Open a saved quotation — draft or finalized — to review or change.</p>
              </button>
            </div>
          )}

          {chooserView === "customer" && (
            <div>
              <button onClick={() => setChooserView("menu")} className="text-sm text-gray-400 hover:text-white mb-4">← Back</button>
              <input value={custQuery} onChange={(e) => setCustQuery(e.target.value)} placeholder="Search customers by name, email or phone…" className={`${inp} w-full mb-4`} />
              <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                {custFiltered.length === 0 && <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">No customers found.</div>}
                {custFiltered.map((c) => (
                  <button key={c.id} onClick={() => startForCustomer(c)} className="w-full text-left bg-[#1A1A1A] border border-white/10 rounded-xl p-4 hover:border-cyan-400 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{c.name || "—"}</div>
                      <div className="text-xs text-gray-400 truncate">{[c.email, c.phone].filter(Boolean).join(" · ") || "no contact"}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-gray-500">{c.quotation_count || 0} quote{c.quotation_count === 1 ? "" : "s"}</span>
                      <span className="text-xs font-bold text-cyan-400">New quote →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chooserView === "quote" && (
            <div>
              <button onClick={() => setChooserView("menu")} className="text-sm text-gray-400 hover:text-white mb-4">← Back</button>
              <input value={quoteSearch} onChange={(e) => setQuoteSearch(e.target.value)} placeholder="Search by title, customer or number…" className={`${inp} w-full mb-4`} />
              <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                {quoteFiltered.length === 0 && <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">No saved quotations.</div>}
                {quoteFiltered.map((q) => (
                  <button key={q.id} onClick={() => editQuote(q.id)} className="w-full text-left bg-[#1A1A1A] border border-white/10 rounded-xl p-4 hover:border-amber-400 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{q.title || "Untitled"}{q.customer ? <span className="text-gray-400 font-normal"> · {q.customer}</span> : null}</div>
                      <div className="text-xs text-gray-500">{q.quotation_no || "no number"} · ₹{inr(q.total)}</div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded shrink-0 ${q.status === "final" ? "bg-cyan-500/15 text-cyan-400" : "bg-amber-500/15 text-amber-400"}`}>{q.status === "final" ? "finalized" : "draft"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-24 print:bg-white print:pb-0">
      <style>{`
        /* Clean, professional light quotation — a white "sheet" that prints
           perfectly on A4. Dark ink + orange accents; no white-on-white. */
        .qp{ --accent:#ff5a1f; --ink:#161616; --muted:#6f6f6f; --line:#e6e6e6; max-width:820px; margin:0 auto; background:#fff; color:var(--ink); padding:46px 50px; border-radius:6px; box-shadow:0 24px 60px rgba(0,0,0,.45); font-family:var(--font-saira),'Saira',sans-serif; }
        .qp .top{ display:flex; justify-content:space-between; align-items:flex-start; gap:20px; padding-bottom:18px; border-bottom:2px solid var(--ink); }
        .qp .brandrow{ display:flex; align-items:center; gap:13px; }
        .qp .bicon{ width:44px; height:44px; display:block; flex-shrink:0; }
        .qp .brand{ font-size:16px; font-weight:700; letter-spacing:.05em; line-height:1; }
        .qp .brand span{ color:var(--accent); }
        .qp .brand .tag{ display:block; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); font-weight:600; margin-top:6px; }
        .qp .meta{ text-align:right; }
        .qp .meta .qt{ font-size:19px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; line-height:1; }
        .qp .meta .ml{ font-size:11px; color:var(--muted); margin-top:5px; }
        .qp .qtitle{ margin-top:18px; font-size:14px; font-weight:700; }
        .qp .billto{ margin-top:12px; }
        .qp .billto .bl{ font-size:8.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); font-weight:700; margin-bottom:3px; }
        .qp .billto .bn{ font-size:13px; font-weight:700; }
        .qp .billto .bm{ font-size:11.5px; color:var(--muted); line-height:1.5; }
        .qp table{ width:100%; border-collapse:collapse; margin-top:22px; }
        .qp th{ text-align:left; font-size:9.5px; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:700; padding:0 10px 9px; border-bottom:1.5px solid var(--ink); }
        .qp td{ padding:11px 10px; border-bottom:1px solid var(--line); font-size:13px; }
        .qp td.cmp{ font-weight:700; white-space:nowrap; }
        .qp td.price,.qp th.price{ text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
        .qp table.gst th,.qp table.gst td{ padding:8px 7px; font-size:11px; }
        .qp .muted{ color:#bbb; }
        .qp .summary{ margin:20px 0 0 auto; width:330px; }
        .qp .summary .r{ display:flex; justify-content:space-between; font-size:13px; padding:7px 2px; }
        .qp .summary .r.sub{ color:var(--muted); font-size:12px; }
        .qp .summary .sep{ border-top:1px solid var(--line); margin:5px 0; }
        .qp .summary .r.final{ border-top:2px solid var(--ink); margin-top:7px; padding-top:13px; font-size:17px; font-weight:800; }
        .qp .summary .r.final .amt{ color:var(--accent); }
        .qp .note{ margin-top:34px; border-top:1px solid var(--line); padding-top:16px; text-align:center; font-size:11px; color:var(--muted); line-height:1.6; }
        .qp .note b{ color:var(--ink); font-size:13px; }
        @media print{
          @page{ size:A4; margin:14mm; }
          html,body{ background:#fff !important; }
          /* Print ONLY the quotation — hide the builder, navbar, chat widget,
             notification prompt and anything else injected by the layout. */
          body *{ visibility:hidden !important; }
          .qp-wrap, .qp-wrap *{ visibility:visible !important; }
          .qp-wrap{ width:100%; padding:0 !important; background:#fff !important; }
          .qp{ box-shadow:none !important; border-radius:0 !important; padding:0 !important; max-width:none !important; }
          .no-print{ display:none !important; }
          *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          .qp table{ break-inside:auto; }
          .qp tr,.qp .summary,.qp .note,.qp .top{ break-inside:avoid; }
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
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button onClick={backToMenu} className="px-3 py-2.5 border border-white/15 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5 flex items-center gap-2"><FaThLarge size={12} /> Menu</button>
              <button onClick={newQuotation} className="px-3 py-2.5 border border-white/15 rounded-lg text-sm font-bold text-gray-300 hover:bg-white/5">New</button>
              <button onClick={() => saveQuotation("draft")} disabled={saving} className="px-4 py-2.5 border border-white/15 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5 disabled:opacity-50">{saving ? "Saving…" : "Save draft"}</button>
              <button onClick={() => saveQuotation("final")} disabled={saving} className="px-4 py-2.5 bg-cyan-500 text-black rounded-lg text-sm font-bold hover:bg-cyan-400 disabled:opacity-50">Save final</button>
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#ff5a1f] text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90"><FaPrint /> Print</button>
            </div>
          </div>
          {quotationId && <p className="text-[11px] text-gray-500 -mt-4 mb-6">Editing saved quotation · status: <span className={status === "final" ? "text-cyan-400" : "text-amber-400"}>{status}</span></p>}

          {/* Meta */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 mb-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Quotation title / build name</label><input className={`${inp} w-full mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Nvidia Build (2x RTX 5060)" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Customer name</label><input className={`${inp} w-full mt-1`} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Quotation date</label><input type="date" className={`${inp} w-full mt-1`} value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Valid until</label><input type="date" className={`${inp} w-full mt-1`} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-gray-400">Delivery charges (₹)</label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" min="0" className={`${inp} w-full pl-6`} value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="0 = free / included" /></div></div>
            </div>

            {/* Customer contact — each field independently shown on the quote.
                An email is what triggers the auto-created account + login link. */}
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Customer contact</span>
                <span className="text-[11px] text-gray-500">Tick “show” to print a field on the quotation</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Email {customerEmail && <span className="text-[#ff5a1f]">· creates account</span>}</label>
                  <input type="email" className={`${inp} w-full mt-1`} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@email.com" />
                  <label className="flex items-center gap-2 mt-2 text-[12px] text-gray-300 cursor-pointer"><input type="checkbox" className="accent-[#ff5a1f] w-4 h-4" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} /> Show on quotation</label>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Phone</label>
                  <input className={`${inp} w-full mt-1`} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 …" />
                  <label className="flex items-center gap-2 mt-2 text-[12px] text-gray-300 cursor-pointer"><input type="checkbox" className="accent-[#ff5a1f] w-4 h-4" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} /> Show on quotation</label>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Address</label>
                  <input className={`${inp} w-full mt-1`} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="City / full address" />
                  <label className="flex items-center gap-2 mt-2 text-[12px] text-gray-300 cursor-pointer"><input type="checkbox" className="accent-[#ff5a1f] w-4 h-4" checked={showAddress} onChange={(e) => setShowAddress(e.target.checked)} /> Show on quotation</label>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-3">On <b className="text-gray-300">Save final</b>, a customer account is auto-created from the email and a seamless login link is emailed; the quotation appears in their dashboard.</p>
            </div>
          </div>

          {/* Pricing mode */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Pricing mode</span>
            <button onClick={() => setIncludeFloor(false)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${!includeFloor ? "bg-[#ff5a1f] text-black border-[#ff5a1f]" : "border-white/15 text-gray-300 hover:bg-white/5"}`}>Percent only</button>
            <button onClick={() => setIncludeFloor(true)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${includeFloor ? "bg-[#ff5a1f] text-black border-[#ff5a1f]" : "border-white/15 text-gray-300 hover:bg-white/5"}`}>Include base margin</button>
            <span className="text-[11px] text-gray-500">{includeFloor ? "SP = cost + max(percent, base margin), rounded 49/99 (same as website)." : "SP = cost + percent only, rounded 49/99 (ignores the base-margin floor)."}</span>
          </div>

          {/* GST */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">GST (18%)</span>
            <button onClick={() => setGstLocation("punjab")} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${gstLocation === "punjab" ? "bg-[#ff5a1f] text-black border-[#ff5a1f]" : "border-white/15 text-gray-300 hover:bg-white/5"}`}>Customer in Punjab (CGST + SGST)</button>
            <button onClick={() => setGstLocation("outside")} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${gstLocation === "outside" ? "bg-[#ff5a1f] text-black border-[#ff5a1f]" : "border-white/15 text-gray-300 hover:bg-white/5"}`}>Outside Punjab (IGST)</button>
            <label className="flex items-center gap-2 text-[12px] text-gray-300 cursor-pointer ml-2">
              <input type="checkbox" className="accent-[#ff5a1f] w-4 h-4" checked={gstInclusive} onChange={(e) => setGstInclusive(e.target.checked)} />
              Prices already include GST
            </label>
            <label className="flex items-center gap-2 text-[12px] text-gray-300 cursor-pointer">
              <input type="checkbox" className="accent-[#ff5a1f] w-4 h-4" checked={showGst} onChange={(e) => setShowGst(e.target.checked)} />
              Show GST breakdown on the quotation
            </label>
          </div>

          {/* Categories */}
          {cats.map((cat) => (
            <div key={cat.id} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 mb-4">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <select value={cat.dbCat} onChange={(e) => setCatDb(cat, e.target.value)} className={inp}>{CATS.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}</select>
                <input value={cat.label} onChange={(e) => patchCat(cat.id, { label: e.target.value })} className={`${inp} flex-1 min-w-[180px]`} placeholder="Label shown on quotation (e.g. Graphics Card)" />
                <button onClick={() => removeCategory(cat.id)} className="text-gray-400 hover:text-red-400 px-2" title="Remove category"><FaTrash /></button>
              </div>

              {cat.parts.map((part) => (
                <div key={part.id} className="flex flex-wrap items-center gap-2 mb-2">
                  {part.manual ? (
                    <>
                      <input value={part.name} onChange={(e) => patchPart(cat, part.id, { name: e.target.value })} className={`${inp} flex-1 min-w-[220px]`} placeholder="One-time part name" />
                      <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold">one-time</span>
                    </>
                  ) : (
                    <div className="relative flex-1 min-w-[220px]">
                      <input
                        className={`${inp} w-full`}
                        placeholder={`Search ${pretty(cat.dbCat).toLowerCase()} (name or nickname)…`}
                        value={openPart === part.id ? (partQuery[part.id] ?? part.name ?? "") : (part.name || "")}
                        onFocus={() => { setOpenPart(part.id); setPartQuery((q) => ({ ...q, [part.id]: part.name || "" })); }}
                        onChange={(e) => { setOpenPart(part.id); setPartQuery((q) => ({ ...q, [part.id]: e.target.value })); }}
                        onBlur={() => setTimeout(() => setOpenPart((o) => (o === part.id ? null : o)), 180)}
                      />
                      {openPart === part.id && (() => {
                        const q = (partQuery[part.id] ?? "").toLowerCase();
                        const list = (catalog[cat.dbCat] || []).filter((p) => !q || p.label.toLowerCase().includes(q) || p.nickname.toLowerCase().includes(q)).slice(0, 50);
                        return (
                          <div className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-[#1A1A1A] border border-white/15 rounded-lg shadow-2xl">
                            {list.length === 0 && <div className="px-3 py-2 text-xs text-gray-500">No matches — use “Add a new part”.</div>}
                            {list.map((p) => (
                              <div key={p.id} className="flex items-center hover:bg-white/5">
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); selectProduct(cat, part, p.id); setPartQuery((qq) => ({ ...qq, [part.id]: p.label })); setOpenPart(null); }} className="flex-1 text-left px-3 py-2 text-sm flex justify-between gap-3 min-w-0">
                                  <span className="truncate">{p.label}{p.draft ? <span className="text-[9px] text-amber-400 ml-1">draft</span> : null}</span>
                                  <span className="text-gray-400 shrink-0">₹{inr(p.cost)} cost</span>
                                </button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); renameItem(cat, p); }} className="px-2 text-gray-500 hover:text-cyan-400" title={p.draft ? "Rename (nickname, saved to catalogue)" : "Rename (catalogue name — affects website)"}><FaPen size={10} /></button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <input type="number" min="1" value={part.qty} onChange={(e) => patchPart(cat, part.id, { qty: Math.max(1, Number(e.target.value) || 1) })} className={`${inp} w-16`} title="Qty" />

                  {part.manual ? (
                    <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" value={part.price || ""} onChange={(e) => patchPart(cat, part.id, { price: Number(e.target.value) || 0 })} className={`${inp} w-32 pl-6`} title="Selling price" placeholder="price" /></div>
                  ) : (
                    <>
                      <div className="relative" title="Cost (distributor price) — saved to the catalogue on change"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" value={part.cost || ""} onChange={(e) => editCost(cat, part, e.target.value)} onBlur={() => persistCost(cat, part)} className={`${inp} w-28 pl-6`} placeholder="cost" /></div>
                      <span className="text-xs text-gray-300 w-28 text-right">SP ₹{inr(part.price)}</span>
                    </>
                  )}

                  <span className="text-xs text-gray-500 w-24 text-right">= ₹{inr(part.price * part.qty)}</span>
                  <button onClick={() => removePart(cat, part.id)} className="text-gray-500 hover:text-red-400 px-1" title="Remove part"><FaTrash size={12} /></button>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button onClick={() => addPart(cat)} className="text-xs font-bold text-[#ff5a1f] hover:underline flex items-center gap-1"><FaPlus size={9} /> Add part</button>
                <button onClick={() => setAdding((a) => ({ ...a, [cat.id]: a[cat.id] ? a[cat.id] : { name: "", cost: "", sell: "", save: true } }))} className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"><FaPlus size={9} /> Add a new part (not in catalogue)</button>
              </div>

              {adding[cat.id] && (() => {
                const f = adding[cat.id];
                const save = f.save !== false;
                const previewSp = save && Number(f.cost) > 0 ? sp(Number(f.cost), cat.dbCat) : 0;
                return (
                  <div className="mt-3 bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input value={f.name} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], name: e.target.value } }))} className={`${inp} flex-1 min-w-[200px]`} placeholder="New part name / model" />
                      {save ? (
                        <>
                          <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" value={f.cost} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], cost: e.target.value } }))} className={`${inp} w-36 pl-6`} placeholder="distributor price (cost)" /></div>
                          <span className="text-xs text-gray-300">→ SP ₹{inr(previewSp)}</span>
                        </>
                      ) : (
                        <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span><input type="number" value={f.sell} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], sell: e.target.value } }))} className={`${inp} w-36 pl-6`} placeholder="selling price (this quote)" /></div>
                      )}
                      <button onClick={() => submitNewPart(cat)} disabled={f.busy} className="bg-cyan-500 text-black px-4 py-2 rounded text-sm font-bold disabled:opacity-50">{f.busy ? "Adding…" : "Add"}</button>
                    </div>
                    <label className="flex items-center gap-2 mt-3 text-[12px] text-gray-300 cursor-pointer">
                      <input type="checkbox" className="accent-cyan-500 w-4 h-4" checked={save} onChange={(e) => setAdding((a) => ({ ...a, [cat.id]: { ...a[cat.id], save: e.target.checked } }))} />
                      Save this part to the catalogue
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1">{save ? "Saves name + distributor price to the catalogue; the quote SP is auto-calculated from the cost (per the pricing mode above)." : "One-time part — a manual selling price used only on this quotation. Nothing is saved."}</p>
                  </div>
                );
              })()}
            </div>
          ))}

          <button onClick={addCategory} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm font-bold text-gray-300 hover:border-[#ff5a1f] hover:text-[#ff5a1f] transition-colors flex items-center justify-center gap-2 mb-10"><FaPlus /> Add category</button>
        </div>
      </div>

      {/* ===== PRINTABLE QUOTATION PREVIEW ===== */}
      <div className="qp-wrap px-6 py-10 bg-[#0e0e0e] print:bg-white">
        <div className="qp">
          <div className="top">
            <div className="brandrow">
              <img className="bicon" src="/icons/icon_only_black.svg" alt="Rig Builders" />
              <div className="brand">RIG<span>BUILDERS</span><span className="tag">Custom Gaming PCs & Workstations · Bathinda, Punjab</span></div>
            </div>
            <div className="meta">
              <div className="qt">Quotation</div>
              {quotationNo ? <div className="ml" style={{ fontWeight: 700, color: "#161616" }}>{quotationNo}</div> : null}
              <div className="ml">{fmtD(quoteDate || new Date().toISOString())}</div>
              {validUntil ? <div className="ml">Valid until {fmtD(validUntil)}</div> : null}
            </div>
          </div>

          {title && <div className="qtitle">{title}</div>}

          {(customer || (showEmail && customerEmail) || (showPhone && customerPhone) || (showAddress && customerAddress)) && (
            <div className="billto">
              <div className="bl">Prepared for</div>
              {customer ? <div className="bn">{customer}</div> : null}
              {showAddress && customerAddress ? <div className="bm">{customerAddress}</div> : null}
              {showPhone && customerPhone ? <div className="bm">{customerPhone}</div> : null}
              {showEmail && customerEmail ? <div className="bm">{customerEmail}</div> : null}
            </div>
          )}

          <table className={showGst ? "gst" : ""}>
            <thead>
              {showGst ? (
                <tr><th>Component</th><th>Specification</th><th className="price">Taxable (₹)</th><th className="price">CGST/SGST</th><th className="price">IGST</th><th className="price">Total (₹)</th></tr>
              ) : (
                <tr><th>Component</th><th>Specification</th><th className="price">Amount (₹)</th></tr>
              )}
            </thead>
            <tbody>
              {perLine.length === 0 && <tr><td colSpan={showGst ? 6 : 3} style={{ color: "#999", textAlign: "center" }}>Add parts to see them here.</td></tr>}
              {perLine.map((l, i) => (showGst ? (
                <tr key={i}>
                  <td className="cmp">{l.label}{l.qty > 1 ? ` ×${l.qty}` : ""}</td>
                  <td>{l.name}</td>
                  <td className="price">{inr2(l.taxable)}</td>
                  <td className="price">{gstLocation === "punjab" ? inr2(l.gst) : <span className="muted">–</span>}</td>
                  <td className="price">{gstLocation === "outside" ? inr2(l.gst) : <span className="muted">–</span>}</td>
                  <td className="price">{inr2(l.lineTotal)}</td>
                </tr>
              ) : (
                <tr key={i}>
                  <td className="cmp">{l.label}{l.qty > 1 ? ` ×${l.qty}` : ""}</td>
                  <td>{l.name}</td>
                  <td className="price">{inr(l.face)}</td>
                </tr>
              )))}
            </tbody>
          </table>

          <div className="summary">
            {showGst && (
              <>
                <div className="r sub"><span>Total taxable value</span><span>₹{inr2(totalTaxable)}</span></div>
                {gstLocation === "punjab" ? (
                  <>
                    <div className="r sub"><span>CGST @ 9%</span><span>₹{inr2(gstHalf)}</span></div>
                    <div className="r sub"><span>SGST @ 9%</span><span>₹{inr2(gstHalf)}</span></div>
                    <div className="r"><span style={{ fontWeight: 700 }}>GST amount (18%){gstInclusive ? " (incl.)" : ""}</span><span style={{ fontWeight: 700 }}>₹{inr2(totalGst)}</span></div>
                  </>
                ) : (
                  <div className="r"><span style={{ fontWeight: 700 }}>IGST @ 18%{gstInclusive ? " (incl.)" : ""}</span><span style={{ fontWeight: 700 }}>₹{inr2(totalGst)}</span></div>
                )}
              </>
            )}
            {deliveryFee > 0 && <div className="r sub"><span>Delivery (insured, pan-India)</span><span>₹{inr2(deliveryFee)}</span></div>}
            <div className="r final"><span>Final amount</span><span className="amt">₹{inr2(grandTotal)}</span></div>
          </div>

          <div className="note">
            <b>Thank you for considering Rig Builders.</b>
            <div style={{ marginTop: "7px" }}>
              Every system is professionally assembled, stress-tested and delivered insured across India.
              {validUntil ? ` This quotation is valid until ${fmtD(validUntil)}.` : ""}
              {" "}Prices are subject to stock availability. · info@rigbuilders.in · www.rigbuilders.in
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
