"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash, FaHome, FaBriefcase, FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";

// Constants for Dropdowns
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    full_name: "", phone: "", address_line1: "", address_line2: "", 
    city: "", state: "", pincode: "", label: "Home", is_default: false
  });

  // 1. Fetch Addresses
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        router.push("/signin");
        return;
    }

    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false }); // Default first

    setAddresses(data || []);
    setLoading(false);
  };

  // 2. Handle Add Address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    // If setting as default, unset others first
    if (formData.is_default) {
        await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);
    }

    const { error } = await supabase.from('user_addresses').insert({
        ...formData,
        user_id: user.id
    });

    if (error) {
        alert("Error saving address: " + error.message);
    } else {
        setShowForm(false);
        fetchAddresses();
        // Reset Form
        setFormData({
            full_name: "", phone: "", address_line1: "", address_line2: "", 
            city: "", state: "", pincode: "", label: "Home", is_default: false
        });
    }
  };

  // 3. Delete Address
  const handleDelete = async (id: string) => {
    if(!confirm("Delete this address?")) return;
    await supabase.from('user_addresses').delete().eq('id', id);
    fetchAddresses();
  };

  // 4. Set Default
  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    // Reset all to false
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id);
    // Set selected to true
    await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
    
    fetchAddresses();
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      <div className="pt-32 pb-12 px-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="font-orbitron text-3xl font-bold text-brand-purple">ADDRESS BOOK</h1>
            <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-white text-black px-4 py-2 font-bold uppercase text-xs flex items-center gap-2 hover:bg-brand-purple hover:text-white transition-all"
            >
                <FaPlus /> {showForm ? "Cancel" : "Add New Address"}
            </button>
        </div>

        {/* --- ADD ADDRESS FORM --- */}
        {showForm && (
            <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-white/10 p-6 rounded-xl mb-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input required placeholder="Full Name" className="bg-black/30 border border-white/10 p-3 rounded text-sm text-white focus:border-brand-purple outline-none" 
                        value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    
                    <input required placeholder="Phone Number" className="bg-black/30 border border-white/10 p-3 rounded text-sm text-white focus:border-brand-purple outline-none" 
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>

                <div className="mb-4">
                    <input required placeholder="Address Line 1 (House No, Building)" className="w-full bg-black/30 border border-white/10 p-3 rounded text-sm text-white focus:border-brand-purple outline-none mb-2" 
                        value={formData.address_line1} onChange={e => setFormData({...formData, address_line1: e.target.value})} />
                    
                    <input placeholder="Address Line 2 (Road, Area, Landmark)" className="w-full bg-black/30 border border-white/10 p-3 rounded text-sm text-white focus:border-brand-purple outline-none" 
                        value={formData.address_line2} onChange={e => setFormData({...formData, address_line2: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <input required placeholder="City" className="bg-black/30 border border-white/10 p-3 rounded text-sm text-white focus:border-brand-purple outline-none" 
                        value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    
                    <select required className="bg-black/30 border border-white/10 p-3 rounded text-sm text-white focus:border-brand-purple outline-none"
                        value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <input required placeholder="Pincode" maxLength={6} className="bg-black/30 border border-white/10 p-3 rounded text-sm text-white focus:border-brand-purple outline-none" 
                        value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div className="flex items-center gap-4">
                        <select className="bg-black/30 border border-white/10 p-2 rounded text-xs text-white"
                            value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})}>
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                        </select>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} />
                            <span className="text-xs text-brand-silver">Make Default</span>
                        </label>
                    </div>
                    <button type="submit" className="bg-brand-purple text-white px-6 py-2 rounded font-bold uppercase text-xs hover:bg-white hover:text-black transition-all">
                        Save Address
                    </button>
                </div>
            </form>
        )}

        {/* --- ADDRESS LIST --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
                <div key={addr.id} className={`relative p-6 rounded-xl border transition-all ${addr.is_default ? "bg-brand-purple/10 border-brand-purple shadow-[0_0_15px_rgba(78,44,139,0.2)]" : "bg-[#1A1A1A] border-white/5 hover:border-white/20"}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            {addr.label === "Home" && <FaHome className="text-brand-silver" />}
                            {addr.label === "Work" && <FaBriefcase className="text-brand-silver" />}
                            {addr.label === "Other" && <FaMapMarkerAlt className="text-brand-silver" />}
                            <span className="font-bold text-sm uppercase tracking-wider">{addr.label}</span>
                            {addr.is_default && <span className="text-[9px] bg-brand-purple text-white px-2 py-0.5 rounded uppercase font-bold">Default</span>}
                        </div>
                        <div className="flex gap-3">
                            {!addr.is_default && (
                                <button onClick={() => handleSetDefault(addr.id)} title="Set as Default" className="text-brand-silver hover:text-white text-xs">Set Default</button>
                            )}
                            <button onClick={() => handleDelete(addr.id)} className="text-red-500 hover:text-red-400"><FaTrash size={12} /></button>
                        </div>
                    </div>

                    <h3 className="font-bold text-lg text-white mb-1">{addr.full_name}</h3>
                    <p className="text-brand-silver text-sm mb-4">{addr.phone}</p>
                    
                    <div className="text-white/70 text-sm leading-relaxed">
                        <p>{addr.address_line1}</p>
                        {addr.address_line2 && <p>{addr.address_line2}</p>}
                        <p>{addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span></p>
                    </div>

                </div>
            ))}
        </div>
        
        {addresses.length === 0 && !showForm && (
            <div className="text-center py-20 text-brand-silver opacity-50 border border-dashed border-white/10 rounded-xl">
                No addresses saved. Add one to speed up checkout.
            </div>
        )}

      </div>
    </div>
  );
}