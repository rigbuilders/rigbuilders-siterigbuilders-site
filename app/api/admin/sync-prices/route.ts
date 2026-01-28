import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Admin Client (Bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { secret, data } = await req.json();

    // 1. Security Check
    if (secret !== process.env.SYNC_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!data || !Array.isArray(data)) {
        return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
    }

    let updatedCount = 0;
    const errors = [];

    // 2. Iterate and Update
    for (const item of data) {
        // Item format: { nickname: "7800x3d", price: 32000, stock: "In Stock" }
        if (!item.nickname) continue;

        const isStock = item.stock?.toLowerCase() === "in stock" || item.stock === true;

        const { error } = await supabaseAdmin
            .from('products')
            .update({ 
                price: item.price, 
                in_stock: isStock 
            })
            .eq('nickname', item.nickname); // <--- THE MAGIC LINK

        if (!error) {
            updatedCount++;
        } else {
            errors.push({ nick: item.nickname, err: error.message });
        }
    }

    return NextResponse.json({ 
        success: true, 
        updated: updatedCount, 
        errors: errors.length > 0 ? errors : null 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}