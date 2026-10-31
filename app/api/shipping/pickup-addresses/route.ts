import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FIELDS = ["label", "contact_name", "phone", "address_line1", "address_line2", "city", "state", "pincode", "origin_area", "is_default"] as const;
function pick(body: any) {
  const row: any = {};
  for (const f of FIELDS) if (body[f] !== undefined) row[f] = body[f];
  return row;
}

// GET → all saved pickup addresses (default first).
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await admin
    .from("pickup_addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addresses: data || [] });
}

// POST → create a pickup address.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({}));
  const row = pick(body);
  if (!row.label || !row.phone || !row.address_line1 || !row.city || !row.state || !row.pincode) {
    return NextResponse.json({ error: "label, phone, address_line1, city, state and pincode are required." }, { status: 400 });
  }
  const { data, error } = await admin.from("pickup_addresses").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

// PATCH → update a pickup address by id.
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { data, error } = await admin.from("pickup_addresses").update(pick(body)).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

// DELETE ?id=... → remove a pickup address.
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { error } = await admin.from("pickup_addresses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
