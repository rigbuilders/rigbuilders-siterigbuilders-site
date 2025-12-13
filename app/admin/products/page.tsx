"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// --- CONSTANTS ---
// These are the defaults. The system will learn new ones from your database.
const BASE_CATEGORIES = [
  { id: "prebuilt", name: "Pre-built Desktop" },
  { id: "cpu", name: "Processor" },
  { id: "gpu", name: "Graphics Card" },
  { id: "motherboard", name: "Motherboard" },
  { id: "ram", name: "Memory (RAM)" },
  { id: "storage", name: "Storage" },
  { id: "psu", name: "Power Supply" },
  { id: "cabinet", name: "Cabinet" },
  { id: "cooler", name: "Cooling" },
  { id: "os", name: "Operating System" },
  // Accessories
  { id: "monitor", name: "Display / Monitor" },
  { id: "keyboard", name: "Keyboard" },
  { id: "mouse", name: "Mouse" },
  { id: "combo", name: "Keyboard & Mouse Combo" },
  { id: "mousepad", name: "Mouse Pad" },
  { id: "usb", name: "USB Drive" }
];

const SERIES_OPTS = ["ascend", "workpro", "creator", "signature"];
const TIER_OPTS = ["5", "7", "9"];

const BASE_SOCKETS = ["AM5", "AM4", "LGA1700", "LGA1851", "LGA1200", "TR4"];
const BASE_MEMORY_TYPES = ["DDR5", "DDR4", "GDDR6", "GDDR6X", "GDDR7"];
const STORAGE_TYPES = ["NVMe M.2 Gen4", "NVMe M.2 Gen3", "SATA SSD", "HDD (7200RPM)"];
const FORM_FACTORS = ["ATX", "mATX", "E-ATX", "ITX"];

