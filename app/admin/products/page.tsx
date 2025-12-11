"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { allProducts } from "@/app/data/products"; 

const CATEGORIES = [
  { id: "cpu", name: "Processor" },
  { id: "gpu", name: "Graphics Card" },
  { id: "motherboard", name: "Motherboard" },
  { id: "memory", name: "RAM / Memory" },
  { id: "storage", name: "Storage" },
  { id: "psu", name: "Power Supply" },
  { id: "cabinet", name: "Cabinet" },
  { id: "cooler", name: "Cooler" }
];

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
    in_stock: true, // NEW: Stock Status
    specs_text: ""  // NEW: Manual Specs
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // UPDATE THIS TO YOUR EMAIL
      const ADMIN_EMAIL = "rigbuilders123@gmail.com"; 

      if (!user || user.email !== ADMIN_EMAIL) {
        alert("Access Denied: You are not an admin.");
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
      // Save specs as a simple "raw" key containing the pre-formatted text
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        brand: formData.brand,
        image_url: formData.image_url,
        in_stock: formData.in_stock, // Save Stock Status
        specs: { raw: formData.specs_text } // Save Manual Specs
      };

      if (activeTab === "edit" && formData.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', formData.id);
        if (error) throw error;
        alert("Product Updated Successfully!");
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        alert("Product Created Successfully!");
      }

      resetForm();
      fetchProducts();

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import existing mock data
  const handleImport = async () => {
    if (!confirm(`This will import ${allProducts.length} products. Continue?`)) return;
    setLoading(true);
    let count = 0;
    for (const p of allProducts) {
        // Create a simple text representation of old specs
        let rawSpecs = "";
        if ('socket' in p) rawSpecs += `Socket: ${(p as any).socket}\n`;
        if ('vram' in p) rawSpecs += `VRAM: ${(p as any).vram}GB\n`;
        if ('wattage' in p) rawSpecs += `Power: ${(p as any).wattage}W\n`;

        const { error } = await supabase.from('products').insert({
            name: p.name,
            price: p.price,
            category: p.category,
            brand: p.brand,
            image_url: p.image,
            in_stock: p.inStock,
            specs: { raw: rawSpecs.trim() }
        });
        if (!error) count++;
    }
    alert(`Imported ${count} products!`);
    fetchProducts();
  };

  const handleEditClick = (product: any) => {
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      brand: product.brand,
      image_url: product.image_url || "",
      in_stock: product.in_stock ?? true, // Load Stock Status
      // Load raw text OR fallback to empty if older format
      specs_text: product.specs?.raw || "" 
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
      in_stock: true, specs_text: ""
    });
    setActiveTab("add");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      
      <div className="pt-32 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="font-orbitron text-3xl font-bold text-brand-purple">ADMIN DASHBOARD</h1>
            <div className="flex gap-4">
                {products.length === 0 && (
                    <button onClick={handleImport} className="px-6 py-2 rounded font-bold uppercase bg-green-600 hover:bg-green-500 text-white">Import Data</button>
                )}
                <button onClick={() => { resetForm(); setActiveTab("add"); }} className={`px-6 py-2 rounded font-bold uppercase transition-all ${activeTab === "add" ? "bg-white text-black" : "bg-white/10 text-white"}`}>Add New</button>
                <button onClick={() => setActiveTab("edit")} className={`px-6 py-2 rounded font-bold uppercase transition-all ${activeTab === "edit" ? "bg-white text-black" : "bg-white/10 text-white"}`}>Edit Inventory</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: FORM AREA */}
            <div className="lg:col-span-1">
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 sticky top-28">
                    <h2 className="font-bold text-xl mb-6 border-b border-white/10 pb-4">
                        {activeTab === "edit" ? "Editing Product" : "Add New Product"}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs text-[#A0A0A0] uppercase">Product Name</label>
                            <input required className="w-full bg-[#121212] p-2 rounded border border-white/10 focus:border-brand-purple outline-none" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-[#A0A0A0] uppercase">Price (₹)</label>
                                <input required type="number" className="w-full bg-[#121212] p-2 rounded border border-white/10 focus:border-brand-purple outline-none" 
                                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-[#A0A0A0] uppercase">Brand</label>
                                <input required className="w-full bg-[#121212] p-2 rounded border border-white/10 focus:border-brand-purple outline-none" 
                                    value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-[#A0A0A0] uppercase">Category</label>
                                <select className="w-full bg-[#121212] p-2 rounded border border-white/10 focus:border-brand-purple outline-none"
                                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            
                            {/* NEW: STOCK TOGGLE */}
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" className="w-5 h-5 accent-brand-purple"
                                        checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} />
                                    <span className={formData.in_stock ? "text-green-400 font-bold" : "text-red-500 font-bold"}>
                                        {formData.in_stock ? "In Stock" : "Out of Stock"}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-[#A0A0A0] uppercase">Image Path</label>
                            <input className="w-full bg-[#121212] p-2 rounded border border-white/10 focus:border-brand-purple outline-none text-xs" 
                                placeholder="/images/products/example.png"
                                value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                        </div>

                        {/* NEW: MANUAL SPECS TEXTAREA */}
                        <div>
                            <label className="text-xs text-brand-purple uppercase font-bold mb-2 block">Specifications (Manual)</label>
                            <p className="text-[10px] text-[#A0A0A0] mb-2">Write details line-by-line. It will appear exactly as typed.</p>
                            <textarea 
                                className="w-full bg-[#121212] p-3 rounded border border-white/10 focus:border-brand-purple outline-none font-mono text-sm h-32 leading-relaxed"
                                placeholder={"Socket: AM5\nCores: 16\nThreads: 32\nBoost: 5.7GHz"}
                                value={formData.specs_text} 
                                onChange={e => setFormData({...formData, specs_text: e.target.value})} 
                            />
                        </div>

                        <button disabled={loading} className="w-full bg-brand-purple py-3 rounded font-bold hover:bg-white hover:text-black transition-all mt-4">
                            {loading ? "Processing..." : activeTab === "edit" ? "Update Product" : "Create Product"}
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: INVENTORY LIST */}
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-xl">Current Listings</h2>
                    <span className="text-sm text-[#A0A0A0]">{products.length} Products Found</span>
                </div>

                <div className="space-y-3">
                    {products.map((p) => (
                        <div key={p.id} className="bg-[#1A1A1A] p-4 rounded border border-white/5 hover:border-white/20 transition-all flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black/50 rounded flex items-center justify-center text-[10px] text-[#A0A0A0] uppercase font-bold border border-white/5">
                                    {p.category.substring(0,3)}
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-brand-purple transition-colors">{p.name}</h3>
                                    <div className="flex gap-3 text-xs text-[#A0A0A0] items-center">
                                        <span>{p.brand}</span>
                                        <span>•</span>
                                        <span>₹{p.price.toLocaleString("en-IN")}</span>
                                        <span>•</span>
                                        <span className={p.in_stock ? "text-green-500" : "text-red-500"}>
                                            {p.in_stock ? "In Stock" : "Sold Out"}
                                        </span>
                                    </div>
                                    {/* Preview Specs */}
                                    <p className="text-[10px] text-white/40 mt-1 truncate max-w-md font-mono">
                                        {p.specs?.raw || "No specs added"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEditClick(p)} 
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white hover:text-black rounded text-xs font-bold uppercase transition-all"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(p.id)} 
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded text-xs font-bold uppercase transition-all border border-red-500/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {products.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded text-[#A0A0A0]">
                            No products found in database. 
                            <br/><span className="text-xs text-brand-purple">Click "Import Mock Data" to load your file.</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}