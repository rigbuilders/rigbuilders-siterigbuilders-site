// app/admin/products/components/ProductList.tsx
"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronRight, FaEdit, FaTrash, FaCopy } from "react-icons/fa";
import { GROUPS, BASE_CATEGORY_MAP } from "../constants";

interface ProductListProps {
  products: any[];
  existingCategories: any[];
  handleEditClick: (p: any) => void;
  handleDelete: (id: string) => void;
  handleCloneClick: (p: any) => void; // <--- NEW PROP
}

export default function ProductList({ 
  products, existingCategories, handleEditClick, handleDelete, handleCloneClick 
}: ProductListProps) {
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ components: true, desktops: true, accessories: true });
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleGroup = (grp: string) => setExpandedGroups(prev => ({ ...prev, [grp]: !prev[grp] }));
  const toggleCat = (cat: string) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  // Tree Generation
  const organizedProducts = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, any[]>>> = {};

    products.forEach(p => {
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

  return (
    <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 min-h-[500px]">
        <h2 className="font-bold text-xl mb-6">Product Inventory</h2>
        
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

                        {/* CATEGORIES */}
                        {expandedGroups[group.id] && (
                            <div className="p-4 space-y-4 bg-black/20 border-t border-white/5">
                                {Object.entries(organizedProducts[group.id]).map(([catName, brands]) => (
                                    <div key={catName} className="ml-2">
                                        <div 
                                            className="flex items-center gap-2 text-sm font-bold text-white mb-3 cursor-pointer select-none"
                                            onClick={() => toggleCat(catName)}
                                        >
                                            {expandedCats[catName] ? <FaChevronDown size={10} className="text-brand-silver"/> : <FaChevronRight size={10} className="text-brand-silver"/>}
                                            <span className="uppercase tracking-wider">{catName}</span>
                                        </div>

                                        {/* BRANDS & PRODUCTS */}
                                        {expandedCats[catName] && (
                                            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {Object.entries(brands).map(([brandName, brandProducts]) => (
                                                    <div key={brandName} className="bg-[#1A1A1A] border border-white/5 rounded p-3">
                                                        <h4 className="text-xs text-brand-silver font-bold mb-2 uppercase border-b border-white/5 pb-1">{brandName}</h4>
                                                        <div className="space-y-2">
                                                            {brandProducts.map((p) => (
                                                                <div key={p.id} className="flex justify-between items-center group/item hover:bg-white/5 p-1 rounded transition-colors">
                                                                    <div className="flex items-center gap-2 max-w-[70%]">
                                                                        {p.cod_policy === 'no_cod' && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Online Only" />}
                                                                        {p.cod_policy === 'partial_cod' && <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" title="10% Advance" />}
                                                                        
                                                                        <span className={`text-xs truncate ${!p.in_stock ? 'text-white/30 line-through' : 'text-white'}`}>{p.name}</span>
                                                                    </div>
                                                                    
                                                                    <div className="flex gap-2 opacity-50 group-hover/item:opacity-100">
                                                                        <button onClick={() => handleCloneClick(p)} className="text-blue-400 hover:text-white" title="Clone"><FaCopy size={12}/></button>
                                                                        <button onClick={() => handleEditClick(p)} className="text-brand-purple hover:text-white" title="Edit"><FaEdit size={12}/></button>
                                                                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-400" title="Delete"><FaTrash size={12}/></button>
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
  );
}