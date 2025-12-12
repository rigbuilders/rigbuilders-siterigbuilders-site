"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// Base Options (Will be extended dynamically)
const BASE_CATEGORIES = [
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

const BASE_SOCKETS = ["AM5", "AM4", "LGA1700", "LGA1200"];
const BASE_MEMORY_TYPES = ["DDR5", "DDR4", "GDDR6", "GDDR6X"];
const STORAGE_TYPES = ["NVMe M.2", "SATA SSD", "HDD"];
const FORM_FACTORS = ["ATX", "mATX", "E-ATX", "ITX"];

export default function ProductManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");
  const router = useRouter();

  // Dynamic Options State
  const [existingBrands, setExistingBrands] = useState<string[]>([]);
  const [existingSockets, setExistingSockets] = useState<string[]>(BASE_SOCKETS);
  
  // Custom Input Toggles
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomSocket, setIsCustomSocket] = useState(false);
  const [isCustomMemory, setIsCustomMemory] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    category: "cpu",
    brand: "",
    image_url: "",
    in_stock: true,
    description: "",
    features_text: "",
    gallery_text: "",
    // SPECS
    socket: "",
    memory_type: "",
    wattage: "", 
    capacity: "", 
    form_factor: "",
    speed: "",
    storage_type: "" // New for Storage
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
    
    if (data) {
        setProducts(data);
        
        // Extract Unique Brands & Sockets for Dropdowns
        const brands = Array.from(new Set(data.map(p => p.brand).filter(Boolean)));
        setExistingBrands(brands.sort());

        const sockets = Array.from(new Set(data.map(p => p.specs?.socket).filter(Boolean)));
        setExistingSockets(Array.from(new Set([...BASE_SOCKETS, ...sockets])));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const specs: any = {};
      
      // Common
      if (formData.category !== 'os' && formData.wattage) specs.wattage = parseInt(formData.wattage);
      
      // CPU
      if (formData.category === 'cpu') {
          specs.socket = formData.socket;
      }
      // Motherboard
      if (formData.category === 'motherboard') { 
          specs.socket = formData.socket; 
          specs.memory_type = formData.memory_type; 
          specs.form_factor = formData.form_factor; 
      }
      // RAM
      if (formData.category === 'ram') { 
          specs.memory_type = formData.memory_type; 
          specs.capacity = formData.capacity; 
      }
      // GPU (Added Memory Type)
      if (formData.category === 'gpu') {
          specs.vram = formData.capacity;
          specs.memory_type = formData.memory_type; // e.g. GDDR6X
      }
      // Storage (Added Type)
      if (formData.category === 'storage') {
          specs.capacity = formData.capacity;
          specs.storage_type = formData.storage_type; // NVMe, SSD, HDD
      }

      const featuresArray = formData.features_text.split('\n').filter(line => line.trim() !== "");
      const galleryArray = formData.gallery_text.split(',').map(url => url.trim()).filter(url => url !== "");

      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        brand: formData.brand,
        image_url: formData.image_url,
        in_stock: formData.in_stock,
        specs: specs,
        description: formData.description,
        features: featuresArray,
        gallery_urls: galleryArray
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
    
    // Check if values are custom
    setIsCustomBrand(!existingBrands.includes(product.brand));
    setIsCustomSocket(s.socket && !BASE_SOCKETS.includes(s.socket) && !existingSockets.includes(s.socket));
    
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      brand: product.brand,
      image_url: product.image_url || "",
      in_stock: product.in_stock ?? true,
      description: product.description || "",
      features_text: (product.features || []).join('\n'),
      gallery_text: (product.gallery_urls || []).join(', '),
      socket: s.socket || "",
      memory_type: s.memory_type || "",
      wattage: s.wattage ? s.wattage.toString() : "",
      capacity: s.capacity || s.vram || "",
      form_factor: s.form_factor || "",
      speed: s.speed || "",
      storage_type: s.storage_type || ""
    });
    setActiveTab("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      id: "", name: "", price: "", category: "cpu", brand: "", image_url: "", in_stock: true,
      description: "", features_text: "", gallery_text: "",
      socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: "", storage_type: ""
    });
    setIsCustomBrand(false);
    setIsCustomSocket(false);
    setIsCustomMemory(false);
    setActiveTab("add");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-7xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-8 text-brand-purple">ADMIN DASHBOARD</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: FORM */}
            <div className="lg:col-span-1">
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 sticky top-28">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h2 className="font-bold text-xl">{activeTab === "edit" ? "Edit Product" : "Add Product"}</h2>
                        <button onClick={resetForm} className="text-xs text-brand-purple hover:underline">Reset</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                        {/* BASIC INFO */}
                        <input required placeholder="Product Name" className="w-full bg-[#121212] p-2 rounded border border-white/10" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input required type="number" placeholder="Price (₹)" className="w-full bg-[#121212] p-2 rounded border border-white/10" 
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                            
                            {/* DYNAMIC BRAND SELECTOR */}
                            {isCustomBrand ? (
                                <div className="relative">
                                    <input placeholder="Type New Brand" className="w-full bg-[#121212] p-2 rounded border border-brand-purple" 
                                        value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} autoFocus />
                                    <button type="button" onClick={() => setIsCustomBrand(false)} className="absolute right-2 top-2 text-[10px] text-red-400">Cancel</button>
                                </div>
                            ) : (
                                <select className="w-full bg-[#121212] p-2 rounded border border-white/10"
                                    value={formData.brand} onChange={e => {
                                        if(e.target.value === "NEW") setIsCustomBrand(true);
                                        else setFormData({...formData, brand: e.target.value});
                                    }}>
                                    <option value="">Select Brand</option>
                                    {existingBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                    <option value="NEW" className="text-brand-purple">+ Add New Brand</option>
                                </select>
                            )}
                        </div>

                        <select className="w-full bg-[#121212] p-2 rounded border border-white/10"
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            {BASE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        {/* IMAGE INPUT HELPER */}
                        <div>
                            <input placeholder="Image Path (e.g. /images/cpu.png)" className="w-full bg-[#121212] p-2 rounded border border-white/10 text-xs" 
                                value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                            <p className="text-[9px] text-brand-silver mt-1 ml-1">Put files in `public` folder. Use `/` relative paths.</p>
                        </div>

                        {/* EXTENDED DETAILS */}
                        <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                            <label className="text-xs text-brand-purple uppercase font-bold block">Page Details</label>
                            <textarea placeholder="Description" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-20"
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            <textarea placeholder="Features (One per line)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-20"
                                value={formData.features_text} onChange={e => setFormData({...formData, features_text: e.target.value})} />
                            <input placeholder="Gallery (e.g. /img1.png, /img2.png)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                value={formData.gallery_text} onChange={e => setFormData({...formData, gallery_text: e.target.value})} />
                        </div>

                        {/* DYNAMIC SPECS */}
                        <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                            <label className="text-xs text-brand-purple uppercase font-bold block">Tech Specs ({formData.category})</label>
                            
                            {/* Common Power */}
                            {formData.category !== 'os' && <input type="number" placeholder="Watts (e.g. 65)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.wattage} onChange={e => setFormData({...formData, wattage: e.target.value})} />}
                            
                            {/* SOCKET: CPU & Motherboard */}
                            {(formData.category === 'cpu' || formData.category === 'motherboard') && (
                                isCustomSocket ? (
                                    <div className="flex gap-2">
                                        <input placeholder="Type Socket (e.g. LGA1851)" className="w-full bg-[#1A1A1A] p-2 rounded border border-brand-purple text-xs"
                                            value={formData.socket} onChange={e => setFormData({...formData, socket: e.target.value})} />
                                        <button type="button" onClick={() => setIsCustomSocket(false)} className="text-red-400 text-xs">X</button>
                                    </div>
                                ) : (
                                    <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                        value={formData.socket} onChange={e => {
                                            if(e.target.value === "NEW") setIsCustomSocket(true);
                                            else setFormData({...formData, socket: e.target.value});
                                        }}>
                                        <option value="">Select Socket</option>
                                        {existingSockets.map(s => <option key={s} value={s}>{s}</option>)}
                                        <option value="NEW" className="text-brand-purple">+ Add New Socket</option>
                                    </select>
                                )
                            )}

                            {/* MEMORY TYPE: RAM, Mobo, GPU */}
                            {(formData.category === 'ram' || formData.category === 'motherboard' || formData.category === 'gpu') && (
                                isCustomMemory ? (
                                    <div className="flex gap-2">
                                        <input placeholder="Type DDR (e.g. GDDR7)" className="w-full bg-[#1A1A1A] p-2 rounded border border-brand-purple text-xs"
                                            value={formData.memory_type} onChange={e => setFormData({...formData, memory_type: e.target.value})} />
                                        <button type="button" onClick={() => setIsCustomMemory(false)} className="text-red-400 text-xs">X</button>
                                    </div>
                                ) : (
                                    <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                        value={formData.memory_type} onChange={e => {
                                            if(e.target.value === "NEW") setIsCustomMemory(true);
                                            else setFormData({...formData, memory_type: e.target.value});
                                        }}>
                                        <option value="">Select Memory Type</option>
                                        {BASE_MEMORY_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                                        <option value="NEW" className="text-brand-purple">+ Add New Type</option>
                                    </select>
                                )
                            )}

                            {/* STORAGE TYPE */}
                            {formData.category === 'storage' && (
                                <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.storage_type} onChange={e => setFormData({...formData, storage_type: e.target.value})}>
                                    <option value="">Select Storage Type</option>
                                    {STORAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}

                            {/* FORM FACTOR */}
                            {(formData.category === 'motherboard' || formData.category === 'cabinet') && (
                                <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.form_factor} onChange={e => setFormData({...formData, form_factor: e.target.value})}>
                                    <option value="">Select Form Factor</option>
                                    {FORM_FACTORS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            )}

                            {/* CAPACITY (RAM, GPU VRAM, STORAGE) */}
                            {(formData.category === 'ram' || formData.category === 'gpu' || formData.category === 'storage') && (
                                <input placeholder={formData.category === 'gpu' ? "VRAM (e.g. 16GB)" : "Capacity (e.g. 1TB)"} 
                                    className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                    value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                            )}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                            <input type="checkbox" className="w-4 h-4 accent-brand-purple" checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} />
                            <span className="text-sm text-brand-silver">Available in Stock</span>
                        </label>

                        <button disabled={loading} className="w-full bg-brand-purple py-3 rounded font-bold hover:bg-white hover:text-black transition-all">
                            {loading ? "Processing..." : activeTab === "edit" ? "Update" : "Create"}
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: LIST */}
            <div className="lg:col-span-2 space-y-3">
                {products.map((p) => (
                    <div key={p.id} className="bg-[#1A1A1A] p-4 rounded border border-white/5 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black/50 rounded flex items-center justify-center text-[10px] text-[#A0A0A0] uppercase font-bold border border-white/5">{p.category.substring(0,2)}</div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{p.name}</h3>
                                <div className="text-xs text-[#A0A0A0] flex gap-2">
                                    <span className="text-brand-purple">{p.brand}</span>
                                    <span>•</span>
                                    <span>₹{p.price}</span>
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