"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaTrash, FaPlus, FaUserTag, FaPen, FaUsers, FaTimes, FaBoxOpen } from "react-icons/fa";
import { toast } from "sonner";

// Robust to any casing/spelling of the stored discount type ("percent", "PERCENT", "percentage"…)
const isPercent = (c: any) => String(c?.discount_type || "").toLowerCase().startsWith("perc");
const discountLabel = (c: any) => (isPercent(c) ? `${c.value}% OFF` : `₹${c.value} OFF`);

const emptyForm = {
  code: "",
  discount_type: "flat",
  value: "",
  min_order_value: "0",
  valid_until: "",
  assigned_to_email: "",
  active: true,
};

export default function CouponManager() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Edit modal
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });

  // Usage modal
  const [usageCoupon, setUsageCoupon] = useState<any | null>(null);
  const [usageRows, setUsageRows] = useState<any[] | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") {
        router.push("/");
        return;
      }
      setAuthChecked(true);
      fetchCoupons();
    };
    init();
  }, [router]);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data);
    setLoading(false);
  };

  // --- CREATE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      value: parseFloat(formData.value),
      min_order_value: parseFloat(formData.min_order_value || "0"),
      valid_until: formData.valid_until || null,
      assigned_to_email: formData.assigned_to_email || null,
      active: formData.active,
    };
    const { error } = await supabase.from("coupons").insert(payload);
    if (error) {
      toast.error("Error creating coupon", { description: error.message });
    } else {
      toast.success("Coupon Created");
      setShowForm(false);
      setFormData({ ...emptyForm });
      fetchCoupons();
    }
  };

  // --- EDIT ---
  const openEdit = (c: any) => {
    setEditForm({
      code: c.code || "",
      discount_type: isPercent(c) ? "percent" : "flat",
      value: String(c.value ?? ""),
      min_order_value: String(c.min_order_value ?? "0"),
      valid_until: c.valid_until ? String(c.valid_until).slice(0, 10) : "",
      assigned_to_email: c.assigned_to_email || "",
      active: !!c.active,
    });
    setEditing(c);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      code: editForm.code.toUpperCase().trim(),
      discount_type: editForm.discount_type,
      value: parseFloat(editForm.value),
      min_order_value: parseFloat(editForm.min_order_value || "0"),
      valid_until: editForm.valid_until || null,
      assigned_to_email: editForm.assigned_to_email || null,
      active: editForm.active,
    };
    const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
    if (error) {
      toast.error("Update failed", { description: error.message });
    } else {
      toast.success("Coupon updated");
      setEditing(null);
      fetchCoupons();
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await supabase.from("coupons").update({ active: !currentStatus }).eq("id", id);
    fetchCoupons();
  };

  // --- USAGE (who redeemed + what they bought) ---
  const openUsage = async (c: any) => {
    setUsageCoupon(c);
    setUsageRows(null);
    setUsageError(null);
    setUsageLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("display_id, full_name, email, created_at, total_amount, discount, items, payment_mode")
      .eq("coupon_code", c.code)
      .order("created_at", { ascending: false });

    if (error) {
      // Most likely the coupon_code column doesn't exist yet.
      setUsageError(
        "Redemption tracking isn't set up yet. Run security/coupon_tracking.sql, then new orders that use a code will appear here."
      );
    } else {
      setUsageRows(data || []);
    }
    setUsageLoading(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">
        Verifying access...
      </div>
    );
  }

  const inputCls = "w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:border-brand-purple outline-none";
  const labelCls = "text-xs text-brand-silver font-bold uppercase block mb-2";

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-28 px-6 max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold text-brand-purple">COUPON MANAGER</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-purple hover:bg-white hover:text-black px-6 py-2 rounded font-bold transition-all flex items-center gap-2">
            <FaPlus /> Create New
          </button>
        </div>

        {/* --- CREATION FORM --- */}
        {showForm && (
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/10 mb-8 animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Coupon Code</label>
                <input required className={`${inputCls} font-bold tracking-widest uppercase`} placeholder="E.g. SUMMER50" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Discount Type</label>
                <select className={inputCls} value={formData.discount_type} onChange={e => setFormData({ ...formData, discount_type: e.target.value })}>
                  <option value="flat">Flat Amount (₹)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Value {formData.discount_type === "percent" ? "(%)" : "(₹)"}</label>
                <input required type="number" className={inputCls} placeholder={formData.discount_type === "percent" ? "10" : "500"} value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Min Order Value (₹)</label>
                <input type="number" className={inputCls} placeholder="0" value={formData.min_order_value} onChange={e => setFormData({ ...formData, min_order_value: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Assign to Creator (Optional)</label>
                <input type="email" className="w-full bg-brand-purple/10 border border-brand-purple/30 p-3 rounded text-brand-purple placeholder-brand-purple/30 focus:border-brand-purple outline-none" placeholder="influencer@gmail.com" value={formData.assigned_to_email} onChange={e => setFormData({ ...formData, assigned_to_email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Valid Until (Optional)</label>
                <input type="date" className={inputCls} value={formData.valid_until} onChange={e => setFormData({ ...formData, valid_until: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <button className="w-full bg-white text-black font-bold py-3 rounded hover:bg-brand-purple hover:text-white transition-all">SAVE COUPON</button>
              </div>
            </form>
          </div>
        )}

        {/* --- COUPON LIST --- */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-brand-silver uppercase font-bold text-xs">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Usage</th>
                <th className="p-4">Creator</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold font-orbitron text-lg">{coupon.code}</td>
                  <td className="p-4 text-brand-purple font-bold">{discountLabel(coupon)}</td>
                  <td className="p-4">
                    <button onClick={() => openUsage(coupon)} className="bg-white/10 hover:bg-brand-purple/30 px-2 py-1 rounded text-xs font-bold flex items-center gap-2 transition-colors">
                      <FaUsers /> {coupon.usage_count || 0} Uses
                    </button>
                  </td>
                  <td className="p-4">
                    {coupon.assigned_to_email ? (
                      <div className="flex items-center gap-2 text-yellow-400"><FaUserTag /> {coupon.assigned_to_email}</div>
                    ) : (
                      <span className="text-white/20">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => toggleStatus(coupon.id, coupon.active)} className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${coupon.active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                      {coupon.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(coupon)} className="text-white/40 hover:text-brand-purple transition-colors" title="Edit"><FaPen /></button>
                      <button onClick={() => toggleStatus(coupon.id, true)} className="text-white/20 hover:text-red-500 transition-colors" title="Deactivate"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && !loading && (
            <div className="p-8 text-center text-brand-silver">No coupons found. Create one above.</div>
          )}
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 bg-[#1A1A1A] border border-white/10 rounded-xl w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 text-brand-silver hover:text-white"><FaTimes size={18} /></button>
            <h2 className="font-orbitron text-xl font-bold text-white mb-6">EDIT COUPON</h2>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Coupon Code</label>
                <input required className={`${inputCls} font-bold tracking-widest uppercase`} value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Discount Type</label>
                <select className={inputCls} value={editForm.discount_type} onChange={e => setEditForm({ ...editForm, discount_type: e.target.value })}>
                  <option value="flat">Flat Amount (₹)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Value {editForm.discount_type === "percent" ? "(%)" : "(₹)"}</label>
                <input required type="number" className={inputCls} value={editForm.value} onChange={e => setEditForm({ ...editForm, value: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Min Order Value (₹)</label>
                <input type="number" className={inputCls} value={editForm.min_order_value} onChange={e => setEditForm({ ...editForm, min_order_value: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Assign to Creator</label>
                <input type="email" className={inputCls} placeholder="influencer@gmail.com" value={editForm.assigned_to_email} onChange={e => setEditForm({ ...editForm, assigned_to_email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Valid Until</label>
                <input type="date" className={inputCls} value={editForm.valid_until} onChange={e => setEditForm({ ...editForm, valid_until: e.target.value })} />
              </div>
              <label className="flex items-center gap-3 md:col-span-2 cursor-pointer">
                <input type="checkbox" checked={editForm.active} onChange={e => setEditForm({ ...editForm, active: e.target.checked })} className="w-4 h-4 accent-brand-purple" />
                <span className="text-sm text-brand-silver">Active</span>
              </label>
              <div className="md:col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 border border-white/10 py-3 rounded font-bold text-brand-silver hover:bg-white/5">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-purple hover:bg-white hover:text-black text-white font-bold py-3 rounded transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- USAGE MODAL --- */}
      {usageCoupon && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setUsageCoupon(null)} />
          <div className="relative z-10 bg-[#1A1A1A] border border-white/10 rounded-xl w-full max-w-3xl p-8 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setUsageCoupon(null)} className="absolute top-4 right-4 text-brand-silver hover:text-white"><FaTimes size={18} /></button>
            <h2 className="font-orbitron text-xl font-bold text-white mb-1">
              REDEMPTIONS — <span className="text-brand-purple">{usageCoupon.code}</span>
            </h2>
            <p className="text-xs text-brand-silver mb-6">{discountLabel(usageCoupon)} · {usageCoupon.usage_count || 0} total uses recorded</p>

            <div className="overflow-y-auto custom-scrollbar -mx-2 px-2">
              {usageLoading && <p className="text-brand-silver animate-pulse py-8 text-center">Loading redemptions…</p>}
              {usageError && <p className="text-yellow-500/80 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded p-4">{usageError}</p>}

              {!usageLoading && !usageError && usageRows && usageRows.length === 0 && (
                <p className="text-brand-silver/50 italic py-8 text-center">No orders have used this code yet.</p>
              )}

              {!usageLoading && !usageError && usageRows && usageRows.length > 0 && (
                <div className="space-y-3">
                  {usageRows.map((o, i) => (
                    <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-white">{o.full_name || "Guest"}</div>
                          <div className="text-xs text-brand-silver">{o.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-orbitron font-bold text-white">₹{Number(o.total_amount || 0).toLocaleString("en-IN")}</div>
                          {o.discount > 0 && <div className="text-[10px] text-green-400">−₹{Number(o.discount).toLocaleString("en-IN")} off</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-brand-silver/80 mb-2">
                        <FaBoxOpen className="text-brand-purple" />
                        {(o.items || []).map((it: any, j: number) => (
                          <span key={j} className="bg-white/5 px-2 py-0.5 rounded">
                            {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                          </span>
                        ))}
                        {(!o.items || o.items.length === 0) && <span className="italic">No item details</span>}
                      </div>
                      <div className="flex justify-between text-[10px] text-white/30 font-mono uppercase">
                        <span>{o.display_id}</span>
                        <span>{o.payment_mode} · {new Date(o.created_at).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
