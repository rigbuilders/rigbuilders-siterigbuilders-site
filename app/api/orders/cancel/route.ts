import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Never cache — this mutates data.
export const dynamic = "force-dynamic";

// Service-role client (bypasses RLS). We enforce ownership manually below.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Statuses a customer is allowed to self-cancel (before the build ships).
const CANCELLABLE = ["pending", "paid", "payment_received", "processing", "procurement"];

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Identify the caller from their access token.
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }
    const userId = userData.user.id;

    const { orderId, table } = await req.json();
    if (!orderId || !["orders", "orders_ops"].includes(table)) {
      return NextResponse.json({ error: "Bad request." }, { status: 400 });
    }

    const ownerCol = table === "orders_ops" ? "customer_id" : "user_id";

    // Load the order and confirm the caller owns it.
    const { data: order, error: loadErr } = await supabaseAdmin
      .from(table)
      .select(`id, status, ${ownerCol}`)
      .eq("id", orderId)
      .single();

    if (loadErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if ((order as any)[ownerCol] !== userId) {
      return NextResponse.json({ error: "This order is not yours." }, { status: 403 });
    }

    const status = (order.status || "").toLowerCase();
    if (!CANCELLABLE.includes(status)) {
      return NextResponse.json(
        { error: "This order can no longer be cancelled — it has already progressed. Please contact support." },
        { status: 409 }
      );
    }

    // Soft-cancel: set status to 'cancelled' (matches the .neq('status','cancelled')
    // filters used across the app). We do NOT hard-delete order records.
    const { error: updErr } = await supabaseAdmin
      .from(table)
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Best-effort: log a status event if the table exists.
    supabaseAdmin
      .from("order_events")
      .insert({ order_id: orderId, status: "cancelled", note: "Cancelled by customer", source: "customer" })
      .then(({ error }) => { if (error) console.warn("order_events log skipped:", error.message); });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Cancel order error:", e);
    return NextResponse.json({ error: e.message || "Server error." }, { status: 500 });
  }
}
