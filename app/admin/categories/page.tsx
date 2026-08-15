"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaPlus, FaPen, FaTrash, FaLayerGroup, FaTimes } from "react-icons/fa";
import { toast } from "sonner";

const GROUPS = [
  { id: "components", name: "PC Components (Products menu)" },
  { id: "accessories", name: "Accessories" },
  { id: "desktops", name: "Desktops / Pre-built" },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const emptyForm = {
  id: "",
  name: "",
  group_id: "components",
  short_name: "",
  card_title: "",
  subtitle: "",
  description: "",
  image_url: "",
  card_image_mobile: "",
  funnel: "simple",
  hub_step: false,
  show_in_hub: false,
  sort_order: "100",
  active: true,
};

export default function CategoryBuilder() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = creating
  const [form, setForm] = useState({ ...emptyForm });
  const [slugTouched, setSlugTouched] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") { router.push("/"); return; }
      setAuthChecked(true);
      fetchCats();
    };
    init();
  }, [router]);

  const fetchCats = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    setCats(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setSlugTouched(false);
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setForm({
      id: c.id,
      name: c.name || "",
      group_id: c.group_id || "components",
      short_name: c.short_name || "",
      card_title: c.card_title || "",
      subtitle: c.subtitle || "",
      description: c.description || "",
      image_url: c.image_url || "",
      card_image_mobile: c.card_image_mobile || "",
      funnel: c.funnel || "simple",
      hub_step: !!c.hub_step,
      show_in_hub: !!c.show_in_hub,
      sort_order: String(c.sort_order ?? 100),
      active: c.active !== false,
    });
    setEditingId(c.id);
    setSlugTouched(true);
    setShowForm(true);
  };

  // name → auto-slug (only while creating and the slug hasn't been hand-edited)
  const onNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, id: !editingId && !slugTouched ? slugify(name) : f.id }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = slugify(form.id || form.name);
    if (!form.name.trim() || !id) { toast.error("Name (and slug) are required."); return; }

    // Uniqueness check when creating a new slug.
    if (!editingId && cats.some((c) => c.id === id)) {
      toast.error(`Slug "${id}" already exists — pick another.`);
      return;
    }

    const payload = {
      id,
      name: form.name.trim(),
      group_id: form.group_id,
      short_name: form.short_name.trim() || form.name.trim(),
      card_title: form.card_title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      card_image_mobile: form.card_image_mobile.trim() || null,
      funnel: form.funnel,
      hub_step: form.hub_step,
      show_in_hub: form.show_in_hub,
      sort_order: parseInt(form.sort_order || "100", 10) || 100,
      active: form.active,
    };

    const { error } = await supabase.from("categories").upsert(payload);
    if (error) { toast.error("Save failed", { description: error.message }); return; }
    toast.success(editingId ? "Category updated" : "Category created");
    setShowForm(false);
    fetchCats();
  };

  const handleDelete = async (c: any) => {
    // Warn if products are tagged to this category (they'd be orphaned).
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", c.id);
    const msg = count && count > 0
      ? `${count} product(s) are in "${c.name}". Deleting the category will leave them unbrowsable. Delete anyway?`
      : `Delete category "${c.name}"?`;
    if (!confirm(msg)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error("Delete failed", { description: error.message }); return; }
    toast.success("Category deleted");
    fetchCats();
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">Verifying access...</div>;
  }

  const input = "w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:border-brand-purple outline-none";
  const label = "text-xs text-brand-silver font-bold uppercase block mb-2";

  const grouped = GROUPS.map((g) => ({ ...g, items: cats.filter((c) => c.group_id === g.id) }));

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-28 px-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-brand-purple flex items-center gap-3"><FaLayerGroup /> CATEGORY BUILDER</h1>
            <p className="text-brand-silver text-sm mt-1">Add, edit and remove storefront categories. Changes appear on the site automatically.</p>
          </div>
          <button onClick={openCreate} className="bg-brand-purple hover:bg-white hover:text-black px-6 py-2 rounded font-bold transition-all flex items-center gap-2"><FaPlus /> New Category</button>
        </div>

        {loading ? (
          <p className="text-brand-silver animate-pulse">Loading categories…</p>
        ) : (
          <div className="space-y-8">
            {grouped.map((g) => (
              <div key={g.id}>
                <h2 className="font-orbitron text-sm font-bold text-brand-purple uppercase tracking-widest mb-3">{g.name}</h2>
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
                  {g.items.length === 0 ? (
                    <div className="p-4 text-brand-silver/40 text-sm italic">No categories in this group.</div>
                  ) : g.items.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5">
                      <div className="w-12 h-12 rounded bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover" /> : <FaLayerGroup className="text-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white flex items-center gap-2">
                          {c.name}
                          {!c.active && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase">Hidden</span>}
                          {c.show_in_hub && <span className="text-[9px] bg-brand-purple/20 text-brand-purple px-1.5 py-0.5 rounded uppercase">Hub</span>}
                        </div>
                        <div className="text-xs text-brand-silver font-mono">/products/{c.id}{c.funnel === "landing" ? " · funnel" : ""}</div>
                      </div>
                      <button onClick={() => openEdit(c)} className="text-white/40 hover:text-brand-purple p-2" title="Edit"><FaPen /></button>
                      <button onClick={() => handleDelete(c)} className="text-white/30 hover:text-red-500 p-2" title="Delete"><FaTrash /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL — portalled to <body> so it centres on the viewport
          (the page-transition template applies a filter/transform that would
          otherwise trap position:fixed inside it). */}
      {showForm && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 bg-[#1A1A1A] border border-white/10 rounded-xl w-full max-w-2xl p-8 shadow-2xl max-h-[88vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-brand-silver hover:text-white"><FaTimes size={18} /></button>
            <h2 className="font-orbitron text-xl font-bold text-white mb-6">{editingId ? "EDIT CATEGORY" : "NEW CATEGORY"}</h2>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>UI Name</label>
                <input required className={input} placeholder="Headphones" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
              </div>
              <div>
                <label className={label}>Slug (URL) {editingId && <span className="text-white/30 normal-case">— locked</span>}</label>
                <input className={`${input} font-mono ${editingId ? "opacity-50 cursor-not-allowed" : ""}`} value={form.id}
                  readOnly={!!editingId}
                  onChange={(e) => { setSlugTouched(true); setForm({ ...form, id: e.target.value }); }} placeholder="headphones" />
              </div>
              <div>
                <label className={label}>Group</label>
                <select className={input} value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
                  {GROUPS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Short name (breadcrumb/menu)</label>
                <input className={input} placeholder="Headphones" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
              </div>

              <div className="md:col-span-2 border-t border-white/10 pt-4 mt-1">
                <p className="text-[10px] uppercase tracking-widest text-brand-silver/60 mb-3">Hub card (only if “Show on /products hub” is on)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={label}>Card title</label><input className={input} placeholder="HEADPHONES" value={form.card_title} onChange={(e) => setForm({ ...form, card_title: e.target.value })} /></div>
                  <div><label className={label}>Subtitle (kicker)</label><input className={input} placeholder="AUDIO GEAR" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
                  <div className="md:col-span-2"><label className={label}>Description</label><input className={input} placeholder="Wired & wireless headsets" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label className={label}>Desktop card image (local URL)</label><input className={input} placeholder="/images/Products/headphones.jpg" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
                  <div><label className={label}>Mobile card image (local URL)</label><input className={input} placeholder="/images/mobile/headphones.jpg" value={form.card_image_mobile} onChange={(e) => setForm({ ...form, card_image_mobile: e.target.value })} /></div>
                </div>
              </div>

              <div>
                <label className={label}>Funnel</label>
                <select className={input} value={form.funnel} onChange={(e) => setForm({ ...form, funnel: e.target.value })}>
                  <option value="simple">Simple (plain product grid)</option>
                  <option value="landing">Landing (brand/maker picker — gpu/cpu style)</option>
                </select>
              </div>
              <div>
                <label className={label}>Sort order</label>
                <input type="number" className={input} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-silver"><input type="checkbox" className="w-4 h-4 accent-brand-purple" checked={form.show_in_hub} onChange={(e) => setForm({ ...form, show_in_hub: e.target.checked })} /> Show on /products hub</label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-silver"><input type="checkbox" className="w-4 h-4 accent-brand-purple" checked={form.hub_step} onChange={(e) => setForm({ ...form, hub_step: e.target.checked })} /> Has chipset step (gpu/mobo)</label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-silver"><input type="checkbox" className="w-4 h-4 accent-brand-purple" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active (visible)</label>
              </div>

              <div className="md:col-span-2 flex gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-white/10 py-3 rounded font-bold text-brand-silver hover:bg-white/5">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-purple hover:bg-white hover:text-black text-white font-bold py-3 rounded transition-all">{editingId ? "Save Changes" : "Create Category"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
