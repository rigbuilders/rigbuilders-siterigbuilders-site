"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CouponCode from "@/components/cart/CouponCode"; 
import { Reveal } from "@/components/ui/MotionWrappers";

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
  const [discount, setDiscount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState("");
  const [shippingCost, setShippingCost] = useState(0); 
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // SHIPPING FORM
  const [formData, setFormData] = useState({
    fullName: "", phone: "", email: "", 
    addressLine1: "", addressLine2: "", landmark: "", 
    pincode: "", city: "", state: "", country: "India"
  });

  // BILLING FORM (New)
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

  // --- TOTAL CALCULATION ---
  const subtotalInclusive = cartTotal;
  const baseAmount = Math.round(subtotalInclusive / 1.18);
  const gstAmount = subtotalInclusive - baseAmount;
  const finalTotal = subtotalInclusive + shippingCost - discount;

  // --- INITIALIZE USER ---
  useEffect(() => {
    const initUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/signin"); return; }
        if (cart.length === 0) router.push("/cart");

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
    };
    initUser();
  }, [cart, router]);

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
      checkServiceability(addr.pincode);
  };

  const checkServiceability = async (pincode: string) => {
      if (pincode.length !== 6) { setPincodeStatus("invalid"); return; }
      setPincodeStatus("checking");
      setTimeout(() => setPincodeStatus("valid"), 800);
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, pincode: pin });
      if (pin.length === 6) checkServiceability(pin);
      else setPincodeStatus(null);
  };

  const trackCouponUsage = async (couponUsed: string) => {
    if (couponUsed) {
      const { error } = await supabase.rpc('increment_coupon_usage', { coupon_code: couponUsed });
      if (error) console.error("Failed to track coupon usage:", error);
    }
  };

  // --- PAYMENT HANDLER ---
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pincodeStatus === "invalid") {
        alert("Please enter a valid 6-digit Pincode.");
        return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Determine Final Billing Address
    const finalBillingAddress = billingSame ? formData : billingData;

    try {
        const orderRes = await fetch("/api/payment/create", {
            method: "POST",
            body: JSON.stringify({ amount: finalTotal }),
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
            description: `Order for ${cart.length} Items`,
            image: "/icons/navbar/logo.png",
            order_id: orderData.id, 

            handler: async function (response: any) {
                const verifyData = {
                    orderCreationId: orderData.id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    
                    // PASSING BOTH ADDRESSES
                    cartItems: cart,
                    userId: user?.id || 'guest',
                    totalAmount: finalTotal,
                    shippingAddress: formData,
                    billingAddress: finalBillingAddress // <--- NEW FIELD
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

  if (cart.length === 0) return null;

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
                <form id="checkout-form" onSubmit={handlePayment} className="space-y-8">
                    
                    {/* 1. SHIPPING DETAILS */}
                    <Reveal delay={0.1}>
                        <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple" />
                            <h2 className="font-orbitron text-xl font-bold mb-8 text-white flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center text-sm">1</span>
                                Shipping Details
                            </h2>

                            {/* SAVED ADDRESSES */}
                            {savedAddresses.length > 0 && (
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
                                        value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Phone Number</label>
                                    <input required type="tel" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="99999 XXXXX" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Email Address</label>
                                    <input readOnly type="email" className="w-full bg-white/5 border border-white/5 rounded p-4 text-white/50 cursor-not-allowed" value={formData.email} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Address Line 1</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} placeholder="House / Flat / Building" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Address Line 2</label>
                                    <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                        value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} placeholder="Street / Area" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-silver mb-2 font-bold block">Pincode</label>
                                    <div className="relative">
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-purple outline-none" 
                                            value={formData.pincode} onChange={handlePincodeChange} placeholder="110001" />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {pincodeStatus === "checking" && <span className="text-xs text-yellow-500 font-bold animate-pulse">Checking...</span>}
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
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none" 
                                            value={billingData.addressLine2} onChange={e => setBillingData({...billingData, addressLine2: e.target.value})} placeholder="Address Line 2" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-brand-silver mb-2 font-bold block">City</label>
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none" 
                                            value={billingData.city} onChange={e => setBillingData({...billingData, city: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-brand-silver mb-2 font-bold block">Pincode</label>
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none" 
                                            value={billingData.pincode} onChange={e => setBillingData({...billingData, pincode: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-brand-silver mb-2 font-bold block">State</label>
                                        <select required className="w-full bg-black/40 border border-white/10 rounded p-4 text-white focus:border-brand-blue outline-none appearance-none"
                                            value={billingData.state} onChange={e => setBillingData({...billingData, state: e.target.value})}>
                                            <option value="" disabled>Select State</option>
                                            {INDIAN_STATES.map(st => <option key={st} value={st} className="bg-[#1A1A1A]">{st}</option>)}
                                        </select>
                                    </div>
                                    {/* ADD THIS: Billing Country Field */}
                                    <div className="md:col-span-2">
                                       <label className="text-xs text-brand-silver mb-2 font-bold block">Country</label>
                                       <input 
                                           readOnly 
                                           type="text" 
                                           className="w-full bg-white/5 border border-white/5 rounded p-4 text-white/50 cursor-not-allowed font-bold" 
                                           value={billingData.country} 
                                         />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Reveal>
                </form>
            </div>

            {/* --- RIGHT: SUMMARY --- */}
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
                             <CouponCode subtotal={subtotalInclusive} onApply={(amount, code) => { setDiscount(amount); setActiveCoupon(code); }} />
                        </div>

                        <div className="border-t border-white/10 pt-6 space-y-3 text-sm font-saira">
                            <div className="flex justify-between text-brand-silver/70"><span>Base Amount</span><span>₹{baseAmount.toLocaleString("en-IN")}</span></div>
                            <div className="flex justify-between text-brand-silver/70"><span>Tax (18% GST)</span><span>₹{gstAmount.toLocaleString("en-IN")}</span></div>
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
      <Footer />
    </div>
  );
}