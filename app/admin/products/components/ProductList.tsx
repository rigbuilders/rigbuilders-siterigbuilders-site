"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronRight, FaEdit, FaTrash, FaPlus, FaLayerGroup, FaTag, FaSearch, FaBoxOpen } from "react-icons/fa";

interface ProductListProps {
  products: any[];
  existingCategories: any[];
  handleEditClick: (p: any) => void;
  handleDelete: (id: string) => void;
  handleVariantClick: (p: any) => void;
}

// Helper to make category names look nice (cpu -> Processors)
const formatCategory = (cat: string) => {
    const map: Record<string, string> = {
        cpu: "Processors", gpu: "Graphics Cards", ram: "Memory", motherboard: "Motherboards",
        storage: "Storage", psu: "Power Supply", cabinet: "Cabinets", cooler: "Cooling",
        monitor: "Monitors", keyboard: "Keyboards", mouse: "Mice", combo: "Combos",
        prebuilt: "Pre-Built Systems"
    };
    return map[cat.toLowerCase()] || cat.toUpperCase();
};

export default function ProductList({ 
  products, existingCategories, handleEditClick, handleDelete, handleVariantClick 
}: ProductListProps) {
  
  const [search, setSearch] = useState("");
  // Track expanded states for Categories and Variant Families
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => setExpandedCategories(p => ({...p, [cat]: !p[cat]}));
  const toggleFamily = (id: string) => setExpandedFamilies(p => ({...p, [id]: !p[id]}));

  // --- CORE LOGIC: Grouping & Filtering ---
  const organizedData = useMemo(() => {
    // 1. Structure: Category -> { Families: {id: [items]}, Singles: [items] }
    const hierarchy: Record<string, { families: Record<string, any[]>, singles: any[] }> = {};

    products.forEach(p => {
        // Filter by Search (Check Name, Nickname, or ID)
        const matchesSearch = search === "" || 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.nickname?.toLowerCase().includes(search.toLowerCase()) ||
            p.specs?.variant_label?.toLowerCase().includes(search.toLowerCase());

        // If search is active, we only want to keep items that match OR belong to a family that has a match.
        // For simplicity in UI, if a parent/child matches, we show the whole family.
        
        const cat = p.category || "Uncategorized";
        if (!hierarchy[cat]) hierarchy[cat] = { families: {}, singles: [] };

        if (p.variant_group_id) {
            if (!hierarchy[cat].families[p.variant_group_id]) {
                hierarchy[cat].families[p.variant_group_id] = [];
            }
            hierarchy[cat].families[p.variant_group_id].push(p);
        } else {
            hierarchy[cat].singles.push(p);
        }
    });

    // 2. Filter & Sort
    const finalTree: typeof hierarchy = {};

    Object.keys(hierarchy).forEach(cat => {
        const sourceFamilies = hierarchy[cat].families;
        const sourceSingles = hierarchy[cat].singles;
        
        // Filter Families: Keep family if ANY member matches search
        const validFamilies: Record<string, any[]> = {};
        Object.entries(sourceFamilies).forEach(([famId, items]) => {
            const familyMatches = items.some(i => 
                i.name.toLowerCase().includes(search.toLowerCase()) || 
                (i.specs?.variant_label || "").toLowerCase().includes(search.toLowerCase())
            );
            
            if (search === "" || familyMatches) {
                // Sort variants by date inside the family
                validFamilies[famId] = items.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }
        });

        // Filter Singles
        const validSingles = sourceSingles.filter(i => 
            search === "" || i.name.toLowerCase().includes(search.toLowerCase())
        );

        // Only add category if it has content
        if (Object.keys(validFamilies).length > 0 || validSingles.length > 0) {
            finalTree[cat] = { families: validFamilies, singles: validSingles };
        }
    });

    return finalTree;
  }, [products, search]);

  // Helper to render a row (Reusable)
  const ProductRow = ({ p, isChild = false }: { p: any, isChild?: boolean }) => (
    <div className={`flex justify-between items-center p-3 rounded border transition-all ${isChild ? "bg-black/40 border-white/5 ml-6 border-l-2 border-l-brand-purple/20" : "bg-[#1A1A1A] border-white/10 hover:border-brand-purple/30"}`}>
        <div className="flex items-center gap-3 overflow-hidden">
            {/* Image Thumbnail */}
            <div className="w-10 h-10 bg-black rounded border border-white/10 shrink-0 overflow-hidden relative">
                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="text-[8px] text-white/20 flex items-center justify-center h-full">IMG</div>}
            </div>
            
            <div className="flex flex-col truncate pr-4">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold truncate text-white`}>{p.name}</span>
                    {!p.in_stock && <span className="text-[9px] bg-red-500/20 text-red-500 px-1 rounded uppercase">OOS</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-brand-silver">
                    <span className="uppercase tracking-wider">{p.brand}</span>
                    {/* SHOW THE VARIANT LABEL IF IT EXISTS */}
                    {p.specs?.variant_label && (
                        <span className="bg-brand-purple/20 text-brand-purple border border-brand-purple/20 px-2 rounded flex items-center gap-1">
                            <FaTag size={8} /> {p.specs.variant_label}
                        </span>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-white mr-2">₹{p.price.toLocaleString("en-IN")}</span>
            
            {/* ACTION BUTTONS */}
            <div className="flex gap-1">
                {/* Variant Button: Only show on parents or singles (prevents nesting variants inside variants) */}
                {!isChild && (
                    <button onClick={(e) => { e.stopPropagation(); handleVariantClick(p); }} className="p-2 hover:bg-brand-purple hover:text-white text-brand-purple rounded transition-colors" title="Create Variant">
                        <FaPlus size={12} />
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleEditClick(p); }} className="p-2 hover:bg-blue-500 hover:text-white text-blue-500 rounded transition-colors" title="Edit">
                    <FaEdit size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-2 hover:bg-red-500 hover:text-white text-red-500 rounded transition-colors" title="Delete">
                    <FaTrash size={12} />
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="bg-[#121212] p-6 rounded-xl border border-white/5 min-h-[600px] flex flex-col gap-6">
        
        {/* HEADER & SEARCH */}
        <div className="border-b border-white/10 pb-6 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-xl text-white flex items-center gap-2">
                    <FaBoxOpen className="text-brand-purple" /> Inventory Manager
                </h2>
                <div className="text-xs text-brand-silver">
                    Total: <span className="text-white font-bold">{products.length}</span> Items
                </div>
            </div>
            
            {/* Search Input */}
            <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-white/30" />
                <input 
                    placeholder="Search by Name, SKU, or Variant..." 
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 text-sm text-white focus:border-brand-purple outline-none transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
        
        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[75vh]">
            
            {Object.keys(organizedData).length === 0 && (
                <div className="text-center py-10 text-white/20 italic border border-dashed border-white/10 rounded">
                    No products found matching &quot;{search}&quot;
                </div>
            )}

            {/* LOOP THROUGH CATEGORIES (CPU, GPU, ETC) */}
            {Object.entries(organizedData).sort().map(([cat, data]) => {
                const isCatOpen = expandedCategories[cat] !== false; // Default open
                const familyCount = Object.keys(data.families).length;
                const singleCount = data.singles.length;

                return (
                    <div key={cat} className="mb-4">
                        {/* Category Header */}
                        <div 
                            onClick={() => toggleCategory(cat)}
                            className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded cursor-pointer select-none transition-colors mb-2"
                        >
                            <span className={`text-brand-purple transition-transform duration-300 ${isCatOpen ? "rotate-90" : ""}`}><FaChevronRight size={10} /></span>
                            <span className="font-bold text-sm text-white uppercase tracking-widest flex-grow">{formatCategory(cat)}</span>
                            <span className="text-[10px] bg-black/50 px-2 py-1 rounded text-brand-silver border border-white/5">
                                {familyCount + singleCount} Items
                            </span>
                        </div>

                        {/* Category Content */}
                        {isCatOpen && (
                            <div className="pl-2 space-y-3 border-l border-white/5 ml-2">
                                
                                {/* 1. VARIANT FAMILIES */}
                                {Object.entries(data.families).map(([groupId, groupItems]) => {
                                    const parent = groupItems[0]; 
                                    const isFamOpen = expandedFamilies[groupId];

                                    return (
                                        <div key={groupId} className="border border-white/10 rounded-lg overflow-hidden bg-[#151515]">
                                            {/* Family Header */}
                                            <div 
                                                onClick={() => toggleFamily(groupId)}
                                                className="flex justify-between items-center p-3 cursor-pointer hover:bg-white/5 transition-colors bg-brand-purple/5 border-l-2 border-brand-purple"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`text-brand-purple transition-transform duration-300 ${isFamOpen ? "rotate-90" : ""}`}><FaChevronRight size={10}/></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white flex items-center gap-2">
                                                            <FaLayerGroup className="text-brand-purple"/> {parent.name.split('(')[0]} <span className="text-white/40 text-xs font-normal">(Family)</span>
                                                        </span>
                                                        <span className="text-[10px] text-brand-silver">{groupItems.length} Variants</span>
                                                    </div>
                                                </div>
                                                
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleVariantClick(parent); }}
                                                    className="text-[10px] bg-brand-purple text-white px-3 py-1.5 rounded font-bold uppercase hover:bg-white hover:text-black transition-all"
                                                >
                                                    + Add Variant
                                                </button>
                                            </div>

                                            {/* Variants Inside Family */}
                                            {isFamOpen && (
                                                <div className="p-2 space-y-2 bg-black/20 border-t border-white/5">
                                                    {groupItems.map(p => <ProductRow key={p.id} p={p} isChild={true} />)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* 2. SINGLE ITEMS */}
                                {data.singles.map(p => <ProductRow key={p.id} p={p} />)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
}