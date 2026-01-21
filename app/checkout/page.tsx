"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CouponCode from "@/components/cart/CouponCode"; 
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaCreditCard, FaMoneyBillWave, FaTimes } from "react-icons/fa";
import { toast } from "sonner";

// --- CONSTANTS ---
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", 
  "Jammu and Kashmir", "Ladakh"
];

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<null | "checking" | "valid" | "invalid">(null);
  const router = useRouter();
  
  // --- STATES ---
  const [isGuest, setIsGuest] = useState(true); 
  const [user, setUser] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState("");
  const [shippingCost, setShippingCost] = useState(0); 
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  
  // [FIX] Add this flag to prevent redirecting to empty cart on success
// [FIX] Add this flag to prevent redirecting to empty cart on success
  const [paymentSuccess, setPaymentSuccess] = useState(false); 
  // PAYMENT MODAL STATE
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // NEW: COD POLICY LOGIC
  const [codMode, setCodMode] = useState<'full' | 'partial' | 'none'>('full');
  
  useEffect(() => {
    let mode: 'full' | 'partial' | 'none' = 'full';
    
    // Scan cart for strictest policy
    for (const item of cart) {
        // Ensure your cart items actually carry the 'cod_policy' field from the DB!
        const policy = item.cod_policy || 'full_cod'; 
        
        if (policy === 'no_cod') {
            mode = 'none';
            break; // Stop, this is the strictest restriction
        }
        if (policy === 'partial_cod') {
            mode = 'partial';
        }
    }
    setCodMode(mode);
  }, [cart]);
  // SHIPPING FORM
  const [formData, setFormData] = useState({
    fullName: "", phone: "", email: "", 
    addressLine1: "", addressLine2: "", landmark: "", 
    pincode: "", city: "", state: "", country: "India"
  });

  // BILLING FORM
  const [billingSame, setBillingSame] = useState(true);
  const [billingData, setBillingData] = useState({
    fullName: "", phone: "", 
    addressLine1: "", addressLine2: "", 
    pincode: "", city: "", state: "", country: "India"
  });

  // --- SHIPPING COST LOGIC ---
  useEffect(() => {
    const heavyItemKeywords = ["Desktop", "System", "Custom", "Rig", "Workstation", "Ascend", "WorkPro", "Creator", "Signature", "Display", "Monitor", "Screen"];
    const needsHeavyShipping = cart.some(item => {
        const category = item.category || "";
        return heavyItemKeywords.some(keyword => category.toLowerCase().includes(keyword.toLowerCase()));
    });
    setShippingCost(needsHeavyShipping ? 1200 : 0);
  }, [cart]);

  // --- GST CALCULATION ---
  const taxBreakdown = useMemo(() => {
    const subtotalInclusive = cartTotal;
    const baseAmount = Math.round(subtotalInclusive / 1.18);
    const totalTax = subtotalInclusive - baseAmount;
    const isPunjab = formData.state?.toLowerCase() === "punjab";

    return {
        baseAmount,
        totalTax,
        cgst: isPunjab ? totalTax / 2 : 0,
        sgst: isPunjab ? totalTax / 2 : 0,
        igst: isPunjab ? 0 : totalTax,
        isPunjab
    };
  }, [cartTotal, formData.state]);

  const finalTotal = cartTotal + shippingCost - discount;

  // --- INITIALIZE USER & REDIRECT LOGIC ---
  useEffect(() => {
    const initUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            setIsGuest(false);
            setUser(user);
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                fullName: user.user_metadata.full_name || "",
                phone: user.user_metadata.phone || ""
            }));

            const { data: addresses } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false });

            if (addresses) setSavedAddresses(addresses);
        } else {
            setIsGuest(true);
        }
        
        // [FIX] Only redirect to cart if payment is NOT successful
        if (cart.length === 0 && !paymentSuccess) {
            router.push("/cart");
        }
    };
    initUser();
  }, [cart, router, paymentSuccess]); // Added paymentSuccess dependency

  const applySavedAddress = (addr: any) => {
      setFormData(prev => ({
          ...prev,
          fullName: addr.full_name,
          phone: addr.phone,
          addressLine1: addr.address_line1,
          addressLine2: addr.address_line2 || "",
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
      }));
      if(addr.pincode) setPincodeStatus("valid");
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, pincode: pin }));

      if (pin.length === 6) {
          setPincodeStatus("checking");
          try {
              const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
              const data = await res.json();

              if (data[0].Status === "Success") {
                  const details = data[0].PostOffice[0];
                  setFormData(prev => ({
                      ...prev,
                      city: details.District,
                      state: details.State,
                      pincode: pin
                  }));
                  setPincodeStatus("valid");
                  toast.success("Location Detected", { description: `${details.District}, ${details.State}` });
              } else {
                  setPincodeStatus("invalid");
                  toast.error("Invalid Pincode", { description: "Couriers may not service this area." });
              }
          } catch (err) {
              setPincodeStatus("invalid");
          }
      } else {
          setPincodeStatus(null);
      }
  };

  const trackCouponUsage = async (couponUsed: string) => {
    if (couponUsed) {
      await supabase.rpc('increment_coupon_usage', { coupon_code: couponUsed });
    }
  };

