import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET → the live pricing config so the quotation builder can replicate
// compute_selling_price() exactly (percent-only variant forces the floor to 0).
//   { defaultPct, rules: { <category>: { pct, floor } } }
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [{ data: rules }, { data: setting }] = await Promise.all([
    admin.from("category_margin_rules").select("category, margin_pct, min_margin"),
    admin.from("app_settings").select("value").eq("key", "default_margin_pct").maybeSingle(),
  ]);

  const map: Record<string, { pct: number | null; floor: number }> = {};
  for (const r of rules || []) {
    map[r.category] = { pct: r.margin_pct != null ? Number(r.margin_pct) : null, floor: Number(r.min_margin) || 0 };
  }
  const defaultPct = setting?.value != null ? Number(setting.value) : 0.05;

  return NextResponse.json({ defaultPct, rules: map });
}
