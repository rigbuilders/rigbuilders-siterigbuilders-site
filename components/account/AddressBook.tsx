"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash, FaHome, FaBriefcase, FaMapMarkerAlt } from "react-icons/fa";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
];

const EMPTY = { full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", label: "Home", is_default: false };

const inputCls = "w-full bg-rb-black border border-rb-line p-3 rounded-lg text-sm text-white placeholder:text-rb-silver/60 focus:border-rb-orange outline-none transition-colors font-saira";

/**
 * Self-contained Address Book. Renders only the inner content (no navbar/footer),
 * so it can live inside the dashboard tab OR any page shell.
 */
export default function AddressBook() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY });
  const router = useRouter();

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/signin"); return; }
    const { data } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (formData.is_default) {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    }
    const { error } = await supabase.from("user_addresses").insert({ ...formData, user_id: user.id });
    if (error) { alert("Error saving address: " + error.message); return; }
    setShowForm(false);
    setFormData({ ...EMPTY });
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    await supabase.from("user_addresses").delete().eq("id", id);
    fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    fetchAddresses();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-end">
        <div>
          <span className="rb-kicker">Delivery details</span>
          <h2 className="mt-1 font-orbitron text-2xl sm:text-3xl font-black uppercase text-rb-white">Address <span className="rb-text-ember">Book</span></h2>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`${showForm ? "rb-ghost" : "rb-cta"} px-5 py-2.5 rounded-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2 self-start sm:self-auto`}
        >
          <FaPlus /> {showForm ? "Cancel" : "Add New"}
        </button>
      </div>

      {loading ? (
        <p className="text-rb-silver text-sm animate-pulse">Loading addresses…</p>
      ) : (
        <>
          {showForm && (
            <form onSubmit={handleSubmit} className="rb-surface-card !bg-rb-black p-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input required placeholder="Full Name" className={inputCls} value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                <input required placeholder="Phone Number" className={inputCls} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-3 mb-4">
                <input required placeholder="Address Line 1 (House No, Building)" className={inputCls} value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} />
                <input placeholder="Address Line 2 (Road, Area, Landmark)" className={inputCls} value={formData.address_line2} onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <input required placeholder="City" className={inputCls} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                <select required className={inputCls} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input required placeholder="Pincode" maxLength={6} className={inputCls} value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center border-t border-rb-line pt-4">
                <div className="flex items-center gap-4">
                  <select className={`${inputCls} !p-2 !w-auto text-xs`} value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })}>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-rb-orange w-4 h-4" checked={formData.is_default} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })} />
                    <span className="text-xs text-rb-silver">Make Default</span>
                  </label>
                </div>
                <button type="submit" className="rb-cta px-6 py-2.5 rounded-lg font-bold uppercase text-xs tracking-widest">Save Address</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {addresses.map((addr) => (
              <div key={addr.id} className={`relative p-6 rounded-2xl border transition-all ${addr.is_default ? "bg-rb-orange/10 border-rb-orange shadow-[0_0_24px_-8px_rgba(255,90,31,0.5)]" : "rb-surface-card !bg-rb-black"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {addr.label === "Home" && <FaHome className="text-rb-orange" />}
                    {addr.label === "Work" && <FaBriefcase className="text-rb-orange" />}
                    {addr.label === "Other" && <FaMapMarkerAlt className="text-rb-orange" />}
                    <span className="font-bold text-sm uppercase tracking-wider text-rb-white">{addr.label}</span>
                    {addr.is_default && <span className="text-[9px] bg-rb-orange text-rb-orange-ink px-2 py-0.5 rounded uppercase font-bold">Default</span>}
                  </div>
                  <div className="flex gap-3 items-center">
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)} className="text-rb-silver hover:text-rb-orange text-[10px] uppercase tracking-wider font-bold transition-colors">Set Default</button>
                    )}
                    <button onClick={() => handleDelete(addr.id)} className="text-rb-danger hover:bg-rb-danger/10 p-1.5 rounded transition-colors"><FaTrash size={12} /></button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-rb-white mb-1">{addr.full_name}</h3>
                <p className="text-rb-silver text-sm mb-4">{addr.phone}</p>
                <div className="text-rb-mist text-sm leading-relaxed">
                  <p>{addr.address_line1}</p>
                  {addr.address_line2 && <p>{addr.address_line2}</p>}
                  <p>{addr.city}, {addr.state} — <span className="font-bold text-rb-white">{addr.pincode}</span></p>
                </div>
              </div>
            ))}
          </div>

          {addresses.length === 0 && !showForm && (
            <div className="text-center py-16 text-rb-silver border border-dashed border-rb-line rounded-2xl">
              No addresses saved. Add one to speed up checkout.
            </div>
          )}
        </>
      )}
    </div>
  );
}