// --- 1. FORM SUBMISSION (OPENS MODAL) ---
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pincodeStatus === "invalid") {
        toast.error("Invalid Pincode", { description: "Please enter a valid 6-digit Pincode." });
        return;
    }
    // Open the Payment Mode Selection Modal
    setShowPaymentModal(true);
  };

// --- 2. PROCESS ONLINE PAYMENT (Flexible: Full or Advance) ---
  const processOnlinePayment = async (isAdvancePayment: boolean = false) => {
    setLoading(true);
    setShowPaymentModal(false); 
    
    // LOGIC: Calculate 10% if it is an Advance Payment, otherwise Full Amount
    const amountToPay = isAdvancePayment ? Math.round(finalTotal * 0.10) : finalTotal;
    const pendingAmount = isAdvancePayment ? (finalTotal - amountToPay) : 0;
    
    // LABEL: This tag tells Ops/Procurement exactly what type of order this is
    const paymentModeLabel = isAdvancePayment ? "PARTIAL_COD" : "ONLINE";

    try {
        // Create Razorpay Order for the Calculated Amount
        const orderRes = await fetch("/api/payment/create", {
            method: "POST",
            body: JSON.stringify({ amount: amountToPay }),
        });
        const orderData = await orderRes.json();
        
        if (orderData.error) throw new Error(orderData.error);

        const res = await loadRazorpay();
        if (!res) throw new Error("Razorpay SDK failed to load.");

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderData.amount, 
            currency: orderData.currency,
            name: "Rig Builders",
            description: isAdvancePayment ? `10% Advance Payment` : `Order for ${cart.length} Items`,
            image: "/icons/navbar/logo.png",
            order_id: orderData.id, 

            handler: async function (response: any) {
                // On Success, Finalize Order with Details
                await finalizeOrder({
                    orderCreationId: orderData.id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    paymentMode: paymentModeLabel, // "PARTIAL_COD" or "ONLINE"
                    amountPaid: amountToPay,       // Amount user just paid
                    pendingAmount: pendingAmount   // Amount to collect on delivery
                });
            },
            prefill: {
                name: formData.fullName,
                email: formData.email,
                contact: formData.phone,
            },
            theme: { color: "#4E2C8B" },
            modal: {
                ondismiss: function() {
                    setLoading(false);
                    toast("Payment Cancelled");
                }
            }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();

    } catch (err: any) {
        console.error(err);
        toast.error("Payment Error", { description: err.message });
        setLoading(false);
    }
  };

  // --- 3. PROCESS CASH ON DELIVERY ---
  const processCODPayment = async () => {
    setLoading(true);
    setShowPaymentModal(false);

    try {
        // We reuse the finalize logic but pass COD flags
        await finalizeOrder({
            orderCreationId: `COD_${Date.now()}`, // Generate a temporary ID for COD
            razorpayPaymentId: "COD_PENDING",
            razorpaySignature: "COD_AUTH",
            paymentMode: "COD"
        });
    } catch (err: any) {
        console.error(err);
        toast.error("Order Failed", { description: err.message });
        setLoading(false);
    }
  };

