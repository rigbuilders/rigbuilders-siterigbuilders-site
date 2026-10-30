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
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId is required." }, { status: 400 });

    const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.awb_number) return NextResponse.json({ ok: true, awb: order.awb_number, note: "AWB already exists." });

    const sa = order.shipping_address || {};
    const dims = order.box_dimensions || {};
    const isCOD = order.payment_mode === "COD" || Number(order.pending_amount) > 0;

    const result = await generateWaybill({
      displayId: order.display_id,
      consignee: {
        name: sa.fullName || sa.name || order.full_name || "Customer",
        addressLine1: sa.addressLine1 || sa.address || order.address || "",
        addressLine2: sa.addressLine2 || "",
        city: sa.city || "",
        state: sa.state || "",
        pincode: sa.pincode || "",
        phone: sa.phone || order.phone || "",
        email: sa.email || order.email || "",
      },
      weightKg: Number(order.packed_weight_kg) || 1,
      dims: {
        l: Number(dims.l) || 40,
        w: Number(dims.w) || 40,
        h: Number(dims.h) || 40,
        pieces: Number(dims.pieces) || 1,
      },
      declaredValue: Number(order.total_amount) || 0,
      isCOD,
      codAmount: isCOD ? (Number(order.pending_amount) || Number(order.total_amount) || 0) : 0,
    });

    await admin.from("orders").update({
      awb_number: result.awb,
      shipping_address: { ...sa, tracking_id: result.awb },
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
