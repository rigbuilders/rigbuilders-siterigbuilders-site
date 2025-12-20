import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Initialize Supabase Admin (Required to create users without them confirming email first)
// You need the SERVICE_ROLE_KEY for this, not the Anon key.
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

    // 1. VERIFY SIGNATURE (Security Check)
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      return NextResponse.json({ msg: "failure", error: "Invalid Signature" }, { status: 400 });
    }

    // 2. HANDLE USER ACCOUNT (Guest vs Registered)
    let finalUserId = userId;
    let accountCreated = false;
    let tempPassword = "";

    if (isGuest) {
        // Check if user already exists (just in case)
        const { data: existingUser } = await supabaseAdmin
            .from('users') // Or check auth.users depending on your setup
            .select('id')
            .eq('email', shippingAddress.email)
            .single();

        if (existingUser) {
            finalUserId = existingUser.id;
        } else {
            // --- AUTO-CREATE ACCOUNT LOGIC ---
            
            // A. Generate a random temporary password
            tempPassword = Math.random().toString(36).slice(-8) + "Rig!23"; 
            
            // B. Create User in Supabase Auth
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: shippingAddress.email,
                password: tempPassword,
                email_confirm: true, // Auto-confirm email so they can login immediately
                user_metadata: {
                    full_name: shippingAddress.fullName,
                    phone: shippingAddress.phone
                }
            });

            if (createError) {
                console.error("Auto-Account Creation Failed:", createError);
                // We don't stop the order, but we log the error. 
                // The order will be assigned to 'guest' or null.
            } else {
                finalUserId = newUser.user.id;
                accountCreated = true;
                
                // TODO: TRIGGER EMAIL HERE (SendGrid / Resend)
                // Send 'tempPassword' to user's email: shippingAddress.email
                console.log(`[EMAIL TRIGGER] Send password ${tempPassword} to ${shippingAddress.email}`);
            }
        }
    }

    // 3. CREATE ORDER IN DATABASE
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            user_id: finalUserId !== 'guest' ? finalUserId : null, // Link to user if exists
            customer_email: shippingAddress.email, // Always save email for contact
            amount: totalAmount,
            items: cartItems, // JSON of products
            shipping_address: shippingAddress, // JSON of address
            payment_id: razorpayPaymentId,
            order_id: orderCreationId,
            status: 'paid',
            display_id: `ORD-${Math.floor(100000 + Math.random() * 900000)}` // Friendly ID like ORD-837192
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // 4. AUTO-SAVE ADDRESS (If requested and user exists)
    if (autoSaveAddress && finalUserId !== 'guest') {
        const { error: addrError } = await supabaseAdmin
            .from('user_addresses')
            .insert({
                user_id: finalUserId,
                label: "Home (Auto-Saved)",
                full_name: shippingAddress.fullName,
                phone: shippingAddress.phone,
                address_line1: shippingAddress.addressLine1,
                address_line2: shippingAddress.addressLine2,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
                is_default: true
            });
            // We ignore duplicates/errors here to not block the main flow
    }

    return NextResponse.json({
      msg: "success",
      orderId: order.id,
      displayId: order.display_id,
      accountCreated: accountCreated, // Frontend uses this to show the specific Toast
    });

  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ msg: "failure", error: error.message }, { status: 500 });
  }
}