// --- HELPER: FINALIZE ORDER IN DATABASE ---
  const finalizeOrder = async (paymentDetails: any) => {
    const toastId = toast.loading("Placing Order...");
    const finalBillingAddress = billingSame ? formData : billingData;

    // Check duplication
    const addressExists = savedAddresses.some(addr => 
        addr.address_line1?.toLowerCase() === formData.addressLine1.toLowerCase() &&
        addr.pincode === formData.pincode &&
        addr.city?.toLowerCase() === formData.city.toLowerCase()
    );

    const verifyData = {
        ...paymentDetails,
        cartItems: cart,
        userId: user?.id || 'guest',
        totalAmount: finalTotal,
        shippingAddress: formData,
        billingAddress: finalBillingAddress,
        isGuest: isGuest, 
        autoSaveAddress: !addressExists,
        
        // NEW: Explicitly send Policy Details to Ops/Procurement
        codPolicy: codMode // 'full', 'partial', or 'none'
    };

    const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify(verifyData),
        headers: { 'Content-Type': 'application/json' },
    });

    const resData = await verifyRes.json();
    toast.dismiss(toastId);

    if (resData.msg === "success") {
        setPaymentSuccess(true);
        localStorage.setItem("latestOrder", JSON.stringify({ 
            items: cart, 
            display_id: resData.displayId 
        }));
        
        await trackCouponUsage(activeCoupon);
        clearCart();
        
        // Custom Success Message based on Mode
        let successMsg = "Order Placed Successfully!";
        if (paymentDetails.paymentMode === "PARTIAL_COD") successMsg = "Advance Paid. Order Placed!";
        else if (paymentDetails.paymentMode === "ONLINE") successMsg = "Payment Verified Successfully";
            
        toast.success(successMsg, { description: "Redirecting to receipt..." });
        
        window.location.href = `/order-success?id=${resData.displayId}`;
    } else {
        toast.error("Order Failed", {
            description: resData.error || "Could not verify order."
        });
        setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-[500px] bg-brand-purple/5 blur-[120px] pointer-events-none z-0" />
      <Navbar />
      
      <div className="flex-grow pt-32 pb-12 px-[20px] md:px-[40px] lg:px-[80px] 2xl:px-[100px] relative z-10">
        <Reveal>
          <h1 className="font-orbitron text-4xl font-bold mb-12 text-white uppercase tracking-wide">
             SECURE <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">CHECKOUT</span>
          </h1>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
            
            {/* --- LEFT: FORMS --- */}
            <div className="lg:col-span-2">
                <form id="checkout-form" onSubmit={handleFormSubmit} className="space-y-8">
                    
                    {/* 1. SHIPPING DETAILS */}
                    <Reveal delay={0.1}>
                        <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple" />
                            <h2 className="font-orbitron text-xl font-bold mb-8 text-white flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center text-sm">1</span>
                                Shipping Details
                            </h2>

                            {!isGuest && savedAddresses.length > 0 && (
                                <div className="mb-8">
                                    <p className="text-xs uppercase tracking-wider text-brand-silver mb-3 font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 bg-brand-purple rounded-full animate-pulse"></span>
                                        Quick Fill
                                    </p>
                                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                                        {savedAddresses.map((addr) => (
                                            <div key={addr.id} onClick={() => applySavedAddress(addr)} className="min-w-[200px] bg-black/40 border border-white/10 hover:border-brand-purple hover:bg-brand-purple/5 p-4 rounded cursor-pointer transition-all group relative">
                                                {addr.is_default && <span className="absolute top-2 right-2 text-[8px] bg-brand-purple px-1.5 rounded text-white font-bold uppercase">Default</span>}
                                                <div className="font-bold text-white text-sm mb-1">{addr.label}</div>
                                                <div className="text-xs text-brand-silver line-clamp-2">{addr.address_line1}, {addr.city}</div>
                                                <div className="mt-2 text-[10px] text-white/50 font-mono">{addr.pincode}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-full h-[1px] bg-white/5 mt-6"></div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Full Name</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Your Name" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Phone Number</label>
                                    <input required type="tel" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="99999 XXXXX" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Email Address</label>
                                    <input required type="email" readOnly={!isGuest} className={`w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none ${!isGuest ? 'cursor-not-allowed opacity-50' : ''}`}
                                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="guest@example.com" />
                                    {isGuest && <span className="text-[10px] text-brand-silver mt-1 block">We will create an account for you with this email.</span>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Address Line 1</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} placeholder="House / Flat / Building" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Address Line 2 <span className="text-white/20 font-normal">(Optional)</span></label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} placeholder="Street / Area" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Pincode</label>
                                    <div className="relative">
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                            value={formData.pincode} onChange={handlePincodeChange} placeholder="147001" maxLength={6} />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {pincodeStatus === "checking" && <span className="text-xs text-yellow-500 font-bold animate-pulse">Locating...</span>}
                                            {pincodeStatus === "valid" && <span className="text-xs text-green-500 font-bold">✓</span>}
                                            {pincodeStatus === "invalid" && <span className="text-xs text-red-500 font-bold">Invalid</span>}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">City</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">State</label>
                                    <select required className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none appearance-none"
                                        value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                                        <option value="" disabled>Select State</option>
                                        {INDIAN_STATES.map(st => <option key={st} value={st} className="bg-[#1A1A1A]">{st}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* 2. BILLING DETAILS */}
                    <Reveal delay={0.2}>
                        <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue" />
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="font-orbitron text-xl font-bold text-white flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-sm">2</span>
                                    Billing Address
                                </h2>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <span className="text-xs text-brand-silver font-bold uppercase">Same as Shipping</span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${billingSame ? "bg-brand-blue" : "bg-white/10"}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${billingSame ? "translate-x-6" : "translate-x-0"}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={billingSame} onChange={() => setBillingSame(!billingSame)} />
                                </label>
                            </div>

                            {!billingSame && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">
                                     <div className="md:col-span-2">
                                        <label className="text-xs text-brand-silver mb-2 font-bold block">Name</label>
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none" 
                                            value={billingData.fullName} onChange={e => setBillingData({...billingData, fullName: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-brand-silver mb-2 font-bold block">Billing Address</label>
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none" 
                                            value={billingData.addressLine1} onChange={e => setBillingData({...billingData, addressLine1: e.target.value})} placeholder="Address Line 1" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none" 
                                            value={billingData.addressLine2} onChange={e => setBillingData({...billingData, addressLine2: e.target.value})} placeholder="Address Line 2 (Optional)" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-brand-silver mb-2 font-bold block">Pincode</label>
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none" 
                                            value={billingData.pincode} onChange={e => setBillingData({...billingData, pincode: e.target.value})} maxLength={6} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-brand-silver mb-2 font-bold block">State</label>
                                        <select required className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none appearance-none"
                                            value={billingData.state} onChange={e => setBillingData({...billingData, state: e.target.value})}>
                                            <option value="" disabled>Select State</option>
                                            {INDIAN_STATES.map(st => <option key={st} value={st} className="bg-[#1A1A1A]">{st}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Reveal>
                </form>
            </div>

            {/* --- RIGHT: SUMMARY & TAX BREAKDOWN --- */}
            <div className="h-fit">
                <Reveal delay={0.2} className="sticky top-32">
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-8 border border-white/10 rounded-lg shadow-2xl relative">
                        <h3 className="font-orbitron text-xl font-bold mb-6 text-white border-b border-white/10 pb-4 flex justify-between items-center">
                            Order Summary
                            <span className="text-xs font-saira text-brand-silver bg-white/5 px-2 py-1 rounded">{cart.length} Items</span>
                        </h3>
                        <div className="mb-6 space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-start text-sm group">
                                    <div className="flex gap-3">
                                         <span className="w-6 h-6 bg-brand-purple/20 text-brand-purple rounded flex items-center justify-center text-[10px] font-bold border border-brand-purple/30 shrink-0">
                                            {item.quantity}x
                                         </span>
                                         <div>
                                            <span className="text-white block group-hover:text-brand-purple transition-colors">{item.name}</span>
                                            <span className="text-[10px] text-brand-silver uppercase tracking-wider">{item.category}</span>
                                         </div>
                                    </div>
                                    <span className="text-white font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mb-8">
                             <CouponCode subtotal={cartTotal} onApply={(amount, code) => { setDiscount(amount); setActiveCoupon(code); }} />
                        </div>

                        {/* TAX BREAKDOWN SECTION */}
                        <div className="border-t border-white/10 pt-6 space-y-3 text-sm font-saira">
                            <div className="flex justify-between text-brand-silver/70">
                                <span>Taxable Value</span>
                                <span>₹{taxBreakdown.baseAmount.toLocaleString("en-IN")}</span>
                            </div>
                            
                            {/* DYNAMIC TAX DISPLAY */}
                            {taxBreakdown.isPunjab ? (
                                <>
                                    <div className="flex justify-between text-brand-silver/70">
                                        <span>CGST (9%)</span>
                                        <span>₹{taxBreakdown.cgst.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-brand-silver/70">
                                        <span>SGST (9%)</span>
                                        <span>₹{taxBreakdown.sgst.toLocaleString("en-IN")}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between text-brand-silver/70">
                                    <span>IGST (18%)</span>
                                    <span>₹{taxBreakdown.igst.toLocaleString("en-IN")}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-brand-silver">
                                <span>Shipping Charge</span>
                                {shippingCost === 0 ? <span className="text-green-400 font-bold uppercase text-xs bg-green-500/10 px-2 py-1 rounded">Free</span> : <span>₹{shippingCost.toLocaleString("en-IN")}</span>}
                            </div>
                            
                            {discount > 0 && (
                                <div className="flex justify-between text-brand-purple font-bold animate-pulse"><span>Coupon ({activeCoupon})</span><span>- ₹{discount.toLocaleString("en-IN")}</span></div>
                            )}
                            
                            <div className="flex justify-between text-2xl font-black text-white pt-4 mt-2 border-t border-white/10 font-orbitron">
                                <span>TOTAL</span><span>₹{finalTotal.toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        <button type="submit" form="checkout-form" disabled={loading || pincodeStatus === "invalid"} className="w-full bg-white text-black py-4 mt-8 font-orbitron font-bold uppercase tracking-[0.15em] hover:bg-brand-purple hover:text-white transition-all duration-300 rounded shadow-lg hover:shadow-brand-purple/50 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <span className="animate-pulse">Processing...</span> : <>Pay Securely <span className="text-lg">→</span></>}
                        </button>
                    </div>
                </Reveal>
            </div>

        </div>
      </div>
      {/* --- PREMIUM PAYMENT MODAL (DYNAMIC POLICY) --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
            
            <div className="bg-[#121212] border border-brand-purple/30 rounded-xl p-8 w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(124,58,237,0.2)] animate-in fade-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="absolute top-4 right-4 text-brand-silver hover:text-white transition-colors"
                >
                    <FaTimes size={20} />
                </button>

                <h3 className="font-orbitron text-2xl font-bold text-white mb-2 text-center">PAYMENT MODE</h3>
                
                {/* DYNAMIC SUBTITLE */}
                {codMode === 'none' && <p className="text-red-500 text-xs text-center mb-6 font-bold">⚠️ Contains items restricted to Online Payment only.</p>}
                {codMode === 'partial' && <p className="text-yellow-500 text-xs text-center mb-6 font-bold">⚠️ High-value items require 10% Advance.</p>}
                {codMode === 'full' && <p className="text-brand-silver text-xs text-center mb-6">Select how you would like to complete your order</p>}

                <div className="space-y-4">
                    {/* OPTION 1: FULL ONLINE (Always Available) */}
                    <button 
                        onClick={() => processOnlinePayment(false)} // false = Full Payment
                        className="w-full group relative overflow-hidden bg-gradient-to-r from-brand-purple to-brand-blue p-[1px] rounded-lg transition-all hover:scale-[1.02]"
                    >
                        <div className="bg-[#1A1A1A] group-hover:bg-opacity-90 transition-all rounded-lg p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple border border-brand-purple/30">
                                    <FaCreditCard size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-orbitron font-bold text-white text-sm">PAY FULL ONLINE</div>
                                    <div className="text-[10px] text-brand-silver">UPI, Credit/Debit Card, EMI</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-white font-bold text-sm block">₹{finalTotal.toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                    </button>

                    {/* OPTION 2: PARTIAL COD (Visible only if Partial Mode is Active) */}
                    {codMode === 'partial' && (
                        <button 
                            onClick={() => processOnlinePayment(true)} // true = Advance Payment
                            className="w-full group bg-white/5 border border-yellow-500/50 hover:bg-yellow-500/10 rounded-lg p-5 flex items-center justify-between transition-all hover:scale-[1.02]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                    <FaMoneyBillWave size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-orbitron font-bold text-white text-sm">BOOK WITH 10% ADVANCE</div>
                                    <div className="text-[10px] text-brand-silver">Pay rest on delivery</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-yellow-500 font-bold text-sm block">₹{Math.round(finalTotal * 0.10).toLocaleString("en-IN")}</span>
                                <span className="text-[10px] text-brand-silver">Now</span>
                            </div>
                        </button>
                    )}

                    {/* OPTION 3: FULL COD (Visible only if Full Mode is Active) */}
                    {codMode === 'full' && (
                        <button 
                            onClick={processCODPayment}
                            className="w-full group bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-lg p-5 flex items-center justify-between transition-all hover:scale-[1.02]"
                        >
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                                    <FaMoneyBillWave size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-orbitron font-bold text-white text-sm">CASH ON DELIVERY</div>
                                    <div className="text-[10px] text-brand-silver">Pay securely at your doorstep</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-green-500 font-bold text-sm block">₹{finalTotal.toLocaleString("en-IN")}</span>
                            </div>
                        </button> // <--- FIXED: Properly closing the button tag
                    )}

                    {/* DISABLED STATE (If No COD allowed) */}
                    {codMode === 'none' && (
                         <div className="w-full opacity-50 bg-white/5 border border-white/5 rounded-lg p-5 flex items-center justify-between cursor-not-allowed grayscale">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/20 border border-white/10">
                                   <FaMoneyBillWave size={20} />
                               </div>
                               <div className="text-left">
                                   <div className="font-orbitron font-bold text-white/50 text-sm">CASH ON DELIVERY</div>
                                   <div className="text-[10px] text-brand-silver">Unavailable for these items</div>
                               </div>
                           </div>
                       </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">
                        SECURE ENCRYPTED TRANSACTION
                    </p>
                </div>
            </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
