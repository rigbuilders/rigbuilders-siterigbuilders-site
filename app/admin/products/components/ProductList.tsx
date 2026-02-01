"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronRight, FaEdit, FaTrash, FaPlus, FaLayerGroup, FaTag } from "react-icons/fa";
import { GROUPS, BASE_CATEGORY_MAP } from "../constants";

interface ProductListProps {
  products: any[];
  existingCategories: any[];
  handleEditClick: (p: any) => void;
  handleDelete: (id: string) => void;
  handleVariantClick: (p: any) => void;
}

export default function ProductList({ 
  products, existingCategories, handleEditClick, handleDelete, handleVariantClick 
}: ProductListProps) {
  
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  // --- 1. GROUPING LOGIC (The Magic) ---
  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const singles: any[] = [];

    products.forEach(p => {
        if (p.variant_group_id) {
            if (!groups[p.variant_group_id]) groups[p.variant_group_id] = [];
            groups[p.variant_group_id].push(p);
        } else {
            singles.push(p);
        }
    });

    // Sort variants inside groups by creation date
    Object.keys(groups).forEach(k => groups[k].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));

    return { groups, singles };
  }, [products]);

  const toggleFamily = (id: string) => setExpandedFamilies(p => ({...p, [id]: !p[id]}));

  // Helper to render a row
  const ProductRow = ({ p, isChild = false }: { p: any, isChild?: boolean }) => (
    <div className={`flex justify-between items-center p-3 rounded border transition-all ${isChild ? "bg-black/40 border-white/5 ml-6" : "bg-[#1A1A1A] border-white/10 hover:border-brand-purple/30"}`}>
        <div className="flex items-center gap-3 overflow-hidden">
            {/* Image Thumbnail */}
            <div className="w-10 h-10 bg-black rounded border border-white/10 shrink-0 overflow-hidden relative">
                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="text-[8px] text-white/20 flex items-center justify-center h-full">IMG</div>}
            </div>
            
            <div className="flex flex-col truncate">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold truncate text-white`}>{p.name}</span>
                    {!p.in_stock && <span className="text-[9px] bg-red-500/20 text-red-500 px-1 rounded uppercase">OOS</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-brand-silver">
                    <span className="uppercase">{p.category}</span>
                    {/* SHOW THE LABEL IF IT EXISTS */}
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
                {/* Variant Button: Only show on parents or singles */}
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
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <h2 className="font-bold text-xl text-white">Inventory Manager</h2>
            <div className="text-xs text-brand-silver">
                {Object.keys(groupedProducts.groups).length} Families • {groupedProducts.singles.length} Singles
            </div>
        </div>
        
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[80vh]">
            
            {/* 1. VARIANT FAMILIES */}
            {Object.entries(groupedProducts.groups).map(([groupId, groupItems]) => {
                const parent = groupItems[0]; // First item acts as representative
                const isOpen = expandedFamilies[groupId];

                return (
                    <div key={groupId} className="border border-white/10 rounded-lg overflow-hidden bg-[#151515]">
                        {/* Family Header */}
                        <div 
                            onClick={() => toggleFamily(groupId)}
                            className="flex justify-between items-center p-3 cursor-pointer hover:bg-white/5 transition-colors bg-brand-purple/5 border-l-2 border-brand-purple"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`text-brand-purple transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}><FaChevronRight size={12}/></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white flex items-center gap-2">
                                        <FaLayerGroup className="text-brand-purple"/> {parent.name.split('(')[0]} <span className="text-white/40 text-xs font-normal">(Family)</span>
                                    </span>
                                    <span className="text-[10px] text-brand-silver">{groupItems.length} Variants</span>
                                </div>
                            </div>
                            
                            {/* Quick Add to Family */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleVariantClick(parent); }}
                                className="text-xs bg-brand-purple text-white px-3 py-1.5 rounded font-bold uppercase hover:bg-white hover:text-black transition-all"
                            >
                                + Add Variant
                            </button>
                        </div>

                        {/* Variants List */}
                        {isOpen && (
                            <div className="p-2 space-y-2 bg-black/20 border-t border-white/5">
                                {groupItems.map(p => <ProductRow key={p.id} p={p} isChild={true} />)}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 2. SINGLE ITEMS */}
            {groupedProducts.singles.map(p => <ProductRow key={p.id} p={p} />)}
            
            {products.length === 0 && <div className="text-center py-10 text-white/20 italic">No products found.</div>}
        </div>
    </div>
  );
}