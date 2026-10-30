import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";
import { sendAwbWhatsApp } from "@/lib/shipping/awbNotify";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// POST { orderId, awb } → WhatsApps the AWB + tracking link to the customer.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { orderId, awb } = await req.json();
    if (!orderId || !awb) return NextResponse.json({ error: "orderId and awb are required." }, { status: 400 });

    const { data: order } = await admin
      .from("orders")
      .select("id, display_id, phone, shipping_address")
      .eq("id", orderId)
      .single();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const result = await sendAwbWhatsApp(admin, order, awb);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, to: result.to });
  } catch (e: any) {
    console.error("notify-awb error:", e);
    return NextResponse.json({ error: e.message || "Server error." }, { status: 500 });
  }
}
