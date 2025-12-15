import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // <--- CHANGED: Using Admin Client
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { 
      orderCreationId, 
      razorpayPaymentId, 
      razorpaySignature, 
      cartItems, 
      userId, 
      totalAmount, 
      shippingAddress 
    } = await request.json();

    // 1. SECURITY CHECK: Verify Signature
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      return NextResponse.json({ error: "Transaction not legit!" }, { status: 400 });
    }

    // --- PAYMENT IS CONFIRMED REAL. NOW WE SAVE TO DB ---

    // 2. Create the Main Order Entry in OPS
    const orderDisplayId = `RB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Guest Info Logic: Ensure we handle missing user ID for guest checkouts
    const finalCustomerId = userId && userId !== 'guest' ? userId : null;

    // IMPORTANT: Using 'supabaseAdmin' here bypasses RLS policies
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders_ops')
      .insert({
        order_display_id: orderDisplayId,
        customer_id: finalCustomerId, 
        source: 'website',
        status: 'payment_received',
        total_amount: totalAmount,
        payment_status: 'paid',
        guest_info: shippingAddress,
        note: `Pay ID: ${razorpayPaymentId}`
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. RECIPE EXPLOSION: Convert Cart to Procurement Items
    const procurementRows = [];

    for (const item of cartItems) {
      // SCENARIO A: It's a Pre-built (Fetch Recipe)
      if (item.category === 'prebuilt') {
          // Use Admin client for reading products too, just to be safe
          const { data: productData } = await supabaseAdmin
              .from('products')
              .select('specs')
              .eq('id', item.id)
              .single();
              
          if (productData && productData.specs) {
              const specs = productData.specs;
              // Map specs to procurement rows
              const parts = [
                  { cat: 'cpu', name: specs["Processor"] },
                  { cat: 'gpu', name: specs["Graphics Card"] },
                  { cat: 'mobo', name: specs["Motherboard"] },
                  { cat: 'ram', name: specs["Memory"] },
                  { cat: 'storage', name: specs["Storage"] },
                  { cat: 'psu', name: specs["Power Supply"] },
                  { cat: 'cooler', name: specs["Cooling"] },
                  { cat: 'cabinet', name: specs["Cabinet"] },
              ];

              parts.forEach(part => {
                  if (part.name) {
                      procurementRows.push({
                          order_id: orderData.id,
                          product_name: part.name,
                          category: part.cat,
                          status: 'pending', 
                          distributor_name: null,
                          cost_price: 0
                      });
                  }
              });
          }
      } 
      // SCENARIO B: Regular Component
      else {
          procurementRows.push({
              order_id: orderData.id,
              product_name: item.name,
              sku: item.id,
              category: item.category,
              status: 'pending',
              distributor_name: null,
              cost_price: 0
          });
      }
    }

    // 4. Bulk Insert (Using Admin Client)
    if (procurementRows.length > 0) {
      await supabaseAdmin.from('procurement_items').insert(procurementRows);
    }

    return NextResponse.json({ 
        msg: "success", 
        orderId: orderData.id, 
        displayId: orderDisplayId 
    });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}