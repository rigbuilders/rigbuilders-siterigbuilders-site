import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function MobileVariantSelector({ currentProductId, variantGroupId, currentSpecs }: any) {
    const router = useRouter();
    const [siblings, setSiblings] = useState<any[]>([]);

    useEffect(() => {
        if (variantGroupId) supabase.from('products').select('id, specs, in_stock').eq('variant_group_id', variantGroupId).then(({ data }) => { if (data) setSiblings(data); });
    }, [variantGroupId]);

    if (!variantGroupId || siblings.length <= 1) return null;

    const handleSwitch = (key: string, value: string) => {
        const target = siblings.find(p => p.specs?.[key] === value) || siblings[0];
        if (target.id !== currentProductId) router.push(`/m/product/${target.id}`);
    };

    const renderBtns = (key: string, label: string) => {
        const opts = Array.from(new Set(siblings.map(p => p.specs?.[key]).filter(Boolean)));
        if (opts.length === 0) return null;
        return (
            <div className="mb-4">
                <label className="text-[10px] uppercase text-brand-silver font-bold tracking-widest mb-2 block">{label}</label>
                <div className="flex flex-wrap gap-2">
                    {opts.map((opt: any) => (
                        <button key={opt} onClick={() => handleSwitch(key, opt)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${currentSpecs[key] === opt ? "bg-brand-purple text-white border-brand-purple shadow-[0_0_10px_rgba(78,44,139,0.3)]" : "bg-[#1A1A1A] text-brand-silver border-white/10"}`}>
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="mb-6 pt-4 border-t border-white/10">
            {renderBtns('variant_label', 'Select Option')}
            {renderBtns('capacity', 'Capacity / Size')}
            {renderBtns('color', 'Color / Theme')}
            {renderBtns('style', 'Style')}
        </div>
    );
}