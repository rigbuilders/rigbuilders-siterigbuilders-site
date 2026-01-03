"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaChevronDown, FaChevronRight, FaTrash, FaEdit, FaPlus, FaImage } from "react-icons/fa";

// --- CONSTANTS ---
const GROUPS = [
    { id: "components", name: "PC Components" },
    { id: "desktops", name: "Pre-Built Desktops" },
    { id: "accessories", name: "Accessories" }
];

// Mapping base categories to groups for auto-sorting existing data
const BASE_CATEGORY_MAP: Record<string, string> = {
    cpu: "components", gpu: "components", motherboard: "components", ram: "components",
    storage: "components", psu: "components", cabinet: "components", cooler: "components",
    os: "components",
    prebuilt: "desktops",
    monitor: "accessories", keyboard: "accessories", mouse: "accessories",
    combo: "accessories", mousepad: "accessories", usb: "accessories"
};

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

  // --- EXPANDED FORM DATA ---
  const [formData, setFormData] = useState({
    id: "", name: "", breadcrumb_name: "", price: "", 
    category: "cpu", 
    group: "components", // NEW: Track parent group
    series: "", tier: "", brand: "", 
    image_url: "", in_stock: true, description: "", features_text: "",
    gallery_urls: [] as string[], // CHANGED: Array for multiple images
    
    // SPECS
    socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: "", storage_type: "",
    length_mm: "", max_gpu_length_mm: "",
    // RECIPE
    recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
    recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
  });
    
  // --- LIST VIEW STATE (Expanded Sections) ---
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ components: true, desktops: true, accessories: true });
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

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
        setInventory(data);
        
        // Extract unique data for dropdowns
        const brands = Array.from(new Set(data.map(p => p.brand).filter(Boolean)));
        setExistingBrands(brands.sort());

        const sockets = Array.from(new Set(data.map(p => p.specs?.socket).filter(Boolean)));
        setExistingSockets(Array.from(new Set([...BASE_SOCKETS, ...sockets])));

        const mems = Array.from(new Set(data.map(p => p.specs?.memory_type).filter(Boolean)));
        setExistingMemory(Array.from(new Set([...BASE_MEMORY_TYPES, ...mems])));

        // Merge Categories
        const dbCats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        const allCats = [...BASE_CATEGORIES];
        dbCats.forEach(c => {
            if (!allCats.find(base => base.id === c)) {
                allCats.push({ id: c, name: c.charAt(0).toUpperCase() + c.slice(1) });
            }
        });
        setExistingCategories(allCats);
    }
    setLoading(false);
  };
 
  const getOptionsFor = (cat: string) => inventory.filter(p => p.category === cat);
  const cleanPath = (path: string) => {
    if (!path) return "";
    let clean = path.replace(/\\/g, "/").replace(/^\/?public\/?/i, "").replace(/^"|"$/g, "");
    if (!clean.startsWith("/")) clean = "/" + clean;
    return clean;
  };

  // --- HIERARCHICAL DATA ORGANIZATION ---
  const organizedProducts = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, any[]>>> = {};

    products.forEach(p => {
        // [FIX]: Check p.group (DB column) OR p.specs?.group (Fallback inside JSON)
        const group = p.group || p.specs?.group || BASE_CATEGORY_MAP[p.category] || "accessories";
        
        const catName = existingCategories.find(c => c.id === p.category)?.name || p.category;
        const brand = p.brand || "Generic";

        if (!tree[group]) tree[group] = {};
        if (!tree[group][catName]) tree[group][catName] = {};
        if (!tree[group][catName][brand]) tree[group][catName][brand] = [];

        tree[group][catName][brand].push(p);
    });
    return tree;
  }, [products, existingCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const specs: any = {};
      
      // Determine correct group
      const finalGroup = isCustomCategory ? formData.group : (BASE_CATEGORY_MAP[formData.category] || formData.group);

      // [FIX]: We save 'group' inside 'specs' because your DB table likely doesn't have a 'group' column.
      specs.group = finalGroup; 

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
         
         // Standard Specs
         if (formData.category === 'cpu' || formData.category === 'motherboard') specs.socket = formData.socket;
         if (formData.category === 'gpu') {
             specs.vram = formData.capacity;
             specs.memory_type = formData.memory_type;
             if (formData.length_mm) specs.length_mm = parseInt(formData.length_mm);
         }
         if (formData.category === 'motherboard') { specs.memory_type = formData.memory_type; specs.form_factor = formData.form_factor; }
         if (formData.category === 'ram') { specs.memory_type = formData.memory_type; specs.capacity = formData.capacity; }
         if (formData.category === 'storage') { specs.capacity = formData.capacity; specs.storage_type = formData.storage_type; }
         if (formData.category === 'cabinet' && formData.max_gpu_length_mm) specs.max_gpu_length_mm = parseInt(formData.max_gpu_length_mm);
      }

      const finalMainImage = cleanPath(formData.image_url);
      const cleanedGallery = formData.gallery_urls.map(cleanPath).filter(url => url !== "" && url !== "/");
      const featuresArray = formData.features_text.split('\n').filter(line => line.trim() !== "");

      const payload = {
        name: formData.name,
        breadcrumb_name: formData.breadcrumb_name || null,
        price: parseFloat(formData.price),
        category: formData.category,
        // group: finalGroup, // <--- REMOVED THIS LINE (It causes the crash)
        series: formData.series || null,
        tier: formData.tier ? parseInt(formData.tier) : null,
        brand: formData.brand,
        image_url: finalMainImage,
        in_stock: formData.in_stock,
        specs: specs, // <--- The group is now saved inside here safely
        length_mm: specs.length_mm || 0,
        max_gpu_length_mm: specs.max_gpu_length_mm || 0,
        description: formData.description,
        features: featuresArray,
        gallery_urls: cleanedGallery
      };

      // [FIX]: Explicitly catch the error variable
      const { error } = activeTab === "edit" && formData.id
        ? await supabase.from('products').update(payload).eq('id', formData.id)
        : await supabase.from('products').insert(payload);

      if (error) throw error; // Throw to the catch block below

      alert(activeTab === "edit" ? "Updated!" : "Created!");
      resetForm();
      fetchProducts();

    } catch (err: any) {
      console.error(err);
      alert("Error saving product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: any) => {
    const s = product.specs || {};
    const isBaseCat = BASE_CATEGORIES.some(c => c.id === product.category);
    setIsCustomCategory(!isBaseCat);
    setIsCustomBrand(!existingBrands.includes(product.brand));
    setIsCustomSocket(s.socket && !BASE_SOCKETS.includes(s.socket) && !existingSockets.includes(s.socket));
    setIsCustomMemory(s.memory_type && !BASE_MEMORY_TYPES.includes(s.memory_type) && !existingMemory.includes(s.memory_type));

    setFormData({
      id: product.id, name: product.name, breadcrumb_name: product.breadcrumb_name || "", price: product.price.toString(), 
      category: product.category, group: product.group || BASE_CATEGORY_MAP[product.category] || "components",
      series: product.series || "", tier: product.tier ? product.tier.toString() : "",
      brand: product.brand, image_url: product.image_url || "", in_stock: product.in_stock ?? true,
      description: product.description || "",
      features_text: (product.features || []).join('\n'),
      gallery_urls: product.gallery_urls || [],
      
      socket: s.socket || "", memory_type: s.memory_type || s.memory_type || "", wattage: s.wattage ? s.wattage.toString() : "",
      capacity: s.capacity || s.vram || "", form_factor: s.form_factor || "", speed: s.speed || "", storage_type: s.storage_type || "",
      length_mm: s.length_mm ? s.length_mm.toString() : "",
      max_gpu_length_mm: s.max_gpu_length_mm ? s.max_gpu_length_mm.toString() : "",
      
      recipe_cpu: s["Processor"] || "", recipe_gpu: s["Graphics Card"] || "", recipe_mobo: s["Motherboard"] || "",
      recipe_ram: s["Memory"] || "", recipe_storage: s["Storage"] || "", recipe_psu: s["Power Supply"] || "",
      recipe_cooler: s["Cooling"] || "", recipe_cabinet: s["Cabinet"] || "", recipe_os: s["OS"] || ""
    });
    setActiveTab("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete product? This might remove empty custom categories.")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      id: "", name: "", breadcrumb_name: "", price: "", category: "cpu", group: "components", series: "", tier: "", brand: "", image_url: "", in_stock: true,
      description: "", features_text: "", gallery_urls: [],
      socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: "", storage_type: "",
      length_mm: "", max_gpu_length_mm: "",
      recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
      recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
    });
    setIsCustomCategory(false);
    setIsCustomBrand(false);
    setIsCustomSocket(false);
    setIsCustomMemory(false);
    setActiveTab("add");
  };

  // --- HELPERS FOR IMAGE ARRAY ---
  const addGalleryImage = () => setFormData({ ...formData, gallery_urls: [...formData.gallery_urls, ""] });
  const updateGalleryImage = (idx: number, val: string) => {
    const updated = [...formData.gallery_urls];
    updated[idx] = val;
    setFormData({ ...formData, gallery_urls: updated });
  };
  const removeGalleryImage = (idx: number) => {
    setFormData({ ...formData, gallery_urls: formData.gallery_urls.filter((_, i) => i !== idx) });
  };

  const toggleGroup = (grp: string) => setExpandedGroups(prev => ({ ...prev, [grp]: !prev[grp] }));
  const toggleCat = (cat: string) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-14 px-6 max-w-[1600px] mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-8 text-brand-purple">ADMIN DASHBOARD</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* --- LEFT: ADD/EDIT FORM (4 cols) --- */}
            <div className="xl:col-span-4">
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 sticky top-28 shadow-xl">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h2 className="font-bold text-xl flex items-center gap-2">
                             {activeTab === "edit" ? <FaEdit className="text-brand-purple"/> : <FaPlus className="text-brand-purple"/>}
                             {activeTab === "edit" ? "Edit Product" : "Add New Product"}
                        </h2>
                        <button onClick={resetForm} className="text-xs bg-white/5 px-3 py-1 rounded hover:bg-white/10">Reset Form</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
                        
                        {/* 1. CATEGORY SELECTION */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-silver font-bold tracking-wider">Classification</label>
                            
                            {isCustomCategory ? (
                                <div className="p-3 bg-brand-purple/10 rounded border border-brand-purple/30 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-brand-purple font-bold">New Category</span>
                                        <button type="button" onClick={() => setIsCustomCategory(false)} className="text-[10px] text-red-400 hover:underline">Cancel</button>
                                    </div>
                                    <input 
                                        placeholder="ID (e.g. headphones)" 
                                        className="w-full bg-[#121212] p-2 rounded border border-brand-purple text-white font-bold text-sm"
                                        value={formData.category} 
                                        onChange={e => setFormData({...formData, category: e.target.value.toLowerCase()})} 
                                        autoFocus 
                                    />
                                    {/* PARENT GROUP SELECTOR FOR NEW CATEGORY */}
                                    <select 
                                        className="w-full bg-[#121212] p-2 rounded border border-white/20 text-xs"
                                        value={formData.group}
                                        onChange={e => setFormData({...formData, group: e.target.value})}
                                    >
                                        {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <select className="w-full bg-[#121212] p-3 rounded border border-white/10 text-white font-bold focus:border-brand-purple transition-colors"
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
                                    <option value="NEW" className="bg-brand-purple text-white font-bold">+ Create New Category</option>
                                </select>
                            )}
                        </div>

                        {/* 2. BASIC INFO */}
                        <div className="space-y-2">
                            <input required placeholder="Product Name" className="w-full bg-[#121212] p-3 rounded border border-white/10 focus:border-brand-purple outline-none" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            
                            <div className="relative">
                                 <input placeholder="Breadcrumb Name (Optional)" className="w-full bg-[#121212] p-2 rounded border border-white/10 text-xs focus:border-brand-purple outline-none" 
                                    value={formData.breadcrumb_name} onChange={e => setFormData({...formData, breadcrumb_name: e.target.value})} />
                            </div>
                        </div>

                        {/* SERIES (For Pre-builts) */}
                        {formData.category === 'prebuilt' && (
                            <div className="grid grid-cols-2 gap-4 bg-brand-purple/5 p-3 rounded border border-brand-purple/20">
                                <select className="bg-transparent text-xs outline-none text-brand-purple font-bold" value={formData.series} onChange={e => setFormData({...formData, series: e.target.value})}>
                                    <option value="">Select Series</option>
                                    {SERIES_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                {formData.series !== 'signature' && (
                                    <select className="bg-transparent text-xs outline-none text-white" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})}>
                                        <option value="">Select Tier</option>
                                        {TIER_OPTS.map(t => <option key={t} value={t}>Level {t}</option>)}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* 3. PRICE & BRAND */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-brand-silver">₹</span>
                                <input required type="number" placeholder="Price" className="w-full bg-[#121212] p-3 pl-6 rounded border border-white/10" 
                                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                            </div>
                            
                            {isCustomBrand ? (
                                <div className="relative">
                                    <input placeholder="New Brand" className="w-full bg-[#121212] p-3 rounded border border-brand-purple" 
                                        value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                                    <button type="button" onClick={() => setIsCustomBrand(false)} className="absolute right-2 top-3 text-[10px] text-red-400 font-bold">CANCEL</button>
                                </div>
                            ) : (
                                <select className="w-full bg-[#121212] p-3 rounded border border-white/10"
                                    value={formData.brand} onChange={e => {
                                        if(e.target.value === "NEW") setIsCustomBrand(true);
                                        else setFormData({...formData, brand: e.target.value});
                                    }}>
                                    <option value="">Select Brand</option>
                                    {existingBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                    <option value="NEW" className="text-brand-purple font-bold">+ Add Brand</option>
                                </select>
                            )}
                        </div>

                        {/* 4. IMAGES (Dynamic List) */}
                        <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                            <label className="text-xs text-brand-purple uppercase font-bold flex items-center gap-2"><FaImage/> Image Gallery</label>
                            
                            {/* Main Image */}
                            <div className="space-y-1">
                                <span className="text-[10px] text-brand-silver">Main Thumbnail</span>
                                <input placeholder="Main Image Path..." className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" 
                                    value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                            </div>

                            {/* Additional Images Loop */}
                            <div className="space-y-2">
                                <span className="text-[10px] text-brand-silver">Gallery Images</span>
                                {formData.gallery_urls.map((url, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input 
                                            placeholder={`Image ${idx + 2} Path...`}
                                            className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                                            value={url}
                                            onChange={(e) => updateGalleryImage(idx, e.target.value)}
                                        />
                                        <button type="button" onClick={() => removeGalleryImage(idx)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><FaTrash size={10}/></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addGalleryImage} className="w-full py-2 border border-dashed border-white/20 text-xs text-brand-silver hover:text-white hover:border-brand-purple transition-colors rounded">
                                    + Add Another Image
                                </button>
                            </div>
                        </div>

                        {/* 5. DESCRIPTION & FEATURES */}
                        <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                            <textarea placeholder="Product Description..." className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-20"
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            <textarea placeholder="Features (One per line)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-20"
                                value={formData.features_text} onChange={e => setFormData({...formData, features_text: e.target.value})} />
                        </div>

                        {/* 6. SPECS or RECIPE */}
                        {formData.category === 'prebuilt' ? (
                            <div className="bg-[#121212] p-3 rounded border border-brand-purple/30 space-y-3">
                                <label className="text-xs text-brand-purple uppercase font-bold block">System Configuration</label>
                                {[
                                    { label: "Processor", key: "recipe_cpu", cat: "cpu" },
                                    { label: "Graphics", key: "recipe_gpu", cat: "gpu" },
                                    { label: "Motherboard", key: "recipe_mobo", cat: "motherboard" },
                                    { label: "Memory", key: "recipe_ram", cat: "ram" },
                                    { label: "Storage", key: "recipe_storage", cat: "storage" },
                                    { label: "Power", key: "recipe_psu", cat: "psu" },
                                    { label: "Cooling", key: "recipe_cooler", cat: "cooler" },
                                    { label: "Cabinet", key: "recipe_cabinet", cat: "cabinet" },
                                    { label: "Operating System", key: "recipe_os", cat: "os" },
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
                                <label className="text-xs text-brand-purple uppercase font-bold block">Technical Specs</label>
                                {formData.category !== 'os' && <input type="number" placeholder="Wattage (TDP)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.wattage} onChange={e => setFormData({...formData, wattage: e.target.value})} />}
                                
                                {formData.category === 'gpu' && (
                                    <div className="bg-brand-purple/10 p-2 rounded border border-brand-purple/30">
                                        <label className="text-[10px] text-brand-purple font-bold">GPU Length (mm)</label>
                                        <input type="number" placeholder="e.g. 320" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs mt-1"
                                            value={formData.length_mm} onChange={e => setFormData({...formData, length_mm: e.target.value})} />
                                    </div>
                                )}
                                {formData.category === 'cabinet' && (
                                    <div className="bg-brand-purple/10 p-2 rounded border border-brand-purple/30">
                                        <label className="text-[10px] text-brand-purple font-bold">Max GPU Clearance (mm)</label>
                                        <input type="number" placeholder="e.g. 340" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs mt-1"
                                            value={formData.max_gpu_length_mm} onChange={e => setFormData({...formData, max_gpu_length_mm: e.target.value})} />
                                    </div>
                                )}

                                {/* DYNAMIC SOCKET & MEMORY INPUTS */}
                                {(formData.category === 'cpu' || formData.category === 'motherboard') && (
                                    isCustomSocket ? (
                                        <div className="flex gap-2"><input placeholder="Type Socket" className="w-full bg-[#1A1A1A] p-2 rounded border border-brand-purple text-xs" value={formData.socket} onChange={e => setFormData({...formData, socket: e.target.value})} /><button type="button" onClick={() => setIsCustomSocket(false)} className="text-red-400 text-xs">X</button></div>
                                    ) : (
                                        <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.socket} onChange={e => { if(e.target.value==="NEW") setIsCustomSocket(true); else setFormData({...formData, socket: e.target.value}); }}>
                                            <option value="">Select Socket</option>{existingSockets.map(s => <option key={s} value={s}>{s}</option>)}<option value="NEW" className="text-brand-purple">+ Add New</option>
                                        </select>
                                    )
                                )}
                                {(formData.category === 'ram' || formData.category === 'motherboard' || formData.category === 'gpu') && (
                                    isCustomMemory ? (
                                        <div className="flex gap-2"><input placeholder="Type DDR" className="w-full bg-[#1A1A1A] p-2 rounded border border-brand-purple text-xs" value={formData.memory_type} onChange={e => setFormData({...formData, memory_type: e.target.value})} /><button type="button" onClick={() => setIsCustomMemory(false)} className="text-red-400 text-xs">X</button></div>
                                    ) : (
                                        <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.memory_type} onChange={e => { if(e.target.value==="NEW") setIsCustomMemory(true); else setFormData({...formData, memory_type: e.target.value}); }}>
                                            <option value="">Select Memory Type</option>{existingMemory.map(m => <option key={m} value={m}>{m}</option>)}<option value="NEW" className="text-brand-purple">+ Add New</option>
                                        </select>
                                    )
                                )}
                                {formData.category === 'storage' && (
                                    <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.storage_type} onChange={e => setFormData({...formData, storage_type: e.target.value})}>
                                        <option value="">Select Storage Type</option>{STORAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                )}
                                {(formData.category === 'ram' || formData.category === 'gpu' || formData.category === 'storage') && (
                                    <input placeholder="Capacity (e.g. 16GB)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                                )}
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer pt-2 p-3 bg-white/5 rounded">
                            <input type="checkbox" className="w-4 h-4 accent-brand-purple" checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} />
                            <span className="text-sm text-brand-silver">Available in Stock</span>
                        </label>

                        <button disabled={loading} className="w-full bg-brand-purple py-4 rounded font-bold hover:bg-white hover:text-black transition-all shadow-lg text-lg">
                            {loading ? "Processing..." : activeTab === "edit" ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
                        </button>
                    </form>
                </div>
            </div>

            {/* --- RIGHT: HIERARCHICAL PRODUCT LIST (8 cols) --- */}
            <div className="xl:col-span-8">
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 min-h-[500px]">
                    <h2 className="font-bold text-xl mb-6">Product Inventory</h2>
                    
                    {/* ROOT GROUPS (Components, Desktops, Accessories) */}
                    <div className="space-y-4">
                        {GROUPS.map((group) => {
                            const groupHasProducts = organizedProducts[group.id];
                            if(!groupHasProducts) return null;

                            return (
                                <div key={group.id} className="border border-white/10 rounded-lg overflow-hidden bg-[#121212]">
                                    {/* GROUP HEADER */}
                                    <div 
                                        className="flex items-center justify-between p-4 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <h3 className="font-orbitron font-bold text-lg text-brand-purple flex items-center gap-2">
                                            {expandedGroups[group.id] ? <FaChevronDown size={12}/> : <FaChevronRight size={12}/>}
                                            {group.name}
                                        </h3>
                                        <span className="text-xs text-brand-silver bg-black/50 px-2 py-1 rounded">
                                            {Object.values(organizedProducts[group.id] || {}).reduce((acc:any, brands:any) => acc + Object.values(brands).flat().length, 0)} Items
                                        </span>
                                    </div>

                                    {/* CATEGORIES INSIDE GROUP */}
                                    {expandedGroups[group.id] && (
                                        <div className="p-4 space-y-4 bg-black/20 border-t border-white/5">
                                            {Object.entries(organizedProducts[group.id]).map(([catName, brands]) => (
                                                <div key={catName} className="ml-2">
                                                    {/* CATEGORY HEADER */}
                                                    <div 
                                                        className="flex items-center gap-2 text-sm font-bold text-white mb-3 cursor-pointer select-none"
                                                        onClick={() => toggleCat(catName)}
                                                    >
                                                        {expandedCats[catName] ? <FaChevronDown size={10} className="text-brand-silver"/> : <FaChevronRight size={10} className="text-brand-silver"/>}
                                                        <span className="uppercase tracking-wider">{catName}</span>
                                                    </div>

                                                    {/* BRANDS & PRODUCTS INSIDE CATEGORY */}
                                                    {expandedCats[catName] && (
                                                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {Object.entries(brands).map(([brandName, brandProducts]) => (
                                                                <div key={brandName} className="bg-[#1A1A1A] border border-white/5 rounded p-3">
                                                                    <h4 className="text-xs text-brand-silver font-bold mb-2 uppercase border-b border-white/5 pb-1">{brandName}</h4>
                                                                    <div className="space-y-2">
                                                                        {brandProducts.map((p) => (
                                                                            <div key={p.id} className="flex justify-between items-center group/item hover:bg-white/5 p-1 rounded transition-colors">
                                                                                <span className="text-xs text-white truncate max-w-[70%]">{p.name}</span>
                                                                                <div className="flex gap-2 opacity-50 group-hover/item:opacity-100">
                                                                                    <button onClick={() => handleEditClick(p)} className="text-brand-purple hover:text-white"><FaEdit size={12}/></button>
                                                                                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-400"><FaTrash size={12}/></button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}