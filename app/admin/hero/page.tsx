"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaPlus, FaPen, FaTrash, FaImages, FaTimes, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { toast } from "sonner";

const ADMIN_EMAIL = "rigbuilders123@gmail.com";

const LOCATIONS = [
  { id: "home", label: "Home (hero)" },
  { id: "desktops", label: "Desktops page" },
  { id: "products", label: "Products page" },
  { id: "accessories", label: "Accessories page" },
];

const emptyForm = {
  id: "",
  sort_order: "100",
  active: true,
  location: "home",
  eyebrow: "",
  heading: "",
  heading_accent: "",
  subheading: "",
  text_align: "left",
  image_url: "",
  image_url_mobile: "",
  image_position: "right",
  image_aspect: "portrait",
  image_opacity: "100",
  cta1_label: "",
  cta1_link: "",
  cta1_style: "primary",
  cta2_label: "",
  cta2_link: "",
  cta2_style: "secondary",
};
type Form = typeof emptyForm;

const alignText: Record<string, string> = { left: "text-left items-start", center: "text-center items-center", right: "text-right items-end" };
const alignRow: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" };

export default function HeroEditor() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({ ...emptyForm });
  const [mounted, setMounted] = useState(false);
  const [loc, setLoc] = useState("home"); // which carousel is being managed

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) { router.push("/"); return; }
      setAuthChecked(true);
      fetchSlides();
    })();
  }, [router]);

  const fetchSlides = async () => {
    setLoading(true);
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order", { ascending: true });
    setSlides(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    const maxSort = slides.filter((s) => (s.location || "home") === loc).reduce((m, s) => Math.max(m, s.sort_order ?? 0), 0);
    setForm({ ...emptyForm, sort_order: String(maxSort + 10), location: loc });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s: any) => {
    setForm({
      id: s.id,
      sort_order: String(s.sort_order ?? 100),
      active: s.active !== false,
      location: s.location || "home",
      eyebrow: s.eyebrow || "",
      heading: s.heading || "",
      heading_accent: s.heading_accent || "",
      subheading: s.subheading || "",
      text_align: s.text_align || "left",
      image_url: s.image_url || "",
      image_url_mobile: s.image_url_mobile || "",
      image_position: s.image_position || "right",
      image_aspect: s.image_aspect || "portrait",
      image_opacity: String(s.image_opacity ?? 100),
      cta1_label: s.cta1_label || "",
      cta1_link: s.cta1_link || "",
      cta1_style: s.cta1_style || "primary",
      cta2_label: s.cta2_label || "",
      cta2_link: s.cta2_link || "",
      cta2_style: s.cta2_style || "secondary",
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heading.trim()) { toast.error("Heading is required."); return; }
    const payload: any = {
      sort_order: parseInt(form.sort_order || "100", 10) || 100,
      active: form.active,
      location: form.location || "home",
      eyebrow: form.eyebrow.trim() || null,
      heading: form.heading.trim(),
      heading_accent: form.heading_accent.trim() || null,
      subheading: form.subheading.trim() || null,
      text_align: form.text_align,
      image_url: form.image_url.trim() || null,
      image_url_mobile: form.image_url_mobile.trim() || null,
      image_position: form.image_position,
      image_aspect: form.image_aspect,
      image_opacity: Math.max(0, Math.min(100, parseInt(form.image_opacity || "100", 10) || 100)),
      cta1_label: form.cta1_label.trim() || null,
      cta1_link: form.cta1_link.trim() || null,
      cta1_style: form.cta1_style,
      cta2_label: form.cta2_label.trim() || null,
      cta2_link: form.cta2_link.trim() || null,
      cta2_style: form.cta2_style,
    };
    const q = editingId
      ? supabase.from("hero_slides").update(payload).eq("id", editingId)
      : supabase.from("hero_slides").insert(payload);
    const { error } = await q;
    if (error) { toast.error("Save failed", { description: error.message }); return; }
    toast.success(editingId ? "Slide updated" : "Slide created");
    setShowForm(false);
    fetchSlides();
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Delete this hero slide (${s.heading || "untitled"})?`)) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", s.id);
    if (error) { toast.error("Delete failed", { description: error.message }); return; }
    toast.success("Slide deleted");
    fetchSlides();
  };

  const move = async (list: any[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    if (a.sort_order === b.sort_order) b.sort_order = a.sort_order + dir; // guard equal values
    await supabase.from("hero_slides").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("hero_slides").update({ sort_order: a.sort_order }).eq("id", b.id);
    fetchSlides();
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-rb-black flex items-center justify-center text-white font-orbitron animate-pulse">Verifying access…</div>;
  }

  const input = "w-full bg-rb-black border border-rb-line p-2.5 rounded text-white text-sm focus:border-rb-orange outline-none transition-colors";
  const label = "text-[11px] text-rb-silver font-bold uppercase block mb-1.5";
  const shown = slides.filter((s) => (s.location || "home") === loc);

  return (
    <div className="min-h-screen bg-rb-black text-white font-saira pb-24">
      <Navbar />
      <div className="pt-28 px-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-rb-orange flex items-center gap-3"><FaImages /> HERO CAROUSEL</h1>
            <p className="text-rb-silver text-sm mt-1">Add, edit, reorder and hide homepage hero slides. Changes appear on the site automatically.</p>
          </div>
          <button onClick={openCreate} className="rb-cta px-6 py-2.5 rounded font-bold flex items-center gap-2 text-sm"><FaPlus /> New Slide</button>
        </div>

        {/* which page's carousel */}
        <div className="flex gap-2 mb-6">
          {LOCATIONS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLoc(l.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                loc === l.id ? "bg-rb-orange text-rb-orange-ink border-rb-orange" : "bg-rb-surface text-rb-silver border-rb-line hover:text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-rb-silver animate-pulse">Loading slides…</p>
        ) : shown.length === 0 ? (
          <div className="p-8 text-center text-rb-silver/50 bg-rb-surface rounded-xl border border-rb-line">No slides for this page yet. Click “New Slide” to add one.</div>
        ) : (
          <div className="bg-rb-surface rounded-xl border border-rb-line overflow-hidden">
            {shown.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 p-4 border-b border-rb-line last:border-0 hover:bg-white/5">
                <div className="flex flex-col gap-1">
                  <button onClick={() => move(shown, i, -1)} disabled={i === 0} className="text-white/30 hover:text-rb-orange disabled:opacity-20 p-1"><FaArrowUp size={11} /></button>
                  <button onClick={() => move(shown, i, 1)} disabled={i === shown.length - 1} className="text-white/30 hover:text-rb-orange disabled:opacity-20 p-1"><FaArrowDown size={11} /></button>
                </div>
                <div className="w-16 h-12 rounded bg-black/40 border border-rb-line overflow-hidden shrink-0 flex items-center justify-center">
                  {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover" /> : <FaImages className="text-white/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white flex items-center gap-2 truncate">
                    {s.heading} {s.heading_accent && <span className="text-rb-orange">{s.heading_accent}</span>}
                    {!s.active && <span className="text-[9px] bg-rb-danger/20 text-rb-danger px-1.5 py-0.5 rounded uppercase">Hidden</span>}
                  </div>
                  <div className="text-xs text-rb-silver/70 font-mono">
                    text-{s.text_align} · image-{s.image_position} · {s.image_aspect}
                  </div>
                </div>
                <button onClick={() => openEdit(s)} className="text-white/40 hover:text-rb-orange p-2" title="Edit"><FaPen /></button>
                <button onClick={() => handleDelete(s)} className="text-white/30 hover:text-rb-danger p-2" title="Delete"><FaTrash /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL — portalled to body (escapes the page-transition transform). */}
      {showForm && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 bg-rb-surface border border-rb-line rounded-xl w-full max-w-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-rb-silver hover:text-white"><FaTimes size={18} /></button>
            <h2 className="font-orbitron text-xl font-bold text-white mb-5">{editingId ? "EDIT SLIDE" : "NEW SLIDE"}</h2>

            {/* LIVE PREVIEW */}
            <SlidePreview form={form} />

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div><label className={label}>Eyebrow (small line)</label><input className={input} placeholder="Welcome to" value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={label}>Heading</label><input required className={input} placeholder="RIG" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} /></div>
                <div><label className={label}>Accent (orange)</label><input className={input} placeholder="BUILDERS" value={form.heading_accent} onChange={(e) => setForm({ ...form, heading_accent: e.target.value })} /></div>
              </div>
              <div className="md:col-span-2"><label className={label}>Subheading</label><input className={input} placeholder="Commissioned. Not assembled…" value={form.subheading} onChange={(e) => setForm({ ...form, subheading: e.target.value })} /></div>

              <div><label className={label}>Text alignment</label>
                <select className={input} value={form.text_align} onChange={(e) => setForm({ ...form, text_align: e.target.value })}>
                  <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                </select>
              </div>
              <div><label className={label}>Sort order</label><input type="number" className={input} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={label}>Page (carousel location)</label>
                <select className={input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                  {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 border-t border-rb-line pt-4 mt-1">
                <p className="text-[10px] uppercase tracking-widest text-rb-silver/60 mb-3">Image (local /public path)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className={label}>Image URL (desktop)</label><input className={input} placeholder="/images/homepage/hero/1.jpg" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
                  <div className="md:col-span-2"><label className={label}>Image URL — mobile <span className="text-rb-silver/50 normal-case font-normal">(optional · falls back to desktop)</span></label><input className={input} placeholder="/images/homepage/hero/1-mobile.jpg" value={form.image_url_mobile} onChange={(e) => setForm({ ...form, image_url_mobile: e.target.value })} /></div>
                  <div><label className={label}>Image position</label>
                    <select className={input} value={form.image_position} onChange={(e) => setForm({ ...form, image_position: e.target.value })}>
                      <option value="right">Right of text</option><option value="left">Left of text</option><option value="background">Full-bleed background</option>
                    </select>
                  </div>
                  <div><label className={label}>Image size</label>
                    <select className={input} value={form.image_aspect} onChange={(e) => setForm({ ...form, image_aspect: e.target.value })}>
                      <option value="portrait">Portrait (4:5)</option><option value="landscape">Landscape (16:9)</option><option value="square">Square (1:1)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={label}>Image opacity — {form.image_opacity}%</label>
                    <input type="range" min={0} max={100} step={5} value={form.image_opacity}
                      onChange={(e) => setForm({ ...form, image_opacity: e.target.value })}
                      className="w-full accent-rb-orange" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 border-t border-rb-line pt-4 mt-1">
                <p className="text-[10px] uppercase tracking-widest text-rb-silver/60 mb-3">CTAs (buttons follow the text alignment)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-3 rounded bg-rb-black/40 border border-rb-line">
                    <label className={label}>Button 1 — label</label><input className={input} placeholder="Build Your Rig" value={form.cta1_label} onChange={(e) => setForm({ ...form, cta1_label: e.target.value })} />
                    <input className={input} placeholder="/configure" value={form.cta1_link} onChange={(e) => setForm({ ...form, cta1_link: e.target.value })} />
                    <select className={input} value={form.cta1_style} onChange={(e) => setForm({ ...form, cta1_style: e.target.value })}><option value="primary">Primary (orange)</option><option value="secondary">Secondary (ghost)</option></select>
                  </div>
                  <div className="space-y-2 p-3 rounded bg-rb-black/40 border border-rb-line">
                    <label className={label}>Button 2 — label</label><input className={input} placeholder="Explore Rigs" value={form.cta2_label} onChange={(e) => setForm({ ...form, cta2_label: e.target.value })} />
                    <input className={input} placeholder="/products" value={form.cta2_link} onChange={(e) => setForm({ ...form, cta2_link: e.target.value })} />
                    <select className={input} value={form.cta2_style} onChange={(e) => setForm({ ...form, cta2_style: e.target.value })}><option value="primary">Primary (orange)</option><option value="secondary">Secondary (ghost)</option></select>
                  </div>
                </div>
              </div>

              <label className="md:col-span-2 flex items-center gap-2 cursor-pointer text-sm text-rb-silver pt-1">
                <input type="checkbox" className="w-4 h-4 accent-rb-orange" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active (shown in the carousel)
              </label>

              <div className="md:col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-rb-line py-3 rounded font-bold text-rb-silver hover:bg-white/5">Cancel</button>
                <button type="submit" className="rb-cta flex-1 py-3 rounded font-bold">{editingId ? "Save Changes" : "Create Slide"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* Compact live preview reflecting the form. */
function SlidePreview({ form }: { form: Form }) {
  const ctas = [form.cta1_label, form.cta2_label].filter(Boolean);
  const text = (
    <div className={`flex flex-col ${alignText[form.text_align]} gap-1`}>
      {form.eyebrow && <span className="text-[7px] uppercase tracking-[0.2em] text-rb-silver">{form.eyebrow}</span>}
      <span className="font-orbitron font-black text-white text-sm leading-none">
        {form.heading} {form.heading_accent && <span className="text-rb-orange">{form.heading_accent}</span>}
      </span>
      {form.subheading && <span className="text-[7px] text-rb-silver/70 line-clamp-2 max-w-[60%]">{form.subheading}</span>}
      {ctas.length > 0 && (
        <div className={`flex gap-1 mt-1 w-full ${alignRow[form.text_align]}`}>
          {ctas.map((c, i) => <span key={i} className={`text-[6px] px-2 py-0.5 rounded ${i === 0 && form.cta1_style === "primary" ? "bg-rb-orange text-black" : "border border-rb-line text-white"}`}>{c}</span>)}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative h-36 rounded-lg overflow-hidden border border-rb-line bg-rb-black">
      {form.image_position === "background" ? (
        <>
          {form.image_url && <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: (parseInt(form.image_opacity || "100", 10) || 100) / 100 }} />}
          <div className="absolute inset-0 bg-rb-black/60" />
          <div className={`relative h-full flex items-center px-4 ${alignRow[form.text_align]}`}><div className="max-w-[70%]">{text}</div></div>
        </>
      ) : (
        <div className={`h-full grid grid-cols-2 gap-3 p-4 items-center ${form.image_position === "left" ? "" : ""}`}>
          <div className={form.image_position === "left" ? "order-2" : "order-1"}>{text}</div>
          <div className={form.image_position === "left" ? "order-1" : "order-2"}>
            <div className="rounded border border-rb-line overflow-hidden bg-black/40 h-24 flex items-center justify-center">
              {form.image_url ? <img src={form.image_url} alt="" className="w-full h-full object-cover" style={{ opacity: (parseInt(form.image_opacity || "100", 10) || 100) / 100 }} /> : <FaImages className="text-white/20" />}
            </div>
          </div>
        </div>
      )}
      <span className="absolute top-1 right-2 text-[7px] uppercase tracking-widest text-rb-silver/50">preview</span>
    </div>
  );
}
