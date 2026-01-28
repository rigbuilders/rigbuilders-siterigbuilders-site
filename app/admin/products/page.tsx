// app/admin/products/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaTimes } from "react-icons/fa";

// Import sub-components and constants
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";
import { BASE_CATEGORIES, BASE_SOCKETS, BASE_MEMORY_TYPES, BASE_CATEGORY_MAP } from "./constants";

export default function ProductManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");
  const router = useRouter();

  // --- CLONE STATE ---
  const [cloneTarget, setCloneTarget] = useState<any>(null);

  // --- DYNAMIC DATA ---
  const [existingBrands, setExistingBrands] = useState<string[]>([]);
  const [existingCategories, setExistingCategories] = useState<any[]>(BASE_CATEGORIES);
  const [existingSockets, setExistingSockets] = useState<string[]>(BASE_SOCKETS);
  const [existingMemory, setExistingMemory] = useState<string[]>(BASE_MEMORY_TYPES);

  // --- TOGGLES ---
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomSocket, setIsCustomSocket] = useState(false);
  const [isCustomMemory, setIsCustomMemory] = useState(false);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    id: "", name: "", breadcrumb_name: "", price: "", mrp: "", warranty: "", 
    nickname: "",
    category: "cpu", group: "components", series: "", tier: "", brand: "", 
    image_url: "", in_stock: true, description: "", features_text: "",
    gallery_urls: [] as string[], cod_policy: "full_cod",
    
    // SPECS
    socket: "", memory_type: "", wattage: "", capacity: "", speed: "", storage_type: "",
    length_mm: "", max_gpu_length_mm: "",
    
    // NEW COMPATIBILITY FIELDS
    form_factor: "", radiator_size: "",
    supported_motherboards: [] as string[], 
    supported_radiators: [] as string[],

    // RECIPE
    recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
    recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "rigbuilders123@gmail.com") {
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
        
        // Extract Unique Data
        const brands = Array.from(new Set(data.map(p => p.brand).filter(Boolean)));
        setExistingBrands(brands.sort());
        const sockets = Array.from(new Set(data.map(p => p.specs?.socket).filter(Boolean)));
        setExistingSockets(Array.from(new Set([...BASE_SOCKETS, ...sockets])));
        const mems = Array.from(new Set(data.map(p => p.specs?.memory_type).filter(Boolean)));
        setExistingMemory(Array.from(new Set([...BASE_MEMORY_TYPES, ...mems])));

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

  const cleanPath = (path: string) => {
    if (!path) return "";
    let clean = path.replace(/\\/g, "/").replace(/^\/?public\/?/i, "").replace(/^"|"$/g, "");
    if (!clean.startsWith("/")) clean = "/" + clean;
    return clean;
  };

  const resetForm = () => {
    setFormData({
      id: "", name: "", breadcrumb_name: "", price: "", mrp: "", warranty: "", nickname: "",
      category: "cpu", group: "components", series: "", tier: "", brand: "", image_url: "", in_stock: true,
      cod_policy: "full_cod", description: "", features_text: "", gallery_urls: [],
      socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: "", storage_type: "",
      length_mm: "", max_gpu_length_mm: "", radiator_size: "", supported_motherboards: [], supported_radiators: [],
      recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
      recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
    });
    setIsCustomCategory(false); setIsCustomBrand(false); setIsCustomSocket(false); setIsCustomMemory(false);
    setActiveTab("add");
  };

  // --- ACTIONS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const specs: any = {};
      specs.group = isCustomCategory ? formData.group : (BASE_CATEGORY_MAP[formData.category] || formData.group);

      if (formData.category === 'prebuilt') {
         ["Processor", "Graphics Card", "Motherboard", "Memory", "Storage", "Power Supply", "Cooling", "Cabinet", "OS"].forEach(k => {
             const key = `recipe_${k.toLowerCase().replace(/ /g, '_').replace('graphics_card', 'gpu').replace('processor', 'cpu').replace('power_supply', 'psu')}` as keyof typeof formData;
             specs[k] = formData[key];
         });
      } else {
         if (formData.wattage) specs.wattage = parseInt(formData.wattage);
         if (['cpu','motherboard'].includes(formData.category)) specs.socket = formData.socket;
         if (formData.category === 'gpu') { specs.vram = formData.capacity; specs.memory_type = formData.memory_type; if (formData.length_mm) specs.length_mm = parseInt(formData.length_mm); }
         if (formData.category === 'motherboard') { specs.memory_type = formData.memory_type; specs.form_factor = formData.form_factor; }
         if (formData.category === 'ram') { specs.memory_type = formData.memory_type; specs.capacity = formData.capacity; }
         if (formData.category === 'storage') { specs.capacity = formData.capacity; specs.storage_type = formData.storage_type; }
         if (formData.category === 'cooler') specs.radiator_size = formData.radiator_size;
         if (formData.category === 'cabinet') {
             if (formData.max_gpu_length_mm) specs.max_gpu_length_mm = parseInt(formData.max_gpu_length_mm);
             specs.supported_motherboards = formData.supported_motherboards;
             specs.supported_radiators = formData.supported_radiators;
         }
      }

      const payload = {
        name: formData.name,
        nickname: formData.nickname || null,
        breadcrumb_name: formData.breadcrumb_name || null,
        price: parseFloat(formData.price),
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        warranty: formData.warranty || null,
        category: formData.category,
        series: formData.series || null,
        tier: formData.tier ? parseInt(formData.tier) : null,
        brand: formData.brand,
        image_url: cleanPath(formData.image_url),
        in_stock: formData.in_stock,
        cod_policy: formData.cod_policy,
        specs: specs, 
        length_mm: specs.length_mm || 0,
        max_gpu_length_mm: specs.max_gpu_length_mm || 0,
        description: formData.description,
        features: formData.features_text.split('\n').filter(line => line.trim() !== ""),
        gallery_urls: formData.gallery_urls.map(cleanPath).filter(url => url !== "" && url !== "/")
      };

      const { error } = activeTab === "edit" && formData.id
        ? await supabase.from('products').update(payload).eq('id', formData.id)
        : await supabase.from('products').insert(payload);

      if (error) throw error;
      alert(activeTab === "edit" ? "Updated!" : "Created!");
      resetForm();
      fetchProducts();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (p: any) => {
    const s = p.specs || {};
    setIsCustomCategory(!BASE_CATEGORIES.some(c => c.id === p.category));
    setIsCustomBrand(!existingBrands.includes(p.brand));
    
    setFormData({
      ...formData,
      id: p.id, name: p.name,nickname: p.nickname || "", breadcrumb_name: p.breadcrumb_name || "", price: p.price.toString(),
      mrp: p.mrp ? p.mrp.toString() : "", warranty: p.warranty || "",
      category: p.category, group: p.group || s.group || "components",
      series: p.series || "", tier: p.tier ? p.tier.toString() : "",
      brand: p.brand, image_url: p.image_url || "", in_stock: p.in_stock ?? true,
      cod_policy: p.cod_policy || "full_cod",
      description: p.description || "", features_text: (p.features || []).join('\n'),
      gallery_urls: p.gallery_urls || [],
      
      socket: s.socket || "", memory_type: s.memory_type || "", wattage: s.wattage ? s.wattage.toString() : "",
      capacity: s.capacity || s.vram || "", form_factor: s.form_factor || "",
      length_mm: s.length_mm ? s.length_mm.toString() : "",
      max_gpu_length_mm: s.max_gpu_length_mm ? s.max_gpu_length_mm.toString() : "",
      radiator_size: s.radiator_size || "", 
      supported_motherboards: s.supported_motherboards || [], 
      supported_radiators: s.supported_radiators || [],
      
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

  // --- CLONE LOGIC ---
  const executeClone = (type: 'variant' | 'base') => {
    if (!cloneTarget) return;
    const s = cloneTarget.specs || {};
    
    // Common Base
    const base = {
        category: cloneTarget.category, group: cloneTarget.group || "components",
        brand: cloneTarget.brand, image_url: cloneTarget.image_url,
        name: `${cloneTarget.name} (Copy)`, nickname: "",breadcrumb_name: cloneTarget.breadcrumb_name || "",
        in_stock: true, cod_policy: cloneTarget.cod_policy || "full_cod",
        gallery_urls: cloneTarget.gallery_urls || [],
        price: "", mrp: "", warranty: "", id: "", // Reset
        supported_motherboards: [], supported_radiators: [],
        recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
        recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
    };

    if (type === 'variant') {
        setFormData({
            ...formData, ...base,
            description: cloneTarget.description || "", features_text: (cloneTarget.features || []).join('\n'),
            socket: s.socket || "", memory_type: s.memory_type || "", wattage: s.wattage ? s.wattage.toString() : "",
            capacity: s.capacity || s.vram || "", form_factor: s.form_factor || "",
            length_mm: s.length_mm ? s.length_mm.toString() : "",
            max_gpu_length_mm: s.max_gpu_length_mm ? s.max_gpu_length_mm.toString() : "",
            radiator_size: s.radiator_size || "",
            supported_motherboards: s.supported_motherboards || [],
            supported_radiators: s.supported_radiators || []
        });
    } else {
        setFormData({ ...formData, ...base, description: "", features_text: "" });
    }
    setActiveTab("add");
    setCloneTarget(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-14 px-6 max-w-[1600px] mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-8 text-brand-purple">ADMIN DASHBOARD</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* LEFT: FORM */}
            <div className="xl:col-span-4">
                <ProductForm 
                    formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} resetForm={resetForm}
                    loading={loading} activeTab={activeTab}
                    existingBrands={existingBrands} existingCategories={existingCategories}
                    existingSockets={existingSockets} existingMemory={existingMemory} inventory={inventory}
                    isCustomCategory={isCustomCategory} setIsCustomCategory={setIsCustomCategory}
                    isCustomBrand={isCustomBrand} setIsCustomBrand={setIsCustomBrand}
                    isCustomSocket={isCustomSocket} setIsCustomSocket={setIsCustomSocket}
                    isCustomMemory={isCustomMemory} setIsCustomMemory={setIsCustomMemory}
                />
            </div>

            {/* RIGHT: LIST */}
            <div className="xl:col-span-8">
                <ProductList 
                    products={products} 
                    existingCategories={existingCategories}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                    handleCloneClick={setCloneTarget}
                />
            </div>
        </div>
      </div>

      {/* CLONE MODAL */}
      {cloneTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] border border-white/10 p-6 rounded-xl w-full max-w-md relative shadow-2xl">
                <button onClick={() => setCloneTarget(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><FaTimes /></button>
                <h3 className="text-xl font-bold text-white mb-2">Clone Product</h3>
                <p className="text-sm text-brand-silver mb-6">Cloning <span className="text-white font-bold">{cloneTarget.name}</span></p>
                <div className="space-y-3">
                    <button onClick={() => executeClone('variant')} className="w-full text-left p-4 bg-brand-purple/10 border border-brand-purple/30 rounded hover:bg-brand-purple/20 transition-colors">
                        <div className="font-bold text-white">Create Variant</div>
                        <div className="text-xs text-brand-silver mt-1">Keeps specs/description. Good for changing size/color.</div>
                    </button>
                    <button onClick={() => executeClone('base')} className="w-full text-left p-4 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                        <div className="font-bold text-white text-blue-400">Create New Base</div>
                        <div className="text-xs text-brand-silver mt-1">Clears specs/description. Good for new series.</div>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}