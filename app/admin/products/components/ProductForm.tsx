// app/admin/products/components/ProductForm.tsx
"use client";

import { FaPlus, FaEdit, FaImage, FaTrash } from "react-icons/fa";
import { 
  GROUPS, BASE_CATEGORIES, SERIES_OPTS, TIER_OPTS, 
  BASE_SOCKETS, BASE_MEMORY_TYPES, STORAGE_TYPES,
  FORM_FACTORS, RADIATOR_SIZES 
} from "../constants";

interface ProductFormProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
  loading: boolean;
  activeTab: "add" | "edit";
  
  // Dynamic Data
  existingBrands: string[];
  existingCategories: any[];
  existingSockets: string[];
  existingMemory: string[];
  inventory: any[]; // For prebuilt dropdowns
  
  // Toggles
  isCustomCategory: boolean;
  setIsCustomCategory: (v: boolean) => void;
  isCustomBrand: boolean;
  setIsCustomBrand: (v: boolean) => void;
  isCustomSocket: boolean;
  setIsCustomSocket: (v: boolean) => void;
  isCustomMemory: boolean;
  setIsCustomMemory: (v: boolean) => void;
}

export default function ProductForm({
  formData, setFormData, handleSubmit, resetForm, loading, activeTab,
  existingBrands, existingCategories, existingSockets, existingMemory, inventory,
  isCustomCategory, setIsCustomCategory, isCustomBrand, setIsCustomBrand,
  isCustomSocket, setIsCustomSocket, isCustomMemory, setIsCustomMemory
}: ProductFormProps) {

  // Helper to filter products for Prebuilt dropdowns
  const getOptionsFor = (cat: string) => inventory.filter(p => p.category === cat);

  // Helper for Arrays
  const updateGalleryImage = (idx: number, val: string) => {
    const updated = [...formData.gallery_urls];
    updated[idx] = val;
    setFormData({ ...formData, gallery_urls: updated });
  };
  const toggleSelection = (item: string, field: 'supported_motherboards' | 'supported_radiators') => {
    const list = formData[field] || [];
    const newList = list.includes(item) 
        ? list.filter((i: string) => i !== item) 
        : [...list, item];
    setFormData({ ...formData, [field]: newList });
  };

  return (
    <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 sticky top-28 shadow-xl">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="font-bold text-xl flex items-center gap-2">
                    {activeTab === "edit" ? <FaEdit className="text-brand-purple"/> : <FaPlus className="text-brand-purple"/>}
                    {activeTab === "edit" ? "Edit Product" : "Add New Product"}
            </h2>
            <button onClick={resetForm} className="text-xs bg-white/5 px-3 py-1 rounded hover:bg-white/10">Reset Form</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
            
            {/* 1. CLASSIFICATION */}
            <div className="space-y-2">
                <label className="text-[10px] uppercase text-brand-silver font-bold tracking-wider">Classification</label>
                {isCustomCategory ? (
                    <div className="p-3 bg-brand-purple/10 rounded border border-brand-purple/30 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-brand-purple font-bold">New Category</span>
                            <button type="button" onClick={() => setIsCustomCategory(false)} className="text-[10px] text-red-400 hover:underline">Cancel</button>
                        </div>
                        <input placeholder="ID (e.g. headphones)" className="w-full bg-[#121212] p-2 rounded border border-brand-purple text-white font-bold text-sm"
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value.toLowerCase()})} autoFocus />
                        <select className="w-full bg-[#121212] p-2 rounded border border-white/20 text-xs"
                            value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})}>
                            {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <select className="w-full bg-[#121212] p-3 rounded border border-white/10 text-white font-bold focus:border-brand-purple transition-colors"
                        value={formData.category} onChange={e => {
                            if(e.target.value === "NEW") { setIsCustomCategory(true); setFormData({...formData, category: ""}); } 
                            else { setFormData({...formData, category: e.target.value}); }
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
                <input placeholder="Breadcrumb Name (Optional)" className="w-full bg-[#121212] p-2 rounded border border-white/10 text-xs focus:border-brand-purple outline-none" 
                    value={formData.breadcrumb_name} onChange={e => setFormData({...formData, breadcrumb_name: e.target.value})} />
            </div>

            {/* PREBUILT SERIES */}
            {formData.category === 'prebuilt' && (
                <div className="grid grid-cols-2 gap-4 bg-brand-purple/5 p-3 rounded border border-brand-purple/20">
                    <select className="bg-transparent text-xs outline-none text-brand-purple font-bold" value={formData.series} onChange={e => setFormData({...formData, series: e.target.value})}>
                        <option value="">Select Series</option>{SERIES_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                    {formData.series !== 'signature' && (
                        <select className="bg-transparent text-xs outline-none text-white" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})}>
                            <option value="">Select Tier</option>{TIER_OPTS.map(t => <option key={t} value={t}>Level {t}</option>)}
                        </select>
                    )}
                </div>
            )}

            {/* 3. PRICING & WARRANTY */}
            <div className="space-y-3 bg-[#121212] p-3 rounded border border-white/5">
                {/* --- NEW NICKNAME FIELD --- */}
                <div className="bg-brand-purple/10 border border-brand-purple/20 p-2 rounded">
                    <label className="text-[10px] text-brand-purple uppercase font-bold block mb-1">Google Sheet Nickname (Sync ID)</label>
                    <input 
                        placeholder="e.g. 7800x3d" 
                        className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-white focus:border-brand-purple outline-none text-sm" 
                        value={formData.nickname} 
                        onChange={e => setFormData({...formData, nickname: e.target.value})} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative"><span className="absolute left-3 top-3 text-green-500">₹</span><input required type="number" placeholder="Selling Price" className="w-full bg-[#1A1A1A] p-3 pl-6 rounded border border-green-500/30 focus:border-green-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                    <div className="relative"><span className="absolute left-3 top-3 text-white/30">₹</span><input type="number" placeholder="MRP" className="w-full bg-[#1A1A1A] p-3 pl-6 rounded border border-white/10" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Warranty (e.g. 3 Years)" className="w-full bg-[#1A1A1A] p-3 rounded border border-white/10" value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})} />
                    {isCustomBrand ? (
                        <div className="relative"><input placeholder="New Brand" className="w-full bg-[#1A1A1A] p-3 rounded border border-brand-purple" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} /><button type="button" onClick={() => setIsCustomBrand(false)} className="absolute right-2 top-3 text-[10px] text-red-400 font-bold">CANCEL</button></div>
                    ) : (
                        <select className="w-full bg-[#1A1A1A] p-3 rounded border border-white/10" value={formData.brand} onChange={e => { if(e.target.value === "NEW") setIsCustomBrand(true); else setFormData({...formData, brand: e.target.value}); }}>
                            <option value="">Select Brand</option>{existingBrands.map(b => <option key={b} value={b}>{b}</option>)}<option value="NEW" className="text-brand-purple font-bold">+ Add Brand</option>
                        </select>
                    )}
                </div>
            </div>

            {/* 4. PAYMENT POLICY */}
            <div className="bg-[#121212] p-3 rounded border border-white/5">
                <label className="text-xs text-brand-silver font-bold uppercase mb-2 block">Payment Options</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['full_cod', 'partial_cod', 'no_cod'].map(mode => (
                        <label key={mode} className={`cursor-pointer p-3 rounded border text-xs font-bold text-center transition-all ${formData.cod_policy === mode ? 'bg-brand-purple/20 border-brand-purple text-white' : 'bg-[#1A1A1A] border-white/10 text-brand-silver'}`}>
                            <input type="radio" name="cod_policy" value={mode} className="hidden" checked={formData.cod_policy === mode} onChange={e => setFormData({...formData, cod_policy: e.target.value})} />
                            {mode === 'full_cod' ? 'Full COD' : mode === 'partial_cod' ? '10% Advance' : 'Online Only'}
                        </label>
                    ))}
                </div>
            </div>

            {/* 5. TECH SPECS & COMPATIBILITY (NEW) */}
            {formData.category !== 'prebuilt' && (
                <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                    <label className="text-xs text-brand-purple uppercase font-bold block">Technical Specs</label>
                    {formData.category !== 'os' && <input type="number" placeholder="Wattage (TDP)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.wattage} onChange={e => setFormData({...formData, wattage: e.target.value})} />}
                    
                    {/* Motherboard Form Factor */}
                    {formData.category === 'motherboard' && (
                        <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.form_factor} onChange={e => setFormData({...formData, form_factor: e.target.value})}>
                            <option value="">Select Form Factor</option>{FORM_FACTORS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    )}

                    {/* Cooler Size */}
                    {formData.category === 'cooler' && (
                        <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.radiator_size} onChange={e => setFormData({...formData, radiator_size: e.target.value})}>
                            <option value="">Select Radiator Size</option>{RADIATOR_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}

                    {/* Cabinet Compatibility */}
                    {formData.category === 'cabinet' && (
                        <div className="bg-[#1A1A1A] p-3 rounded border border-white/10 space-y-3">
                            <input type="number" placeholder="Max GPU Length (mm)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.max_gpu_length_mm} onChange={e => setFormData({...formData, max_gpu_length_mm: e.target.value})} />
                            <div>
                                <label className="text-[10px] text-brand-silver font-bold block mb-2">Supported Mobos</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FORM_FACTORS.map(f => (
                                        <label key={f} className="flex items-center gap-2 text-[10px] cursor-pointer text-white">
                                            <input type="checkbox" checked={(formData.supported_motherboards || []).includes(f)} onChange={() => toggleSelection(f, 'supported_motherboards')} className="accent-brand-purple"/> {f}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-brand-silver font-bold block mb-2">Supported Radiators</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {RADIATOR_SIZES.map(s => (
                                        <label key={s} className="flex items-center gap-2 text-[10px] cursor-pointer text-white">
                                            <input type="checkbox" checked={(formData.supported_radiators || []).includes(s)} onChange={() => toggleSelection(s, 'supported_radiators')} className="accent-brand-purple"/> {s}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Capacity & Standard Fields */}
                    {['ram', 'gpu', 'storage'].includes(formData.category) && (
                        <input placeholder="Capacity (e.g. 16GB)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                    )}
                    {formData.category === 'gpu' && <input type="number" placeholder="Length (mm)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.length_mm} onChange={e => setFormData({...formData, length_mm: e.target.value})} />}
                    
                    {/* Socket & Memory Dropdowns */}
                    {(['cpu', 'motherboard'].includes(formData.category)) && (
                        isCustomSocket ? (
                            <div className="flex gap-2"><input placeholder="Type Socket" className="w-full bg-[#1A1A1A] p-2 rounded border border-brand-purple text-xs" value={formData.socket} onChange={e => setFormData({...formData, socket: e.target.value})} /><button type="button" onClick={() => setIsCustomSocket(false)} className="text-red-400 text-xs">X</button></div>
                        ) : (
                            <select className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" value={formData.socket} onChange={e => { if(e.target.value==="NEW") setIsCustomSocket(true); else setFormData({...formData, socket: e.target.value}); }}>
                                <option value="">Select Socket</option>{existingSockets.map(s => <option key={s} value={s}>{s}</option>)}<option value="NEW" className="text-brand-purple">+ Add New</option>
                            </select>
                        )
                    )}
                    {(['ram', 'motherboard', 'gpu'].includes(formData.category)) && (
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
                </div>
            )}

            {/* PREBUILT RECIPE */}
            {formData.category === 'prebuilt' && (
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
                            value={formData[field.key]} onChange={e => setFormData({...formData, [field.key]: e.target.value})}>
                            <option value="">Select {field.label}</option>
                            {getOptionsFor(field.cat).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    ))}
                </div>
            )}

            {/* 6. IMAGES */}
            <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                <label className="text-xs text-brand-purple uppercase font-bold flex items-center gap-2"><FaImage/> Image Gallery</label>
                <input placeholder="Main Image Path..." className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs" 
                    value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                
                {formData.gallery_urls.map((url: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                        <input placeholder={`Image ${idx + 2} Path...`} className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs"
                            value={url} onChange={(e) => updateGalleryImage(idx, e.target.value)} />
                        <button type="button" onClick={() => setFormData({...formData, gallery_urls: formData.gallery_urls.filter((_:any, i:number) => i !== idx)})} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><FaTrash size={10}/></button>
                    </div>
                ))}
                <button type="button" onClick={() => setFormData({ ...formData, gallery_urls: [...formData.gallery_urls, ""] })} className="w-full py-2 border border-dashed border-white/20 text-xs text-brand-silver hover:text-white hover:border-brand-purple transition-colors rounded">
                    + Add Another Image
                </button>
            </div>

            {/* 7. DESCRIPTION */}
            <div className="bg-[#121212] p-3 rounded border border-white/5 space-y-3">
                <textarea placeholder="Product Description..." className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-20"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <textarea placeholder="Features (One per line)" className="w-full bg-[#1A1A1A] p-2 rounded border border-white/10 text-xs h-20"
                    value={formData.features_text} onChange={e => setFormData({...formData, features_text: e.target.value})} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2 p-3 bg-white/5 rounded">
                <input type="checkbox" className="w-4 h-4 accent-brand-purple" checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} />
                <span className="text-sm text-brand-silver">Available in Stock</span>
            </label>

            <button disabled={loading} className="w-full bg-brand-purple py-4 rounded font-bold hover:bg-white hover:text-black transition-all shadow-lg text-lg">
                {loading ? "Processing..." : activeTab === "edit" ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
            </button>
        </form>
    </div>
  );
}