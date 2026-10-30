import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";
import { generateWaybill, isConfigured } from "@/lib/shipping/bluedart";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// POST { orderId } → generates a Blue Dart waybill (AWB + label), stores the
// AWB on the order, and returns { awb, labelBase64 } so the admin can print.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isConfigured()) return NextResponse.json({ error: "Blue Dart not configured." }, { status: 400 });

  try {
    // Optional overrides from the Shipment console; otherwise derive from the order.
    const { orderId, drop, parcel, shipper } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId is required." }, { status: 400 });

    const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.awb_number) return NextResponse.json({ ok: true, awb: order.awb_number, note: "AWB already exists." });

    const sa = order.shipping_address || {};
    const dims = order.box_dimensions || {};
    const isCOD = parcel?.isCOD !== undefined
      ? !!parcel.isCOD
      : (order.payment_mode === "COD" || Number(order.pending_amount) > 0);

    const consignee = {
      name: drop?.name || sa.fullName || sa.name || order.full_name || "Customer",
      addressLine1: drop?.addressLine1 || sa.addressLine1 || sa.address || order.address || "",
      addressLine2: drop?.addressLine2 || sa.addressLine2 || "",
      city: drop?.city || sa.city || "",
      state: drop?.state || sa.state || "",
      pincode: drop?.pincode || sa.pincode || "",
      phone: drop?.phone || sa.phone || order.phone || "",
      email: drop?.email || sa.email || order.email || "",
    };

    const declaredValue = parcel?.declaredValue !== undefined ? Number(parcel.declaredValue) : (Number(order.total_amount) || 0);

    const result = await generateWaybill({
      displayId: order.display_id,
      consignee,
      weightKg: Number(parcel?.weightKg) || Number(order.packed_weight_kg) || 1,
      dims: {
        l: Number(parcel?.l) || Number(dims.l) || 40,
        w: Number(parcel?.w) || Number(dims.w) || 40,
        h: Number(parcel?.h) || Number(dims.h) || 40,
        pieces: Number(parcel?.pieces) || Number(dims.pieces) || 1,
      },
      declaredValue,
      isCOD,
      codAmount: isCOD ? (Number(parcel?.codAmount) || Number(order.pending_amount) || declaredValue || 0) : 0,
      shipper: shipper && shipper.pincode ? shipper : undefined,
    });

    await admin.from("orders").update({
      awb_number: result.awb,
      shipping_address: { ...sa, tracking_id: result.awb },
      // Persist the packed parcel so later steps / re-prints have it.
      packed_weight_kg: Number(parcel?.weightKg) || order.packed_weight_kg || null,
      box_dimensions: parcel ? { l: Number(parcel.l) || null, w: Number(parcel.w) || null, h: Number(parcel.h) || null, pieces: Number(parcel.pieces) || 1 } : dims,
    }).eq("id", orderId);

    await admin.from("order_events").insert({
      order_id: orderId,
      status: "ready_to_ship",
      source: "bluedart",
      note: `AWB generated: ${result.awb}`,
    });

    return NextResponse.json({ ok: true, awb: result.awb, labelBase64: result.labelBase64 || null });
  } catch (e: any) {
    console.error("Waybill error:", e);
    return NextResponse.json({ error: e.message || "Waybill generation failed." }, { status: 500 });
  }
}
