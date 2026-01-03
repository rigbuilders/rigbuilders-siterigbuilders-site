import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend"; 
import OrderConfirmationEmail from "@/components/emails/OrderConfirmationEmail"; 
import { generateOrderId, generateInvoiceId } from "@/lib/id-generator";

// --- CONFIGURATION ---
const COMPANY_STATE = "Punjab"; // Used to decide IGST vs CGST/SGST
const CURRENT_YEAR_SHORT = "25"; // Hardcoded '25' for 2025

// Initialize Clients
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

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


// --- HELPER: TAX CALCULATOR ---
function calculateTax(totalAmount: number, userState: string) {
  // Formula: Taxable = Total / 1.18
  const taxableValue = parseFloat((totalAmount / 1.18).toFixed(2));
  const totalGST = parseFloat((totalAmount - taxableValue).toFixed(2));
  
  // Check if state matches Company State (Punjab)
  // We use simple string matching (ensure your address form has consistent state names)
  const isInterState = userState?.trim().toLowerCase() !== COMPANY_STATE.toLowerCase();

  return {
    taxableValue,
    totalGST,
    cgst: isInterState ? 0 : parseFloat((totalGST / 2).toFixed(2)),
    sgst: isInterState ? 0 : parseFloat((totalGST / 2).toFixed(2)),
    igst: isInterState ? totalGST : 0,
    gstRate: "18%"
  };
}

export async function POST(req: Request) {
  console.log("🚨 PAYMENT VERIFICATION STARTED"); 

  try {
    const body = await req.json();
    const { 
      orderCreationId, razorpayPaymentId, razorpaySignature, 
      cartItems, userId, totalAmount, shippingAddress, 
      isGuest, autoSaveAddress 
    } = body;

    // --- STEP 1: VERIFY SIGNATURE (Security Check) ---
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      console.error("❌ Invalid Signature");
      return NextResponse.json({ msg: "failure", error: "Invalid Signature" }, { status: 400 });
    }

    // --- STEP 2: GENERATE IDs & TAX (STANDARDIZED) ---
    // A. Detect Order Type
    let orderType: 'PB' | 'CB' | 'CS' = 'CS'; // Default to Parts (RB-CS)

    // Check for Prebuilt
    const hasPrebuilt = cartItems.some((i: any) => i.category === 'prebuilt' || i.name?.toLowerCase().includes('prebuilt'));
    // Check for Custom Rig
    const hasCustom = cartItems.some((i: any) => i.name?.toLowerCase().includes('custom pc'));

    if (hasPrebuilt) { 
        orderType = 'PB'; 
    } else if (hasCustom) { 
        orderType = 'CB'; 
    }

    // B. Generate IDs using Shared Library (Source of Truth)
    const displayId = await generateOrderId(supabaseAdmin, orderType);
    const invoiceNo = await generateInvoiceId(supabaseAdmin);

    // C. Calculate Tax (Keep existing logic)
    const taxDetails = calculateTax(totalAmount, shippingAddress.state);

    // --- STEP 3: HANDLE USER (Fail-Safe) ---
    let finalUserId = userId; 
    let accountCreated = false;

    try {
      if (isGuest) {
          const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', shippingAddress.email).single();
          if (existingUser) {
              finalUserId = existingUser.id;
          } else {
              const tempPassword = Math.random().toString(36).slice(-8) + "Rig!23"; 
              const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                  email: shippingAddress.email,
                  password: tempPassword,
                  email_confirm: true,
                  user_metadata: { full_name: shippingAddress.fullName, phone: shippingAddress.phone }
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
    }

    // --- STEP 4: SAVE ORDER (CRITICAL PRIORITY) ---
    console.log("💾 Attempting to save order to DB...");
    const dbUserId = (finalUserId && finalUserId !== 'guest') ? finalUserId : null;

    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            // 1. User & ID
            user_id: dbUserId,
            display_id: displayId,    // Now uses your specific format (RB-PB-25-001)
            invoice_no: invoiceNo,    // ✅ NEW: Sequential Invoice Number
            
            // 2. Contact Info
            full_name: shippingAddress.fullName,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            
            // 3. Address Data
            shipping_address: shippingAddress,
            address: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.pincode}`,

            // 4. Financials
            total_amount: totalAmount,
            tax_details: taxDetails,  // ✅ NEW: Stores Breakdown (CGST/SGST)
            payment_mode: "ONLINE",   // ✅ NEW: Hardcoded as requested
            
            // 5. Details
            items: cartItems,
            status: 'paid',
            payment_id: razorpayPaymentId,
            order_id: orderCreationId
        })
        .select()
        .single();

    if (orderError) {
        console.error("❌ FATAL DB ERROR:", orderError);
        throw new Error(`Database Insert Failed: ${orderError.message}`);
    }

    console.log("✅ Order Saved:", order.id);

    // --- STEP 5: SEND EMAIL (Fire & Forget) ---
    if (resend) {
        resend.emails.send({
            from: 'Rig Builders Support <support@rigbuilders.in>',
            to: [shippingAddress.email],
            bcc: ['rigbuilders123@gmail.com'], // Receive copy
            subject: `Invoice: ${invoiceNo}`,
            react: OrderConfirmationEmail({
                order: order,         // Pass full order object for Invoice ID
                taxDetails: taxDetails // Pass calculated tax for Invoice Table
            }),
        }).then(() => console.log("📧 Email sent"))
          .catch((e) => console.error("📧 Email failed:", e));
    }
    
    // --- STEP 6: AUTO-SAVE ADDRESS ---
    if (autoSaveAddress && finalUserId && finalUserId !== 'guest') {
        void supabaseAdmin.from('user_addresses').insert({
            user_id: finalUserId,
            full_name: shippingAddress.fullName,
            phone: shippingAddress.phone,
            address_line1: shippingAddress.addressLine1,
            address_line2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
            label: "Home (Auto-Saved)", 
            is_default: true
        }).then(({ error }) => {
            if (error) console.error("⚠️ Failed to auto-save address:", error);
            else console.log("🏠 Address auto-saved successfully");
        });
    }

    // --- STEP 7: RETURN SUCCESS ---
    return NextResponse.json({
      msg: "success",
      orderId: order.id,
      displayId: invoiceNo, // Return Invoice ID to show on success screen
      accountCreated: accountCreated,
    });

  } catch (error: any) {
    console.error("🚨 GLOBAL HANDLER ERROR:", error);
    return NextResponse.json({ msg: "failure", error: error.message }, { status: 500 });
  }
}