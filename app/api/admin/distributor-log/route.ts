import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET → recent distributor_price_log entries, enriched with product name and
// the distributor's email. This table is RLS-closed to every client on purpose
// (it holds every supplier's cost history), so it is ONLY ever read here, with
// the service role. Never expose it to the browser directly.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: logs, error } = await admin
    .from("distributor_price_log")
    .select("product_id, changed_by, old_price, new_price, old_in_stock, new_in_stock, created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const productIds = Array.from(new Set((logs || []).map((l) => l.product_id).filter(Boolean)));
  const changerIds = Array.from(new Set((logs || []).map((l) => l.changed_by).filter(Boolean)));

  const [{ data: products }, { data: distributors }] = await Promise.all([
    productIds.length ? admin.from("products").select("id, name, breadcrumb_name, nickname").in("id", productIds) : Promise.resolve({ data: [] as any[] }),
    changerIds.length ? admin.from("distributor_users").select("user_id, email, label").in("user_id", changerIds) : Promise.resolve({ data: [] as any[] }),
  ]);

  const nameById = new Map((products || []).map((p: any) => [p.id, p.breadcrumb_name || p.name || p.nickname || p.id]));
  const whoById = new Map((distributors || []).map((d: any) => [d.user_id, d.label || d.email || d.user_id]));

  const entries = (logs || []).map((l) => ({
    product: nameById.get(l.product_id) || l.product_id,
    who: whoById.get(l.changed_by) || l.changed_by || "—",
    old_price: l.old_price,
    new_price: l.new_price,
    old_in_stock: l.old_in_stock,
    new_in_stock: l.new_in_stock,
    created_at: l.created_at,
  }));

  return NextResponse.json({ entries });
}
