import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// POST { id, distributor_price?, nickname?, name?, breadcrumb_name? } → update a
// product's cost and/or its names. We NEVER write `price` (the trigger derives it
// from distributor_price) nor `configurator_name` (a trigger mirrors it from
// breadcrumb_name) nor `listing_created`. Admin-gated, service role.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const patch: any = {};
  if (body?.distributor_price !== undefined) {
    const d = Number(body.distributor_price);
    if (!Number.isFinite(d) || d <= 0) return NextResponse.json({ error: "distributor_price must be greater than zero." }, { status: 400 });
    patch.distributor_price = d;
  }
  for (const k of ["nickname", "name", "breadcrumb_name"] as const) {
    if (body?.[k] !== undefined) {
      const v = String(body[k]).trim();
      if (!v) return NextResponse.json({ error: `${k} cannot be empty.` }, { status: 400 });
      patch[k] = v;
    }
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { data, error } = await admin
    .from("products")
    .update(patch)
    .eq("id", id)
    .select("id, name, nickname, breadcrumb_name, category, price, distributor_price")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ product: data });
}
