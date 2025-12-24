import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend"; 
import OrderConfirmationEmail from "@/components/emails/OrderConfirmationEmail"; 

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Initialize Resend (Safe Mode)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

// Initialize Supabase Admin (Bypasses Row Level Security)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  console.log("🚨 PAYMENT VERIFICATION STARTED"); 

  try {
    const body = await req.json();
    const { 
      orderCreationId, 
      razorpayPaymentId, 
      razorpaySignature, 
      cartItems, 
      userId, 
      totalAmount, 
      shippingAddress, 
      isGuest,
      autoSaveAddress
    } = body;

    // --- STEP 1: VERIFY SIGNATURE (Security Check) ---
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      console.error("❌ Invalid Signature");
      return NextResponse.json({ msg: "failure", error: "Invalid Signature" }, { status: 400 });
    }

    // --- STEP 2: HANDLE USER (Fail-Safe) ---
    // We wrap this in try/catch so if user creation fails, we still save the order as Guest
    let finalUserId = userId; 
    let accountCreated = false;

    try {
      if (isGuest) {
          // Check if email already exists
          const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('email', shippingAddress.email)
              .single();

          if (existingUser) {
              finalUserId = existingUser.id;
          } else {
              // Create new user silently
              const tempPassword = Math.random().toString(36).slice(-8) + "Rig!23"; 
              const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                  email: shippingAddress.email,
                  password: tempPassword,
                  email_confirm: true,
                  user_metadata: {
                      full_name: shippingAddress.fullName,
                      phone: shippingAddress.phone
                  }
              });

              if (!createError && newUser.user) {
                  finalUserId = newUser.user.id;
                  accountCreated = true;
              } else {
                  console.error("⚠️ User creation failed (continuing as guest):", createError);
              }
          }
      }
    } catch (userError) {
       console.error("⚠️ User Logic Crashed (continuing as guest):", userError);
       // We ignore the error and proceed to save the order anyway
    }

    // --- STEP 3: SAVE ORDER (CRITICAL PRIORITY) ---
    console.log("💾 Attempting to save order to DB...");
    const displayId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Ensure finalUserId is valid for DB (convert 'guest' string to null)
    const dbUserId = (finalUserId && finalUserId !== 'guest') ? finalUserId : null;

    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            // 1. User & ID
            user_id: dbUserId,
            display_id: displayId,
            
            // 2. Contact Info (MISSING BEFORE)
            full_name: shippingAddress.fullName,
            email: shippingAddress.email,
            phone: shippingAddress.phone, // ✅ ADDED: Matches 'phone' column in DB
            
            // 3. Address Data
            // We save the full JSON object to 'shipping_address'
            shipping_address: shippingAddress,
            // We ALSO save a simple string to 'address' to satisfy that column
            address: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.pincode}`, // ✅ ADDED

            // 4. Order Details
            total_amount: totalAmount,
            items: cartItems,
            status: 'paid',
            
            // 5. Payment References
            payment_id: razorpayPaymentId,
            order_id: orderCreationId
        })
        .select()
        .single();

    if (orderError) {
        console.error("❌ FATAL DB ERROR:", orderError);
        // If DB fails, we MUST throw error so client knows
        throw new Error(`Database Insert Failed: ${orderError.message}`);
    }

    console.log("✅ Order Saved:", order.id);

    // --- STEP 4: SEND EMAIL (Fire & Forget) ---
    // We do NOT await this. We let it run in background.
    if (resend) {
        resend.emails.send({
            from: 'Rig Builders Support <support@rigbuilders.in>',
            to: [shippingAddress.email],
            subject: `Order Confirmed: ${displayId}`,
            react: OrderConfirmationEmail({
                customerName: shippingAddress.fullName,
                orderId: displayId,
                orderItems: cartItems,
                totalAmount: totalAmount,
            }),
        }).then(() => console.log("📧 Email sent"))
          .catch((e) => console.error("📧 Email failed:", e));
    }

    // --- STEP 5: RETURN SUCCESS ---
    return NextResponse.json({
      msg: "success",
      orderId: order.id,
      displayId: order.display_id,
      accountCreated: accountCreated,
    });

  } catch (error: any) {
    console.error("🚨 GLOBAL HANDLER ERROR:", error);
    return NextResponse.json({ msg: "failure", error: error.message }, { status: 500 });
  }
}