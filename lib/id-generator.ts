// lib/id-generator.ts
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generates the next Order ID: RB-{TYPE}-{YY}-{XXX}
 * Example: RB-PB-26-001
 */
export const generateOrderId = async (supabase: SupabaseClient, type: 'PB' | 'CB' | 'CS') => {
    const counterName = `rb_${type.toLowerCase()}`; // e.g., 'rb_pb'
    const year = new Date().getFullYear().toString().slice(-2); // "26"

    try {
        // 1. Get current value
        const { data: existing } = await supabase
            .from('counters')
            .select('*')
            .eq('name', counterName)
            .single();

        let nextVal = 1;

        if (existing) {
            nextVal = existing.current_value + 1;
            // 2. Increment in DB
            await supabase
                .from('counters')
                .update({ current_value: nextVal })
                .eq('name', counterName);
        } else {
            // 3. Create if missing
            await supabase
                .from('counters')
                .insert([{ name: counterName, current_value: nextVal }]);
        }

        // 4. Format: RB-PB-26-001
        const seqStr = String(nextVal).padStart(3, '0');
        return `RB-${type}-${year}-${seqStr}`;

    } catch (err) {
        console.error("ID Generation Failed:", err);
        return `RB-${type}-${year}-${Date.now().toString().slice(-3)}`;
    }
};

/**
 * Generates the next Invoice Number: INV-RB-{YY}-{XXX}
 * Example: INV-RB-26-001
 */
export const generateInvoiceId = async (supabase: SupabaseClient) => {
    const year = new Date().getFullYear().toString().slice(-2);
    
    try {
        const { data: existing } = await supabase
            .from('counters')
            .select('*')
            .eq('name', 'invoice')
            .single();

        let nextVal = 1;

        if (existing) {
            nextVal = existing.current_value + 1;
            await supabase.from('counters').update({ current_value: nextVal }).eq('name', 'invoice');
        } else {
            await supabase.from('counters').insert([{ name: 'invoice', current_value: nextVal }]);
        }

        return `INV-RB-${year}-${String(nextVal).padStart(3, '0')}`;

    } catch (err) {
        return `INV-ERR-${Date.now()}`;
    }
};