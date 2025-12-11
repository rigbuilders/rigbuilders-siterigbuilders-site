"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { id: "cpu", name: "Processor" },
  { id: "gpu", name: "Graphics Card" },
  { id: "motherboard", name: "Motherboard" },
  { id: "ram", name: "Memory (RAM)" },
  { id: "storage", name: "Storage" },
  { id: "psu", name: "Power Supply" },
  { id: "cabinet", name: "Cabinet" },
  { id: "cooler", name: "Cooling" },
  { id: "os", name: "Operating System" }
];

// Pre-defined options to ensure consistency (so "AM5" matches "AM5", not "am5 " or "Am5")
const SOCKETS = ["AM5", "AM4", "LGA1700", "LGA1200", "TR4"];
const MEMORY_TYPES = ["DDR5", "DDR4"];
const FORM_FACTORS = ["ATX", "mATX", "E-ATX", "ITX"];

export default function ProductManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    category: "cpu",
    brand: "",
    image_url: "",
    in_stock: true,
    // STRUCTURED SPECS
    socket: "",
    memory_type: "",
    wattage: "", // Power consumption
    capacity: "", // GB
    form_factor: "",
    speed: "" // MHz
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const ADMIN_EMAIL = "rigbuilders123@gmail.com"; 

      if (!user || user.email !== ADMIN_EMAIL) {
        alert("Access Denied.");
        router.push("/");
        return;
      }
      setIsAdmin(true);
      fetchProducts();
    };
    init();
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construct the 'specs' JSON object based on category
      const specs: any = {};
      
      // Common Power Field (except OS)
      if (formData.category !== 'os' && formData.wattage) specs.wattage = parseInt(formData.wattage);

      // Specific Fields
      if (formData.category === 'cpu') {
        specs.socket = formData.socket;
      }
      if (formData.category === 'motherboard') {
        specs.socket = formData.socket;
        specs.memory_type = formData.memory_type;
        specs.form_factor = formData.form_factor;
      }
      if (formData.category === 'ram') {
        specs.memory_type = formData.memory_type;
        specs.capacity = formData.capacity; // e.g. "32GB"
      }
      if (formData.category === 'gpu') {
        specs.vram = formData.capacity; // Using capacity field for VRAM
      }
      if (formData.category === 'storage') {
        specs.capacity = formData.capacity;
      }

      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        brand: formData.brand,
        image_url: formData.image_url,
        in_stock: formData.in_stock,
        specs: specs 
      };

      if (activeTab === "edit" && formData.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }

      alert(activeTab === "edit" ? "Product Updated" : "Product Created");
      resetForm();
      fetchProducts();

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: any) => {
    const s = product.specs || {};
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      brand: product.brand,
      image_url: product.image_url || "",
      in_stock: product.in_stock ?? true,
      // Load Specs
      socket: s.socket || "",
      memory_type: s.memory_type || "",
      wattage: s.wattage ? s.wattage.toString() : "",
      capacity: s.capacity || s.vram || "",
      form_factor: s.form_factor || "",
      speed: s.speed || ""
    });
    setActiveTab("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      id: "", name: "", price: "", category: "cpu", brand: "", image_url: "",
      in_stock: true, socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: ""
    });
    setActiveTab("add");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-7xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-8 text-brand-purple">ADMIN DASHBOARD</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 sticky top-28">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h2 className="font-bold text-xl">{activeTab === "edit" ? "Edit Product" : "Add Product"}</h2>
                        <button onClick={resetForm} className="text-xs text-brand-purple hover:underline">Reset</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input required placeholder="Product Name" className="w-full bg-[#121212] p-2 rounded border border-white/10" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input required type="number" placeholder="Price (₹)" className="w-full bg-[#121212] p-2 rounded border border-white/10" 
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                            <input required placeholder="Brand" className="w-full bg-[#121212] p-2 rounded border border-white/10" 
                                value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                        </div>

                        <select className="w-full bg-[#121212] p-2 rounded border border-white/10"
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <input placeholder="Image URL" className="w-full bg-[#121212] p-2 rounded border border-white/10 text-xs" 
                            value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />

                        {/* --- DYNAMIC SPECS SECTION --- */}
                        <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                            <label className="text-xs text-brand-purple uppercase font-bold block">Tech Specs</label>
                            
                            {/* WATTAGE (For most items) */}
                            {formData.category !== 'os' && (
                                <input type="number" placeholder="Power Consumption (Watts)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.wattage} onChange={e => setFormData({...formData, wattage: e.target.value})} />
                            )}

                            {/* SOCKET (CPU & MOBO) */}
                            {(formData.category === 'cpu' || formData.category === 'motherboard') && (
                                <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.socket} onChange={e => setFormData({...formData, socket: e.target.value})}>
                                    <option value="">Select Socket</option>
                                    {SOCKETS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}

                            {/* MEMORY TYPE (RAM & MOBO) */}
                            {(formData.category === 'ram' || formData.category === 'motherboard') && (
                                <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.memory_type} onChange={e => setFormData({...formData, memory_type: e.target.value})}>
                                    <option value="">Select DDR Type</option>
                                    {MEMORY_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            )}

                            {/* FORM FACTOR (MOBO & CASE) */}
                            {(formData.category === 'motherboard' || formData.category === 'cabinet') && (
                                <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.form_factor} onChange={e => setFormData({...formData, form_factor: e.target.value})}>
                                    <option value="">Select Form Factor</option>
                                    {FORM_FACTORS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            )}

                            {/* CAPACITY (RAM, GPU VRAM, STORAGE) */}
                            {(formData.category === 'ram' || formData.category === 'gpu' || formData.category === 'storage') && (
                                <input placeholder={formData.category === 'gpu' ? "VRAM (e.g. 16GB)" : "Capacity (e.g. 1TB)"} className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                            )}
                        </div>

                        {/* Stock Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                            <input type="checkbox" className="w-4 h-4 accent-brand-purple"
                                checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} />
                            <span className="text-sm text-brand-silver">Available in Stock</span>
                        </label>

                        <button disabled={loading} className="w-full bg-brand-purple py-3 rounded font-bold hover:bg-white hover:text-black transition-all">
                            {loading ? "Processing..." : activeTab === "edit" ? "Update Product" : "Create Product"}
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: LIST */}
            <div className="lg:col-span-2 space-y-3">
                {products.map((p) => (
                    <div key={p.id} className="bg-[#1A1A1A] p-4 rounded border border-white/5 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black/50 rounded flex items-center justify-center text-[10px] text-[#A0A0A0] uppercase font-bold border border-white/5">
                                {p.category.substring(0,2)}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{p.name}</h3>
                                <div className="text-xs text-[#A0A0A0] flex gap-2">
                                    <span>₹{p.price}</span>
                                    {p.specs?.socket && <span className="text-brand-purple">[{p.specs.socket}]</span>}
                                    {p.specs?.wattage && <span>{p.specs.wattage}W</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditClick(p)} className="px-3 py-1 bg-white/5 hover:bg-white hover:text-black rounded text-[10px] font-bold uppercase">Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded text-[10px] font-bold uppercase">Del</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}