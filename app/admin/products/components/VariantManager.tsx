"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaEdit, FaTag, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "sonner";

interface VariantManagerProps {
  groupId: string;
  currentId: string;
  onSwitchVariant: (product: any) => void;
  onClose: () => void;
}

export default function VariantManager({ groupId, currentId, onSwitchVariant, onClose }: VariantManagerProps) {
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState("");

  useEffect(() => {
    fetchVariants();
  }, [groupId]);

  const fetchVariants = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, specs, image_url, in_stock')
      .eq('variant_group_id', groupId)
      .order('created_at', { ascending: true });
    
    if (data) setVariants(data);
    setLoading(false);
  };

  // --- SAVE THE "BUTTON NAME" ---
  const saveLabel = async (productId: string, oldSpecs: any) => {
    const newSpecs = { ...oldSpecs, variant_label: tempLabel };
    
    const { error } = await supabase
        .from('products')
        .update({ specs: newSpecs })
        .eq('id', productId);

    if (!error) {
        toast.success("Label Updated");
        // Update local state without refetching
        setVariants(prev => prev.map(p => p.id === productId ? { ...p, specs: newSpecs } : p));
        setEditingLabel(null);
    } else {
        toast.error("Failed to update label");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#121212] rounded-t-xl">
            <div>
                <h3 className="font-orbitron font-bold text-xl text-white">VARIANT MANAGER</h3>
                <p className="text-xs text-brand-silver mt-1">Manage siblings for Group ID: <span className="font-mono text-brand-purple">{groupId.slice(0,8)}...</span></p>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <FaTimes size={20} />
            </button>
        </div>

        {/* LIST */}
        <div className="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {loading ? (
                <div className="text-center text-brand-silver py-10">Loading Variants...</div>
            ) : (
                variants.map((p) => {
                    const isCurrent = p.id === currentId;
                    const label = p.specs?.variant_label || "No Label";

                    return (
                        <div key={p.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${isCurrent ? "bg-brand-purple/10 border-brand-purple" : "bg-black/20 border-white/5 hover:border-white/20"}`}>
                            
                            {/* IMAGE */}
                            <div className="w-12 h-12 bg-black rounded border border-white/10 shrink-0 overflow-hidden">
                                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white/20">IMG</div>}
                            </div>

                            {/* DETAILS */}
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-white truncate max-w-[200px]">{p.name}</span>
                                    {isCurrent && <span className="text-[9px] bg-brand-purple text-white px-2 py-0.5 rounded font-bold uppercase">Editing Now</span>}
                                </div>
                                <div className="text-xs text-brand-silver">₹{p.price} • {p.in_stock ? "In Stock" : "Out of Stock"}</div>
                            </div>

                            {/* LABEL EDITOR */}
                            <div className="w-40">
                                <label className="text-[9px] text-brand-silver uppercase font-bold block mb-1">Button Label</label>
                                {editingLabel === p.id ? (
                                    <div className="flex gap-1">
                                        <input 
                                            autoFocus
                                            className="w-full bg-black border border-brand-purple rounded px-2 py-1 text-xs text-white outline-none"
                                            value={tempLabel}
                                            onChange={(e) => setTempLabel(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveLabel(p.id, p.specs)}
                                        />
                                        <button onClick={() => saveLabel(p.id, p.specs)} className="text-green-500 hover:text-green-400"><FaCheck /></button>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => { setEditingLabel(p.id); setTempLabel(p.specs?.variant_label || ""); }}
                                        className="flex items-center gap-2 cursor-pointer group"
                                    >
                                        <span className={`text-xs font-mono px-2 py-1 rounded border border-dashed border-white/20 ${!p.specs?.variant_label ? "text-yellow-500 bg-yellow-500/10" : "text-white bg-white/5"}`}>
                                            {label}
                                        </span>
                                        <FaEdit className="text-brand-silver opacity-0 group-hover:opacity-100 transition-opacity text-xs" />
                                    </div>
                                )}
                            </div>

                            {/* ACTION: SWITCH */}
                            {!isCurrent && (
                                <button 
                                    onClick={() => { onSwitchVariant(p); onClose(); }}
                                    className="px-4 py-2 bg-white/5 hover:bg-white hover:text-black border border-white/10 rounded text-xs font-bold uppercase transition-all"
                                >
                                    Edit This
                                </button>
                            )}
                        </div>
                    );
                })
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-[#121212] border-t border-white/10 rounded-b-xl text-center">
            <p className="text-[10px] text-brand-silver">
                Tip: The "Button Label" is exactly what customers will see in the variant selector (e.g. "White", "32GB").
            </p>
        </div>

      </div>
    </div>
  );
}