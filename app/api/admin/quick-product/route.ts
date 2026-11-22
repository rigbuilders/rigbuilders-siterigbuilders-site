import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// POST { nickname, category, distributor_price } → create a draft product writing
// ONLY the nickname + distributor_price (+ category, needed for the margin rule).
// We never write `price` — the DB triggers derive the real selling price from the
// cost. The one-time selling price used on a quotation is NOT saved here; it stays
// on the quotation only. Admin-gated, service role.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const nickname = (body?.nickname || "").trim();
  const category = (body?.category || "").trim();
  const distributor_price = Number(body?.distributor_price);
  if (!nickname) return NextResponse.json({ error: "A part name is required." }, { status: 400 });
  if (!Number.isFinite(distributor_price) || distributor_price <= 0) {
    return NextResponse.json({ error: "A valid distributor price is required." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("products")
    .insert({
      nickname,
      name: nickname,
      category: category || null,
      brand: "",
      distributor_price,            // cost — the trigger derives price from this
      in_stock: true,
      listing_status: "draft",
      listing_created: "false",
      auto_generated: false,
      generated_notes: "added via quotation — needs research",
    })
    .select("id, name, nickname, category, price, distributor_price")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
