"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CouponCode from "@/components/cart/CouponCode"; // Import Coupon Component
import { Reveal } from "@/components/ui/MotionWrappers"; // Import Motions

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

// Load Razorpay Script
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
  const [discount, setDiscount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState("");
  const [shippingCost, setShippingCost] = useState(0); 

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "", 
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    pincode: "",
    city: "",
    state: "",
    country: "India", // Default
    billingSame: true
  });

  // --- LOGIC 1: SHIPPING CHARGE CALCULATION ---
  // Checks if cart contains Desktops, Custom Rigs, or Displays
  useEffect(() => {
    const heavyItemKeywords = [
        "Desktop", "System", "Custom", "Rig", "Workstation", // PCs
        "Ascend", "WorkPro", "Creator", "Signature",         // Series Names
        "Display", "Monitor", "Screen"                       // Displays
    ];
    
    // Check if ANY item in the cart matches the keywords
    const needsHeavyShipping = cart.some(item => {
    const category = item.category || ""; // Fallback to empty string if undefined
    return heavyItemKeywords.some(keyword => category.toLowerCase().includes(keyword.toLowerCase()));
});

    // Set Shipping Cost
    if (needsHeavyShipping) {
        setShippingCost(1200); // ₹1200 for Rigs & Displays
    } else {
        setShippingCost(0); // Free for small components
    }
  }, [cart]);

  // --- LOGIC 2: TOTAL CALCULATION ---
  // Assuming cartTotal is Inclusive of 18% GST
  const subtotalInclusive = cartTotal;
  const baseAmount = Math.round(subtotalInclusive / 1.18);
  const gstAmount = subtotalInclusive - baseAmount;
  
  // Final Total = (Subtotal + Shipping) - Coupon
  const finalTotal = subtotalInclusive + shippingCost - discount;

  // 1. Initialize User Data
  useEffect(() => {
    const initUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/signin");
            return;
        }
        if (cart.length === 0) router.push("/cart");

        // Prefill known data
        setFormData(prev => ({
            ...prev,
            email: user.email || "",
            fullName: user.user_metadata.full_name || "",
            phone: user.user_metadata.phone || ""
        }));
    };
    initUser();
  }, [cart, router]);

  // 2. Mock Delhivery Serviceability Check
  const checkServiceability = async (pincode: string) => {
      if (pincode.length !== 6) {
          setPincodeStatus("invalid");
          return;
      }
      setPincodeStatus("checking");
      
      // Simulating API check
      setTimeout(() => {
          setPincodeStatus("valid"); 
      }, 800);
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, pincode: pin });
      if (pin.length === 6) checkServiceability(pin);
      else setPincodeStatus(null);
  };

  // 3. Coupon Usage Tracking
  const trackCouponUsage = async (couponUsed: string) => {
    if (couponUsed) {
      const { error } = await supabase.rpc('increment_coupon_usage', { coupon_code: couponUsed });
      if (error) console.error("Failed to track coupon usage:", error);
      else console.log("Coupon usage tracked +1");
    }
  };

  // ... (Previous code: trackCouponUsage function) ...

  // 4. Handle Payment (UPDATED FOR OPS AUTOMATION)
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pincodeStatus === "invalid") {
        alert("Please enter a valid 6-digit Pincode.");
        return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    // Note: We proceed even if user is null (Guest Checkout logic handled by backend)

    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load. Check connection.");
      setLoading(false);
      return;
    }

    try {
        // STEP 1: Call Backend to Create Razorpay Order ID
        const orderRes = await fetch("/api/payment/create", {
            method: "POST",
            body: JSON.stringify({ amount: finalTotal }),
        });
        const orderData = await orderRes.json();

        if (orderData.error) throw new Error(orderData.error);

        // STEP 2: Initialize Razorpay
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_PLACEHOLDER",
            amount: orderData.amount, 
            currency: orderData.currency,
            name: "Rig Builders",
            description: `Order for ${cart.length} Items`,
            image: "/icons/navbar/logo.png",
            order_id: orderData.id, // CRITICAL: Pass the ID generated by backend

            handler: async function (response: any) {
                // STEP 3: Payment Success -> Call Verification & Ops Automation
                const verifyData = {
                    orderCreationId: orderData.id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    
                    // Ops Data
                    cartItems: cart,
                    userId: user?.id || 'guest',
                    totalAmount: finalTotal,
                    shippingAddress: formData
                };

                const verifyRes = await fetch('/api/payment/verify', {
                    method: 'POST',
                    body: JSON.stringify(verifyData),
                    headers: { 'Content-Type': 'application/json' },
                });

                const resData = await verifyRes.json();

                if (resData.msg === "success") {
                    await trackCouponUsage(activeCoupon);
                    clearCart();
                    // Redirect to New Success Page
                    router.push(`/order-success?id=${resData.displayId}`);
                } else {
                    alert("Payment Verification Failed: " + resData.error);
                }
            },
            prefill: {
                name: formData.fullName,
                email: formData.email,
                contact: formData.phone,
            },
            theme: { color: "#4E2C8B" },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();

    } catch (err: any) {
        console.error(err);
        alert("Checkout Error: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // NOTE: The old 'createOrder' function has been deleted as the backend now handles DB insertion.

  if (cart.length === 0) return null; // Or loading state

  // ... (Rest of the component: return statement) ...

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-brand-purple/5 blur-[120px] pointer-events-none z-0" />

      <Navbar />
      
      <div className="flex-grow pt-32 pb-12 px-[20px] md:px-[40px] lg:px-[80px] 2xl:px-[100px] relative z-10">
        <Reveal>
          <h1 className="font-orbitron text-4xl font-bold mb-12 text-white uppercase tracking-wide">
             SECURE <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">CHECKOUT</span>
          </h1>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
            
            {/* --- LEFT: ADDRESS FORM --- */}
            <div className="lg:col-span-2">
                <form id="checkout-form" onSubmit={handlePayment} className="space-y-8">
                    
                    {/* Shipping Details Block */}
                    <Reveal delay={0.1}>
                        <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-lg relative overflow-hidden">
                            {/* Decorative Line */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple" />
                            
                            <h2 className="font-orbitron text-xl font-bold mb-8 text-white flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center text-sm">1</span>
                                Shipping Details
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Full Name</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none transition-colors" 
                                        value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="John Doe" />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Phone Number</label>
                                    <div className="flex">
                                        <span className="bg-white/5 border border-white/10 border-r-0 rounded-l p-4 text-brand-silver select-none font-bold">+91</span>
                                        <input required type="tel" className="w-full bg-black/40 border border-white/10 rounded-r p-4 text-white focus:border-brand-purple outline-none transition-colors" 
                                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="99999 XXXXX" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Email Address</label>
                                    <input readOnly type="email" className="w-full bg-white/5 border border-white/5 rounded p-4 text-white/50 cursor-not-allowed" 
                                        value={formData.email} />
                                </div>

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Address Line 1</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none transition-colors" 
                                        value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} placeholder="House / Flat / Building" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Address Line 2</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none transition-colors" 
                                        value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} placeholder="Street / Area" />
                                </div>

                                {/* Pincode Logic */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Pincode</label>
                                    <div className="relative">
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none transition-colors" 
                                            value={formData.pincode} onChange={handlePincodeChange} placeholder="110001" />
                                        
                                        {/* Status Indicators */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {pincodeStatus === "checking" && <span className="text-xs text-yellow-500 font-bold animate-pulse">Checking...</span>}
                                            {pincodeStatus === "valid" && <span className="text-xs text-green-500 font-bold">Serviceable ✓</span>}
                                            {pincodeStatus === "invalid" && <span className="text-xs text-red-500 font-bold">Invalid</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Landmark */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Landmark</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none transition-colors" 
                                        value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} placeholder="Near..." />
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">City</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none transition-colors" 
                                        value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                </div>

                                {/* State Dropdown */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">State</label>
                                    <div className="relative">
                                        <select required className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none appearance-none cursor-pointer"
                                            value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                                            <option value="" disabled>Select State</option>
                                            {INDIAN_STATES.map(st => <option key={st} value={st} className="bg-[#1A1A1A]">{st}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-brand-silver">▼</div>
                                    </div>
                                </div>
                                
                                {/* ADDED: Country Field (Read Only) */}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-brand-silver mb-2 font-bold">Country</label>
                                    <input readOnly type="text" className="w-full bg-white/5 border border-white/5 rounded p-4 text-white/50 cursor-not-allowed font-bold" 
                                        value={formData.country} />
                                </div>

                            </div>
                        </div>
                    </Reveal>
                </form>
            </div>

            {/* --- RIGHT: ORDER SUMMARY (Sticky) --- */}
            <div className="h-fit">
                <Reveal delay={0.2} className="sticky top-32">
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-8 border border-white/10 rounded-lg shadow-2xl relative">
                        
                        {/* Summary Header */}
                        <h3 className="font-orbitron text-xl font-bold mb-6 text-white border-b border-white/10 pb-4 flex justify-between items-center">
                            Order Summary
                            <span className="text-xs font-saira text-brand-silver bg-white/5 px-2 py-1 rounded">{cart.length} Items</span>
                        </h3>
                        
                        {/* Items List (Scrollable) */}
                        <div className="mb-6 space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-start text-sm group">
                                    <div className="flex gap-3">
                                         {/* Quantity Badge */}
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

                        {/* --- COUPON INPUT --- */}
                        <div className="mb-8">
                             <CouponCode 
                                subtotal={subtotalInclusive} 
                                onApply={(amount, code) => {
                                    setDiscount(amount);
                                    setActiveCoupon(code);
                                }} 
                             />
                        </div>

                        {/* Price Breakdown */}
                        <div className="border-t border-white/10 pt-6 space-y-3 text-sm font-saira">
                            <div className="flex justify-between text-brand-silver/70">
                                <span>Base Amount</span>
                                <span>₹{baseAmount.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-brand-silver/70">
                                <span>Tax (18% GST)</span>
                                <span>₹{gstAmount.toLocaleString("en-IN")}</span>
                            </div>
                            
                            {/* SHIPPING CHARGE DISPLAY */}
                            <div className="flex justify-between text-brand-silver">
                                <span>Shipping Charge</span>
                                {shippingCost === 0 ? (
                                    <span className="text-green-400 font-bold uppercase text-xs bg-green-500/10 px-2 py-1 rounded">Free</span>
                                ) : (
                                    // Shows ₹1200 if heavy items are present
                                    <span>₹{shippingCost.toLocaleString("en-IN")}</span>
                                )}
                            </div>

                            {/* DISCOUNT DISPLAY */}
                            {discount > 0 && (
                                <div className="flex justify-between text-brand-purple font-bold animate-pulse">
                                    <span>Coupon ({activeCoupon})</span>
                                    <span>- ₹{discount.toLocaleString("en-IN")}</span>
                                </div>
                            )}

                            {/* FINAL TOTAL */}
                            <div className="flex justify-between text-2xl font-black text-white pt-4 mt-2 border-t border-white/10 font-orbitron">
                                <span>TOTAL</span>
                                <span>₹{finalTotal.toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        {/* PAY BUTTON */}
                        <button 
                            type="submit"
                            form="checkout-form"
                            disabled={loading || pincodeStatus === "invalid"}
                            className="w-full bg-white text-black py-4 mt-8 font-orbitron font-bold uppercase tracking-[0.15em] hover:bg-brand-purple hover:text-white transition-all duration-300 rounded shadow-lg hover:shadow-brand-purple/50 clip-path-slant flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>Pay Securely <span className="text-lg">→</span></>
                            )}
                        </button>
                        
                        <p className="text-[10px] text-center text-[#555] mt-4 flex items-center justify-center gap-2">
                             <Image src="/icons/payment/upi.svg" alt="UPI" width={16} height={16} className="opacity-50" />
                             Secure 256-bit SSL Encrypted Payment by Razorpay.
                        </p>
                    </div>
                </Reveal>
            </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}