"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa";

interface VariantSelectorProps {
    currentProductId: string;
    variantGroupId: string | null;
    currentSpecs: any;
}

export default function VariantSelector({ currentProductId, variantGroupId, currentSpecs }: VariantSelectorProps) {
    const router = useRouter();
    const [siblings, setSiblings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!variantGroupId) {
            setLoading(false);
            return;
        }

        const fetchSiblings = async () => {
            const { data } = await supabase
                .from('products')
                .select('id, specs, in_stock')
                .eq('variant_group_id', variantGroupId);
            
            if (data) setSiblings(data);
            setLoading(false);
        };

        fetchSiblings();
    }, [variantGroupId]);

    if (!variantGroupId || loading || siblings.length <= 1) return null;

    // --- LOGIC: Handle Switching ---
    const handleSwitch = (key: string, value: string) => {
        // Attempt to find a variant that matches the new selection 
        // while keeping other current attributes if possible
        const exactMatch = siblings.find(p => 
            p.specs?.[key] === value && 
            (key !== 'color' ? p.specs?.color === currentSpecs.color : true) &&
            (key !== 'capacity' ? p.specs?.capacity === currentSpecs.capacity : true) &&
            (key !== 'variant_label' ? true : true) // Label is usually unique, so it overrides others
        );

        const target = exactMatch || siblings.find(p => p.specs?.[key] === value);

        if (target && target.id !== currentProductId) {
            router.push(`/product/${target.id}`);
        }
    };

    // --- EXTRACT OPTIONS ---
    const labels = Array.from(new Set(siblings.map(p => p.specs?.variant_label).filter(Boolean)));
    const colors = Array.from(new Set(siblings.map(p => p.specs?.color).filter(Boolean)));
    const capacities = Array.from(new Set(siblings.map(p => p.specs?.capacity || p.specs?.vram).filter(Boolean)));
    const styles = Array.from(new Set(siblings.map(p => p.specs?.style).filter(Boolean))); 
    const latencies = Array.from(new Set(siblings.map(p => p.specs?.latency).filter(Boolean))); 

    return (
        <div className="mb-8 space-y-5 border-t border-white/10 pt-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* 1. GENERIC OPTION SELECTOR (Uses "Button Label" from Admin) */}
            {labels.length > 0 && (
                <div>
                    <label className="text-[10px] uppercase text-brand-silver font-bold tracking-wider mb-3 block">
                        Model / Option
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {labels.map((label: any) => {
                            const isSelected = currentSpecs.variant_label === label;
                            return (
                                <button
                                    key={label}
                                    onClick={() => handleSwitch('variant_label', label)}
                                    className={`px-4 py-2 text-xs font-bold rounded border transition-all ${
                                        isSelected 
                                            ? "bg-brand-purple text-white border-brand-purple shadow-[0_0_10px_rgba(124,58,237,0.3)]" 
                                            : "bg-[#1A1A1A] text-brand-silver border-white/10 hover:border-white/40 hover:text-white"
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. COLOR SELECTOR */}
            {colors.length > 0 && (
                <div>
                    <label className="text-[10px] uppercase text-brand-silver font-bold tracking-wider mb-3 block">
                        Color: <span className="text-white">{currentSpecs.color || "Selected"}</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color: any) => {
                            const isSelected = currentSpecs.color === color;
                            const isActive = siblings.some(s => s.specs?.color === color && s.in_stock);
                            let bg = color.toLowerCase();
                            if(bg === 'white') bg = '#f3f4f6';
                            if(bg === 'grey' || bg === 'gray') bg = '#4b5563';

                            return (
                                <button
                                    key={color}
                                    onClick={() => handleSwitch('color', color)}
                                    title={color}
                                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all relative ${isSelected ? "border-brand-purple scale-110 shadow-[0_0_15px_rgba(124,58,237,0.4)]" : "border-white/10 hover:border-white/50"} ${!isActive && "opacity-50 grayscale"}`}
                                    style={{ backgroundColor: bg }}
                                >
                                    {isSelected && <FaCheck className={`text-[10px] ${bg.includes('white') ? 'text-black' : 'text-white'}`} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. CAPACITY / SIZE SELECTOR */}
            {capacities.length > 0 && (
                <div>
                    <label className="text-[10px] uppercase text-brand-silver font-bold tracking-wider mb-3 block">
                        Capacity / Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {capacities.map((cap: any) => {
                            const isSelected = (currentSpecs.capacity === cap || currentSpecs.vram === cap);
                            return (
                                <button
                                    key={cap}
                                    onClick={() => handleSwitch('capacity', cap)}
                                    className={`px-4 py-2 text-xs font-bold rounded border transition-all ${
                                        isSelected 
                                            ? "bg-brand-purple text-white border-brand-purple shadow-[0_0_10px_rgba(124,58,237,0.3)]" 
                                            : "bg-[#1A1A1A] text-brand-silver border-white/10 hover:border-white/40 hover:text-white"
                                    }`}
                                >
                                    {cap}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. STYLE / TYPE SELECTOR */}
            {styles.length > 0 && (
                <div>
                    <label className="text-[10px] uppercase text-brand-silver font-bold tracking-wider mb-3 block">
                        Style / Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {styles.map((style: any) => {
                            const isSelected = currentSpecs.style === style;
                            return (
                                <button
                                    key={style}
                                    onClick={() => handleSwitch('style', style)}
                                    className={`px-4 py-2 text-xs font-bold rounded border transition-all ${
                                        isSelected 
                                            ? "bg-brand-purple text-white border-brand-purple" 
                                            : "bg-[#1A1A1A] text-brand-silver border-white/10 hover:border-white/40 hover:text-white"
                                    }`}
                                >
                                    {style}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5. LATENCY SELECTOR */}
            {latencies.length > 0 && (
                <div>
                    <label className="text-[10px] uppercase text-brand-silver font-bold tracking-wider mb-3 block">
                        CAS Latency
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {latencies.map((lat: any) => (
                            <button
                                key={lat}
                                onClick={() => handleSwitch('latency', lat)}
                                className={`px-4 py-2 text-xs font-bold rounded border transition-all ${
                                    currentSpecs.latency === lat 
                                        ? "bg-brand-purple text-white border-brand-purple" 
                                        : "bg-[#1A1A1A] text-brand-silver border-white/10 hover:border-white/40 hover:text-white"
                                }`}
                            >
                                {lat}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}