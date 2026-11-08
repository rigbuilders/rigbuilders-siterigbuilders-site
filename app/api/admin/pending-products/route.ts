import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET → products a distributor submitted that still need research. These are
// drafts (listing_status='draft', listing_created='false') tagged with a
// generated_notes marker, so they can never reach the storefront until an admin
// completes and publishes them in the listing pipeline.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await admin
    .from("products")
    .select("id, name, breadcrumb_name, nickname, category, brand, distributor_price, mrp, in_stock, listing_status, created_at")
    .eq("generated_notes", "added by a distributor — needs research")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pending: data || [] });
}
