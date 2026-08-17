import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";
import { registerPickup, cancelPickup, isConfigured } from "@/lib/shipping/bluedart";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// POST { orderId, date, pieces?, weightKg? } → books a Blue Dart pickup and stores
// the token/date on the order. Admin-only (Build Station).
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isConfigured()) return NextResponse.json({ error: "Blue Dart not configured." }, { status: 400 });

  try {
    const { orderId, date, pieces, weightKg } = await req.json();
    const { data: order } = await admin.from("orders").select("id, packed_weight_kg, box_dimensions").eq("id", orderId).single();

    const result = await registerPickup({
      date,
      pieces: pieces || order?.box_dimensions?.pieces || 1,
      weightKg: weightKg || Number(order?.packed_weight_kg) || 1,
    });

    await admin.from("orders").update({ pickup_token: result.token, pickup_date: date }).eq("id", orderId);
    await admin.from("order_events").insert({ order_id: orderId, status: "ready_to_ship", source: "bluedart", note: `Pickup booked for ${date} (token ${result.token})` });

    return NextResponse.json({ ok: true, token: result.token });
  } catch (e: any) {
    console.error("Pickup error:", e);
    return NextResponse.json({ error: e.message || "Pickup booking failed" }, { status: 500 });
  }
}

// DELETE ?token=... → cancel a booked pickup. Admin-only.
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
    await cancelPickup(token);
    await admin.from("orders").update({ pickup_token: null, pickup_date: null }).eq("pickup_token", token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
