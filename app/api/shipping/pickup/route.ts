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
    const { orderId, date, time, closeTime, pieces, weightKg, remarks } = await req.json();
    if (!date) return NextResponse.json({ error: "Pickup date is required." }, { status: 400 });
    const { data: order } = await admin.from("orders").select("id, display_id, packed_weight_kg, box_dimensions, shipping_address").eq("id", orderId).single();

    const finalPieces = pieces || order?.box_dimensions?.pieces || 1;
    const finalWeight = weightKg || Number(order?.packed_weight_kg) || 1;

    const result = await registerPickup({
      date,
      time,
      closeTime,
      remarks,
      pieces: finalPieces,
      weightKg: finalWeight,
    });

    await admin.from("orders").update({ pickup_token: result.token, pickup_date: date }).eq("id", orderId);
    await admin.from("order_events").insert({ order_id: orderId, status: "ready_to_ship", source: "bluedart", note: `Pickup booked for ${date} (token ${result.token})` });

    // Record in the unified pickups log (idempotent on token).
    await admin.from("pickups").upsert({
      token: result.token,
      pickup_date: date,
      ready_time: time || null,
      close_time: closeTime || null,
      pieces: finalPieces,
      weight_kg: finalWeight,
      location_label: order?.shipping_address?.city || null,
      order_display_id: order?.display_id || null,
      status: "scheduled",
      source: "app",
      remarks: remarks || null,
    }, { onConflict: "token" });

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
    await admin.from("pickups").update({ status: "cancelled" }).eq("token", token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
