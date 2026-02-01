"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaBoxOpen } from "react-icons/fa"; // Icon

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
    nickname: "",configurator_name: "",
    category: "cpu", group: "components", series: "", tier: "", brand: "", 
    image_url: "", in_stock: true, description: "", features_text: "",
    gallery_urls: [] as string[], cod_policy: "full_cod",
    
    variant_group_id: "", 
    specs: { color: "", variant_label: "" } as any, // Initialize variant_label
    
    // FLATTENED SPECS
    socket: "", memory_type: "", wattage: "", capacity: "", speed: "", storage_type: "",
    length_mm: "", max_gpu_length_mm: "",
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
      id: "", name: "", breadcrumb_name: "", price: "", mrp: "", warranty: "", nickname: "",configurator_name: "",
      category: "cpu", group: "components", series: "", tier: "", brand: "", image_url: "", in_stock: true,
      cod_policy: "full_cod", description: "", features_text: "", gallery_urls: [],
      
      variant_group_id: "", 
      specs: { color: "", variant_label: "" }, 
      
      socket: "", memory_type: "", wattage: "", capacity: "", form_factor: "", speed: "", storage_type: "",
      length_mm: "", max_gpu_length_mm: "", radiator_size: "", supported_motherboards: [], supported_radiators: [],
      recipe_cpu: "", recipe_gpu: "", recipe_mobo: "", recipe_ram: "", recipe_storage: "", 
      recipe_psu: "", recipe_cooler: "", recipe_cabinet: "", recipe_os: ""
    });
    setIsCustomCategory(false); setIsCustomBrand(false); setIsCustomSocket(false); setIsCustomMemory(false);
    setActiveTab("add");
  };

  // --- MAIN ACTIONS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const specs: any = { ...formData.specs }; 
      specs.group = isCustomCategory ? formData.group : (BASE_CATEGORY_MAP[formData.category] || formData.group);

      // Map Flattened fields to Specs JSON
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

      // Save Variant Specifics
      if (formData.specs?.color) specs.color = formData.specs.color;
      if (formData.specs?.variant_label) specs.variant_label = formData.specs.variant_label;

      const payload = {
        name: formData.name,
        nickname: formData.nickname || null,
        configurator_name: formData.configurator_name || null,
        breadcrumb_name: formData.breadcrumb_name || null,
        price: parseFloat(formData.price),
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        
        variant_group_id: formData.variant_group_id || null, 
        
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
      id: p.id, name: p.name, nickname: p.nickname || "", breadcrumb_name: p.breadcrumb_name || "", price: p.price.toString(),configurator_name: p.configurator_name || "",
      
      variant_group_id: p.variant_group_id || "", 
      specs: s, 
      
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

  // --- NEW VARIANT WORKFLOW ---
  // This logic is simplified: It just sets up the form. Grouping is handled in the List UI.
  const handleVariantClick = async (parentProduct: any) => {
    setLoading(true);
    let groupId = parentProduct.variant_group_id;

    // 1. Assign Group ID if missing
    if (!groupId) {
        groupId = `var_${Date.now()}`; 
        const { error } = await supabase.from('products').update({ variant_group_id: groupId }).eq('id', parentProduct.id);
        if (error) { alert("Failed to init variant group."); setLoading(false); return; }
        await fetchProducts(); 
    }

    const s = parentProduct.specs || {};
    
    // 2. Pre-fill Form but CLEAR identity fields
    setFormData({
        ...formData, 
        // Shared
        category: parentProduct.category,
        group: parentProduct.group || s.group || "components",
        brand: parentProduct.brand,
        description: parentProduct.description || "",
        features_text: (parentProduct.features || []).join('\n'),
        gallery_urls: parentProduct.gallery_urls || [],
        cod_policy: parentProduct.cod_policy || "full_cod",
        image_url: parentProduct.image_url || "", 
        variant_group_id: groupId,

        // Specs
        socket: s.socket || "", 
        memory_type: s.memory_type || "", 
        form_factor: s.form_factor || "",
        wattage: s.wattage ? s.wattage.toString() : "",
        capacity: s.capacity || s.vram || "",
        
        // UNIQUE (Reset these so user types new ones)
        name: `${parentProduct.name} (Variant)`, 
        price: parentProduct.price?.toString() || "",
        mrp: parentProduct.mrp?.toString() || "",
        nickname: "", 
        id: "", // Empty ID = Creates New Item
        
        // RESET VARIANT LABEL (Forces user to name it, e.g. "White")
        specs: { ...s, color: "", variant_label: "" } 
    });

    setActiveTab("add");
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-24 px-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-brand-purple rounded-xl flex items-center justify-center text-2xl">
                <FaBoxOpen />
            </div>
            <div>
                <h1 className="font-orbitron text-3xl font-bold text-white">PRODUCT MANAGER</h1>
                <p className="text-brand-silver">Inventory & Variant Control</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* LEFT: FORM */}
            <div className="xl:col-span-4 relative">
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
                    handleVariantClick={handleVariantClick} 
                />
            </div>
        </div>
      </div>
    </div>
  );
}