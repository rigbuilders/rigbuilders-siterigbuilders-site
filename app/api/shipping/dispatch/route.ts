import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";
import { generateWaybill, isConfigured } from "@/lib/shipping/bluedart";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// POST { orderId } → generates a Blue Dart AWB + label, stores them, sets status
// 'dispatched'. Admin-only. If Blue Dart isn't configured, returns 400 so the
// admin can fall back to entering an AWB manually.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!isConfigured()) {
    return NextResponse.json({ error: "Blue Dart not configured. Enter the AWB manually." }, { status: 400 });
  }

  try {
    const { orderId } = await req.json();
    const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
    if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const addr = order.shipping_address || {};
    const isCOD = order.payment_mode === "COD" || order.payment_mode === "PARTIAL_COD";
    const dims = order.box_dimensions || { l: 40, w: 30, h: 30, pieces: 1 };

    const wb = await generateWaybill({
      displayId: order.display_id,
      consignee: {
        name: addr.fullName || order.full_name,
        addressLine1: addr.addressLine1 || order.address || "",
        addressLine2: addr.addressLine2 || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || "",
        phone: addr.phone || order.phone || "",
        email: addr.email || order.email || "",
      },
      weightKg: Number(order.packed_weight_kg) || 1,
      dims,
      declaredValue: Number(order.total_amount) || 0,
      isCOD,
      codAmount: isCOD ? (Number(order.pending_amount) || Number(order.total_amount) || 0) : 0,
    });

    await admin.from("orders").update({
      carrier: "bluedart",
      awb_number: wb.awb,
      label_url: wb.labelBase64 ? `data:application/pdf;base64,${wb.labelBase64}` : order.label_url,
      status: "dispatched",
      shipping_status: "dispatched",
    }).eq("id", orderId);

    await admin.from("order_events").insert({
      order_id: orderId, status: "dispatched", source: "bluedart",
      note: `AWB ${wb.awb} generated`,
    });

    return NextResponse.json({ ok: true, awb: wb.awb, label: wb.labelBase64 ? true : false });
  } catch (e: any) {
    console.error("Dispatch error:", e);
    return NextResponse.json({ error: e.message || "Dispatch failed" }, { status: 500 });
  }
}

// PATCH { orderId, awb } → manual AWB entry fallback (no Blue Dart call).
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { orderId, awb } = await req.json();
    if (!awb) return NextResponse.json({ error: "AWB required" }, { status: 400 });
    await admin.from("orders").update({ awb_number: awb, carrier: "bluedart", status: "dispatched", shipping_status: "dispatched" }).eq("id", orderId);
    await admin.from("order_events").insert({ order_id: orderId, status: "dispatched", source: "admin", note: `AWB ${awb} entered manually` });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
