import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FIELDS = ["token", "pickup_date", "ready_time", "close_time", "pieces", "weight_kg", "location_label", "order_display_id", "status", "source", "remarks"] as const;
function pick(body: any) {
  const row: any = {};
  for (const f of FIELDS) if (body[f] !== undefined) row[f] = body[f];
  return row;
}

// Derive a pickup status from an order's shipment status.
function orderPickupStatus(status?: string): string {
  if (status === "cancelled") return "cancelled";
  if (["shipped", "in_transit", "out_for_delivery", "delivered", "rto"].includes(status || "")) return "completed";
  return "scheduled";
}

// GET → every pickup: rows from the pickups table UNION any order that has a
// pickup_token but no matching row (so historical app bookings aren't missed).
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [{ data: rows }, { data: orders }] = await Promise.all([
    admin.from("pickups").select("*"),
    admin.from("orders")
      .select("display_id, pickup_token, pickup_date, packed_weight_kg, box_dimensions, status, shipping_address, full_name")
      .not("pickup_token", "is", null),
  ]);

  const byToken = new Map<string, any>();
  const list: any[] = [];
  for (const r of rows || []) {
    list.push({ ...r, _kind: "logged" });
    if (r.token) byToken.set(String(r.token), r);
  }
  for (const o of orders || []) {
    if (o.pickup_token && byToken.has(String(o.pickup_token))) continue; // already logged
    const sa = o.shipping_address || {};
    const bd = o.box_dimensions || {};
    list.push({
      id: `order:${o.display_id}`,
      token: o.pickup_token,
      pickup_date: o.pickup_date,
      ready_time: null, close_time: null,
      pieces: bd.pieces || null,
      weight_kg: o.packed_weight_kg || null,
      location_label: sa.city || null,
      order_display_id: o.display_id,
      status: orderPickupStatus(o.status),
      source: "app",
      remarks: null,
      _kind: "order", // not editable here; manage via the Shipment console
    });
  }

  list.sort((a, b) => {
    const da = a.pickup_date ? new Date(a.pickup_date).getTime() : 0;
    const db = b.pickup_date ? new Date(b.pickup_date).getTime() : 0;
    return db - da;
  });

  return NextResponse.json({ pickups: list });
}

// POST → log a pickup (default source 'portal' for manual entries).
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({}));
  const row = pick(body);
  if (!row.pickup_date) return NextResponse.json({ error: "pickup_date is required." }, { status: 400 });
  if (!row.source) row.source = "portal";
  const { data, error } = await admin.from("pickups").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickup: data });
}

// PATCH → update a logged pickup by id.
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { data, error } = await admin.from("pickups").update(pick(body)).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickup: data });
}

// DELETE ?id=... → remove a logged pickup (order-derived entries can't be deleted here).
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { error } = await admin.from("pickups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
