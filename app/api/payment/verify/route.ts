import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend"; 
import OrderConfirmationEmail from "@/components/emails/OrderConfirmationEmail"; 
import { generateOrderId, generateInvoiceId, generateActivationId, generateActivationBillingId } from "@/lib/id-generator";

// --- CONFIGURATION ---
const COMPANY_STATE = "Punjab"; // Used to decide IGST vs CGST/SGST

// Initialize Clients (Razorpay & Supabase are usually safe at top level)
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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
    // --- FIX: INITIALIZE RESEND INSIDE THE FUNCTION ---
    // This prevents "Missing API Key" errors during the build process
    const resend = process.env.RESEND_API_KEY 
      ? new Resend(process.env.RESEND_API_KEY) 
      : null;

    if (!resend) {
        console.warn("⚠️ RESEND_API_KEY is missing. Email will be skipped.");
    }

    const body = await req.json();
    const { 
      orderCreationId, razorpayPaymentId, razorpaySignature, paymentMode, 
      cartItems, userId, totalAmount, shippingAddress, 
      isGuest, autoSaveAddress,
      amountPaid, pendingAmount, codPolicy
    } = body;

    // --- STEP 1: VERIFY SIGNATURE (Security Check) ---
    // Only check signature for ONLINE or PARTIAL_COD payments. Skip for full COD.
    if (paymentMode !== "COD") {
        const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
        shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
        const digest = shasum.digest("hex");

        if (digest !== razorpaySignature) {
          console.error("❌ Invalid Signature");
          return NextResponse.json({ msg: "failure", error: "Invalid Signature" }, { status: 400 });
        }
    }

    // --- STEP 2: GENERATE IDs & TAX (STANDARDIZED) ---
    let orderType: 'PB' | 'CB' | 'CS' = 'CS'; 
    const hasPrebuilt = cartItems.some((i: any) => i.category === 'prebuilt' || i.name?.toLowerCase().includes('prebuilt'));
    const hasCustom = cartItems.some((i: any) => i.name?.toLowerCase().includes('custom pc'));

    if (hasPrebuilt) orderType = 'PB'; 
    else if (hasCustom) orderType = 'CB'; 

    const displayId = await generateOrderId(supabaseAdmin, orderType);
    const invoiceNo = await generateInvoiceId(supabaseAdmin);
    // Aegis Command Center activation key — ONLY machine orders get one:
    // prebuilt (PB) or custom build (CB). A parts/accessories order (CS) is null.
    const activationId = orderType === 'CS' ? null : generateActivationId();
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
              }
          }
      }
    } catch (userError) {
       console.error("⚠️ User Logic Crashed:", userError);
    }

    // --- STEP 4: SAVE ORDER (CRITICAL PRIORITY) ---
    console.log("💾 Attempting to save order to DB...");
    const dbUserId = (finalUserId && finalUserId !== 'guest') ? finalUserId : null;

    let finalStatus = "processing"; 
    if (paymentMode === "COD") finalStatus = "pending";
    else if (paymentMode === "PARTIAL_COD") finalStatus = "processing"; 
    else if (paymentMode === "ONLINE") finalStatus = "paid";

    const finalAmountPaid = amountPaid !== undefined ? amountPaid : (paymentMode === "COD" ? 0 : totalAmount);
    const finalPendingAmount = pendingAmount !== undefined ? pendingAmount : (paymentMode === "COD" ? totalAmount : 0);

    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            user_id: dbUserId,
            display_id: displayId,    
            invoice_no: invoiceNo,    
            full_name: shippingAddress.fullName,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            shipping_address: shippingAddress,
            address: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.pincode}`,
            total_amount: totalAmount,
            amount_paid: finalAmountPaid,
            pending_amount: finalPendingAmount,
            tax_details: taxDetails,
            payment_mode: paymentMode, 
            items: cartItems,
            status: finalStatus,
            payment_id: razorpayPaymentId,
            order_id: orderCreationId,
        })
        .select()
        .single();

    if (orderError) {
        console.error("❌ FATAL DB ERROR:", orderError);
        throw new Error(`Database Insert Failed: ${orderError.message}`);
    }

    console.log("✅ Order Saved:", order.id);

    // --- STEP 4.5: RECORD ACTIVATION (machine orders only) ---
    // Writes the key to the dedicated `activations` table, linked to this order.
    // Non-fatal: a failure here must never break a paid order.
    if (activationId) {
        const activationBillingId = await generateActivationBillingId(supabaseAdmin);
        const { error: actErr } = await supabaseAdmin.from('activations').insert({
            activation_id: activationId,
            activation_billing_id: activationBillingId,
            customer_name: shippingAddress.fullName,
            order_id: order.id,
            build_type: orderType === 'PB' ? 'prebuilt' : 'custom',
            source: 'checkout',
        });
        if (actErr) console.error("⚠️ Activation record failed:", actErr.message);
    }

    // --- STEP 5: SEND EMAIL ---
    if (resend) {
        // We catch email errors separately so they don't crash the order success screen
        resend.emails.send({
            from: 'Rig Builders Support <support@rigbuilders.in>',
            to: [shippingAddress.email],
            bcc: ['rigbuilders123@gmail.com'], 
            subject: `Order Placed: ${displayId}`, 
            react: OrderConfirmationEmail({
                order: activationId ? { ...order, activation_id: activationId } : order,
                taxDetails: taxDetails
            }),
        }).then(() => console.log("📧 Email sent")).catch((e) => console.error("📧 Email failed:", e));
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
        }).then(({ error }) => { if(error) console.error("Auto-save failed:", error) });
    }

    return NextResponse.json({
      msg: "success",
      orderId: order.id,
      displayId: displayId,
      activationId: activationId,
      accountCreated: accountCreated,
    });

  } catch (error: any) {
    console.error("🚨 GLOBAL HANDLER ERROR:", error);
    return NextResponse.json({ msg: "failure", error: error.message }, { status: 500 });
  }
}