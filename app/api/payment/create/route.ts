import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import { computeCartTotals, splitPayment, PricingError } from "@/lib/pricing";

// Admin client (server-only) used to read authoritative product prices.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(request: Request) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const body = await request.json();
    const { cartItems, couponCode, userId, isAdvance } = body;

    // SECURITY: never trust a client-supplied amount. Recompute from the DB.
    const totals = await computeCartTotals(
      supabaseAdmin,
      cartItems,
      couponCode,
      userId && userId !== "guest" ? userId : null
    );

    const mode = isAdvance ? "PARTIAL_COD" : "ONLINE";
    const { amountPaid } = splitPayment(totals.total, mode);

    if (amountPaid <= 0) {
      return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amountPaid * 100), // rupees -> paise
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(2, 10),
    });

    // Return the order plus the server-computed figures so the client can display
    // (but not dictate) them.
    return NextResponse.json({
      ...order,
      serverTotal: totals.total,
      serverAmountPayable: amountPaid,
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Payment Create Error:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}
