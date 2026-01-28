"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaTrash, FaPlus, FaUserTag } from "react-icons/fa";
import { toast } from "sonner";

export default function CouponManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "flat", // 'flat' or 'percent'
    value: "",
    min_order_value: "0",
    valid_until: "",
    assigned_to_email: "", // <--- NEW FIELD
    active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        value: parseFloat(formData.value),
        min_order_value: parseFloat(formData.min_order_value),
        valid_until: formData.valid_until || null, // Allow null dates
        assigned_to_email: formData.assigned_to_email || null, // <--- SAVING THE LINK
        active: formData.active
    };

    const { error } = await supabase.from('coupons').insert(payload);
    
    if (error) {
        toast.error("Error creating coupon", { description: error.message });
    } else {
        toast.success("Coupon Created");
        setShowForm(false);
        setFormData({ code: "", discount_type: "flat", value: "", min_order_value: "0", valid_until: "", assigned_to_email: "", active: true });
        fetchCoupons();
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
      await supabase.from('coupons').update({ active: !currentStatus }).eq('id', id);
      fetchCoupons();
  };

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
                        <label className="text-xs text-brand-silver font-bold uppercase block mb-2">Coupon Code</label>
                        <input required className="w-full bg-black/40 border border-white/10 p-3 rounded text-white font-bold tracking-widest uppercase focus:border-brand-purple outline-none" 
                            placeholder="E.g. SUMMER50" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-brand-silver font-bold uppercase block mb-2">Discount Type</label>
                        <select className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none"
                            value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                            <option value="flat">Flat Amount (₹)</option>
                            <option value="percent">Percentage (%)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-brand-silver font-bold uppercase block mb-2">Value</label>
                        <input required type="number" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:border-brand-purple outline-none" 
                            placeholder="500" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                    </div>
                    
                    <div>
                         <label className="text-xs text-brand-silver font-bold uppercase block mb-2">Assign to Creator (Optional)</label>
                         <input type="email" className="w-full bg-brand-purple/10 border border-brand-purple/30 p-3 rounded text-brand-purple placeholder-brand-purple/30 focus:border-brand-purple outline-none" 
                            placeholder="influencer@gmail.com" value={formData.assigned_to_email} onChange={e => setFormData({...formData, assigned_to_email: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-xs text-brand-silver font-bold uppercase block mb-2">Valid Until (Optional)</label>
                        <input type="date" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none" 
                            value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
                    </div>
                    
                    <div className="flex items-end">
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
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-bold font-orbitron text-lg">{coupon.code}</td>
                            <td className="p-4 text-brand-purple font-bold">
                                {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                            </td>
                            <td className="p-4">
                                <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold">{coupon.usage_count} Uses</span>
                            </td>
                            <td className="p-4">
                                {coupon.assigned_to_email ? (
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <FaUserTag /> {coupon.assigned_to_email}
                                    </div>
                                ) : (
                                    <span className="text-white/20">-</span>
                                )}
                            </td>
                            <td className="p-4">
                                <button onClick={() => toggleStatus(coupon.id, coupon.active)} className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${coupon.active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                                    {coupon.active ? "Active" : "Inactive"}
                                </button>
                            </td>
                            <td className="p-4 text-right">
                                <button onClick={() => toggleStatus(coupon.id, true)} className="text-white/20 hover:text-red-500"><FaTrash /></button>
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
    </div>
  );
}