export default function ProductManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");
  const router = useRouter();

  // --- DYNAMIC DATA STATE ---
  const [existingBrands, setExistingBrands] = useState<string[]>([]);
  const [existingCategories, setExistingCategories] = useState<any[]>(BASE_CATEGORIES);
  const [existingSockets, setExistingSockets] = useState<string[]>(BASE_SOCKETS);
  const [existingMemory, setExistingMemory] = useState<string[]>(BASE_MEMORY_TYPES);

  // --- CUSTOM INPUT TOGGLES ---
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomSocket, setIsCustomSocket] = useState(false);
  const [isCustomMemory, setIsCustomMemory] = useState(false);

  const [formData, setFormData] = useState({
    id: "", name: "", price: "", category: "cpu", series: "", tier: "", brand: "", 
    image_url: "", in_stock: true, description: "", features_text: "", gallery_text: "",
    // SPECS
    socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: "", storage_type: "",
    // RECIPE (Pre-builts)
    recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
    recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // UPDATE THIS TO YOUR EMAIL
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
        setInventory(data);
        
        // LEARN FROM DB: Extract unique Brands, Sockets, Memory, AND Categories
        const brands = Array.from(new Set(data.map(p => p.brand).filter(Boolean)));
        setExistingBrands(brands.sort());

        const sockets = Array.from(new Set(data.map(p => p.specs?.socket).filter(Boolean)));
        setExistingSockets(Array.from(new Set([...BASE_SOCKETS, ...sockets])));

        const mems = Array.from(new Set(data.map(p => p.specs?.memory_type).filter(Boolean)));
        setExistingMemory(Array.from(new Set([...BASE_MEMORY_TYPES, ...mems])));

        // Merge Base Categories with any new ones found in DB
        const dbCats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        const allCats = [...BASE_CATEGORIES];
        dbCats.forEach(c => {
            if (!allCats.find(base => base.id === c)) {
                allCats.push({ id: c, name: c.charAt(0).toUpperCase() + c.slice(1) }); // Capitalize display name
            }
        });
        setExistingCategories(allCats);
    }
    setLoading(false);
  };

  const getOptionsFor = (cat: string) => inventory.filter(p => p.category === cat);

  // --- AUTO-FIX IMAGE PATHS ---
  const cleanPath = (path: string) => {
    if (!path) return "";
    let clean = path.replace(/\\/g, "/"); // Convert backslashes
    clean = clean.replace(/^\/?public\/?/i, ""); // Remove 'public' prefix
    clean = clean.replace(/^"|"$/g, ""); // Remove quotes
    if (!clean.startsWith("/")) clean = "/" + clean; // Ensure leading slash
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const specs: any = {};
      
      if (formData.category === 'prebuilt') {
         specs["Processor"] = formData.recipe_cpu;
         specs["Graphics Card"] = formData.recipe_gpu;
         specs["Motherboard"] = formData.recipe_mobo;
         specs["Memory"] = formData.recipe_ram;
         specs["Storage"] = formData.recipe_storage;
         specs["Power Supply"] = formData.recipe_psu;
         specs["Cooling"] = formData.recipe_cooler;
         specs["Cabinet"] = formData.recipe_cabinet;
         specs["OS"] = formData.recipe_os;
      } else {
         if (formData.category !== 'os' && formData.wattage) specs.wattage = parseInt(formData.wattage);
         
         // CPU
         if (formData.category === 'cpu') {
             specs.socket = formData.socket;
         }
         // GPU (Added Memory Type)
         if (formData.category === 'gpu') {
             specs.vram = formData.capacity;
             specs.memory_type = formData.memory_type; 
         }
         // Motherboard (Addable Socket/DDR)
         if (formData.category === 'motherboard') { 
             specs.socket = formData.socket; 
             specs.memory_type = formData.memory_type; 
             specs.form_factor = formData.form_factor; 
         }
         // RAM (Addable DDR)
         if (formData.category === 'ram') { 
             specs.memory_type = formData.memory_type; 
             specs.capacity = formData.capacity; 
         }
         // Storage (Added Type)
         if (formData.category === 'storage') { 
             specs.capacity = formData.capacity; 
             specs.storage_type = formData.storage_type; 
         }
      }

      // Process Images with Auto-Fix
      const finalMainImage = cleanPath(formData.image_url);
      const galleryArray = formData.gallery_text.split(',').map(url => cleanPath(url.trim())).filter(url => url !== "" && url !== "/");
      const featuresArray = formData.features_text.split('\n').filter(line => line.trim() !== "");

      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category, // Saves whatever string is in here (Custom or Select)
        series: formData.series || null,
        tier: formData.tier ? parseInt(formData.tier) : null,
        brand: formData.brand,
        image_url: finalMainImage,
        in_stock: formData.in_stock,
        specs: specs,
        description: formData.description,
        features: featuresArray,
        gallery_urls: galleryArray
      };

      if (activeTab === "edit" && formData.id) {
        await supabase.from('products').update(payload).eq('id', formData.id);
      } else {
        await supabase.from('products').insert(payload);
      }

      alert(activeTab === "edit" ? "Updated!" : "Created!");
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
    
    // Check if values are custom (not in base lists)
    const isBaseCat = BASE_CATEGORIES.some(c => c.id === product.category);
    setIsCustomCategory(!isBaseCat);

    setIsCustomBrand(!existingBrands.includes(product.brand));
    setIsCustomSocket(s.socket && !BASE_SOCKETS.includes(s.socket) && !existingSockets.includes(s.socket));
    setIsCustomMemory(s.memory_type && !BASE_MEMORY_TYPES.includes(s.memory_type) && !existingMemory.includes(s.memory_type));

    setFormData({
      id: product.id, name: product.name, price: product.price.toString(), category: product.category,
      series: product.series || "", tier: product.tier ? product.tier.toString() : "",
      brand: product.brand, image_url: product.image_url || "", in_stock: product.in_stock ?? true,
      description: product.description || "",
      features_text: (product.features || []).join('\n'),
      gallery_text: (product.gallery_urls || []).join(', '),
      
      socket: s.socket || "", memory_type: s.memory_type || "", wattage: s.wattage ? s.wattage.toString() : "",
      capacity: s.capacity || s.vram || "", form_factor: s.form_factor || "", speed: s.speed || "", storage_type: s.storage_type || "",
      
      recipe_cpu: s["Processor"] || "", recipe_gpu: s["Graphics Card"] || "", recipe_mobo: s["Motherboard"] || "",
      recipe_ram: s["Memory"] || "", recipe_storage: s["Storage"] || "", recipe_psu: s["Power Supply"] || "",
      recipe_cooler: s["Cooling"] || "", recipe_cabinet: s["Cabinet"] || "", recipe_os: s["OS"] || ""
    });
    setActiveTab("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete product?")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      id: "", name: "", price: "", category: "cpu", series: "", tier: "", brand: "", image_url: "", in_stock: true,
      description: "", features_text: "", gallery_text: "",
      socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: "", storage_type: "",
      recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
      recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
    });
    setIsCustomCategory(false);
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
                        <h2 className="font-bold text-xl">{activeTab === "edit" ? "Edit" : "Add"} Product</h2>
                        <button onClick={resetForm} className="text-xs text-brand-purple hover:underline">Reset</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                        
                        {/* CATEGORY & NAME */}
                        {isCustomCategory ? (
                            <div className="relative mb-2">
                                <input 
                                    placeholder="New Category ID (e.g. headphones)" 
                                    className="w-full bg-[#121212] p-2 rounded border border-brand-purple text-white font-bold"
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value.toLowerCase()})} 
                                    autoFocus 
                                />
                                <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-2 top-2 text-[10px] text-red-400 font-bold">CANCEL</button>
                                <p className="text-[9px] text-brand-silver mt-1">Use lowercase, no spaces (e.g. &apos;gaming-chair&apos;)</p>
                            </div>
                        ) : (
                            <select className="w-full bg-[#121212] p-2 rounded border border-white/10 text-brand-purple font-bold"
                                value={formData.category} 
                                onChange={e => {
                                    if(e.target.value === "NEW") {
                                        setIsCustomCategory(true);
                                        setFormData({...formData, category: ""});
                                    } else {
                                        setFormData({...formData, category: e.target.value});
                                    }
                                }}>
                                {existingCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                <option value="NEW" className="text-white font-bold bg-brand-purple">+ Add New Category</option>
                            </select>
                        )}

                        <input required placeholder="Product Name" className="w-full bg-[#121212] p-2 rounded border border-white/10" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        
                        {/* PRE-BUILT SERIES SELECTOR */}
                        {formData.category === 'prebuilt' && (
                            <div className="grid grid-cols-2 gap-4 bg-brand-purple/10 p-2 rounded border border-brand-purple/30">
                                <select className="bg-transparent text-xs outline-none" value={formData.series} onChange={e => setFormData({...formData, series: e.target.value})}>
                                    <option value="">Select Series</option>
                                    {SERIES_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                {formData.series !== 'signature' && (
                                    <select className="bg-transparent text-xs outline-none" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})}>
                                        <option value="">Select Tier</option>
                                        {TIER_OPTS.map(t => <option key={t} value={t}>Level {t}</option>)}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* PRICE & BRAND */}
                        <div className="grid grid-cols-2 gap-4">
                            <input required type="number" placeholder="Price (₹)" className="w-full bg-[#121212] p-2 rounded border border-white/10" 
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                            
                            {isCustomBrand ? (
                                <div className="relative">
                                    <input placeholder="New Brand Name" className="w-full bg-[#121212] p-2 rounded border border-brand-purple" 
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
                                    <option value="NEW" className="text-brand-purple font-bold">+ Add New</option>
                                </select>
                            )}
                        </div>

                        {/* IMAGE */}
                        <div>
                            <input placeholder="Image Path (e.g. \public\images\pc.jpg)" className="w-full bg-[#121212] p-2 rounded border border-white/10 text-xs" 
                                value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                            <p className="text-[9px] text-brand-purple mt-1 ml-1">Paste full Windows path. We will auto-fix it.</p>
                        </div>

                        {/* DETAILS */}
                        <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                            <label className="text-xs text-brand-purple uppercase font-bold block">Page Details</label>
                            <textarea placeholder="Description" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-16"
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            <textarea placeholder="Features (One per line)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-16"
                                value={formData.features_text} onChange={e => setFormData({...formData, features_text: e.target.value})} />
                            <input placeholder="Gallery URLs (comma separated)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                value={formData.gallery_text} onChange={e => setFormData({...formData, gallery_text: e.target.value})} />
                        </div>

                        {/* SPECS / RECIPE */}
                        {formData.category === 'prebuilt' ? (
                            <div className="bg-[#121212] p-3 rounded border border-brand-purple/30 space-y-3">
                                <label className="text-xs text-brand-purple uppercase font-bold block">Build Recipe</label>
                                {[
                                    { label: "Processor", key: "recipe_cpu", cat: "cpu" },
                                    { label: "Graphics", key: "recipe_gpu", cat: "gpu" },
                                    { label: "Motherboard", key: "recipe_mobo", cat: "motherboard" },
                                    { label: "Memory", key: "recipe_ram", cat: "ram" },
                                    { label: "Storage", key: "recipe_storage", cat: "storage" },
                                    { label: "Power", key: "recipe_psu", cat: "psu" },
                                    { label: "Cooling", key: "recipe_cooler", cat: "cooler" },
                                    { label: "Cabinet", key: "recipe_cabinet", cat: "cabinet" },
                                ].map((field) => (
                                    <select key={field.key} className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                        value={(formData as any)[field.key]} onChange={e => setFormData({...formData, [field.key]: e.target.value})}>
                                        <option value="">Select {field.label}</option>
                                        {getOptionsFor(field.cat).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                                <label className="text-xs text-brand-purple uppercase font-bold block">Tech Specs</label>
                                {formData.category !== 'os' && <input type="number" placeholder="Watts" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.wattage} onChange={e => setFormData({...formData, wattage: e.target.value})} />}
                                
                                {(formData.category === 'cpu' || formData.category === 'motherboard') && (
                                    isCustomSocket ? (
                                        <div className="flex gap-2">
                                            <input placeholder="Type Socket" className="w-full bg-[#1A1A1A] p-2 rounded border border-brand-purple text-xs"
                                                value={formData.socket} onChange={e => setFormData({...formData, socket: e.target.value})} />
                                            <button type="button" onClick={() => setIsCustomSocket(false)} className="text-red-400 text-xs">X</button>
                                        </div>
                                    ) : (
                                        <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                            value={formData.socket} onChange={e => { if(e.target.value==="NEW") setIsCustomSocket(true); else setFormData({...formData, socket: e.target.value}); }}>
                                            <option value="">Select Socket</option>
                                            {existingSockets.map(s => <option key={s} value={s}>{s}</option>)}
                                            <option value="NEW" className="text-brand-purple">+ Add New</option>
                                        </select>
                                    )
                                )}

                                {(formData.category === 'ram' || formData.category === 'motherboard' || formData.category === 'gpu') && (
                                    isCustomMemory ? (
                                        <div className="flex gap-2">
                                            <input placeholder="Type DDR" className="w-full bg-[#1A1A1A] p-2 rounded border border-brand-purple text-xs"
                                                value={formData.memory_type} onChange={e => setFormData({...formData, memory_type: e.target.value})} />
                                            <button type="button" onClick={() => setIsCustomMemory(false)} className="text-red-400 text-xs">X</button>
                                        </div>
                                    ) : (
                                        <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                            value={formData.memory_type} onChange={e => { if(e.target.value==="NEW") setIsCustomMemory(true); else setFormData({...formData, memory_type: e.target.value}); }}>
                                            <option value="">Select Memory Type</option>
                                            {existingMemory.map(m => <option key={m} value={m}>{m}</option>)}
                                            <option value="NEW" className="text-brand-purple">+ Add New</option>
                                        </select>
                                    )
                                )}

                                {formData.category === 'storage' && (
                                    <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                        value={formData.storage_type} onChange={e => setFormData({...formData, storage_type: e.target.value})}>
                                        <option value="">Select Storage Type</option>
                                        {STORAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                )}

                                {(formData.category === 'ram' || formData.category === 'gpu' || formData.category === 'storage') && (
                                    <input placeholder="Capacity (e.g. 16GB)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                        value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                                )}
                            </div>
                        )}

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

            {/* LIST */}
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
                                    {p.series && <span className="text-brand-purple uppercase ml-2">[{p.series} {p.tier}]</span>}
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