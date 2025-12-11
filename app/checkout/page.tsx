"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "", // Read-only from auth
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
    billingSame: true
  });

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
      
      // TODO: Replace this timeout with a fetch call to your backend API that queries Delhivery
      // Example: const res = await fetch(`/api/delhivery/check-pin?pin=${pincode}`);
      setTimeout(() => {
          setPincodeStatus("valid"); // Simulating success for valid format
      }, 800);
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const pin = e.target.value.replace(/\D/g, '').slice(0, 6); // Allow only 6 digits
      setFormData({ ...formData, pincode: pin });
      if (pin.length === 6) checkServiceability(pin);
      else setPincodeStatus(null);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pincodeStatus === "invalid") {
        alert("Please enter a valid 6-digit Pincode.");
        return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load. Check connection.");
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_PLACEHOLDER",
      amount: cartTotal * 100, 
      currency: "INR",
      name: "Rig Builders",
      description: "Custom PC Order",
      image: "/icons/navbar/logo.png",
      handler: async function (response: any) {
        await createOrder(user, response.razorpay_payment_id);
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
    setLoading(false);
  };

  const createOrder = async (user: any, paymentId: string) => {
    try {
        // Construct full address string for storage
        const fullAddress = `
          ${formData.addressLine1}, ${formData.addressLine2}
          ${formData.landmark ? `(Landmark: ${formData.landmark})` : ""}
          ${formData.city}, ${formData.state}, ${formData.country} - ${formData.pincode}
        `.trim();

        const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: `+91 ${formData.phone}`,
            address: fullAddress,
            total_amount: cartTotal,
            status: 'Processing' 
        })
        .select()
        .single();

        if (orderError) throw orderError;

        const itemsToInsert = cart.map(item => ({
            order_id: orderData.id,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.image
        }));

        await supabase.from('order_items').insert(itemsToInsert);

        clearCart();
        router.push("/dashboard");

    } catch (error: any) {
        console.error("Order Creation Failed:", error);
        alert("Payment successful but order creation failed. ID: " + paymentId);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 px-[40px] lg:px-[80px] 2xl:px-[100px]">
        <h1 className="font-orbitron text-3xl font-bold mb-8 text-white uppercase">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT: ADDRESS FORM */}
            <div className="lg:col-span-2">
                <form id="checkout-form" onSubmit={handlePayment} className="space-y-6">
                    <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-lg">
                        <h2 className="font-orbitron text-xl font-bold mb-6 text-brand-silver">Shipping Details</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="md:col-span-2">
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Full Name</label>
                                <input required type="text" className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                            </div>

                            {/* Phone & Email */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Phone Number</label>
                                <div className="flex">
                                    <span className="bg-[#121212] border border-white/10 border-r-0 rounded-l p-3 text-[#A0A0A0] select-none">+91</span>
                                    <input required type="tel" className="w-full bg-[#121212] border border-white/10 rounded-r p-3 text-white focus:border-[#4E2C8B] outline-none" 
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="99999 XXXXX" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Email Address</label>
                                <input readOnly type="email" className="w-full bg-[#121212]/50 border border-white/5 rounded p-3 text-white/50 cursor-not-allowed" 
                                    value={formData.email} />
                            </div>

                            {/* Address Lines */}
                            <div className="md:col-span-2">
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Address Line 1 (House / Flat / Building)</label>
                                <input required type="text" className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                                    value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Address Line 2 (Street / Area)</label>
                                <input required type="text" className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                                    value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} />
                            </div>

                            {/* Landmark & Pincode */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Landmark (Optional)</label>
                                <input type="text" className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                                    value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Pincode</label>
                                <div className="relative">
                                    <input required type="text" className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                                        value={formData.pincode} onChange={handlePincodeChange} placeholder="110001" />
                                    {pincodeStatus === "checking" && <span className="absolute right-3 top-3 text-xs text-yellow-500">Checking...</span>}
                                    {pincodeStatus === "valid" && <span className="absolute right-3 top-3 text-xs text-green-500">Serviceable ✓</span>}
                                    {pincodeStatus === "invalid" && <span className="absolute right-3 top-3 text-xs text-red-500">Invalid</span>}
                                </div>
                            </div>

                            {/* City & State */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">City</label>
                                <input required type="text" className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none" 
                                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">State</label>
                                <select required className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none appearance-none"
                                    value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                                    <option value="" disabled>Select State</option>
                                    {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>

                            {/* Country (Read-Only) */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] mb-2">Country</label>
                                <input readOnly type="text" className="w-full bg-[#121212]/50 border border-white/5 rounded p-3 text-white/50 cursor-not-allowed" 
                                    value="India" />
                            </div>
                        </div>

                        {/* Billing Checkbox */}
                        <div className="mt-6 flex items-center gap-3">
                            <input type="checkbox" id="billing" checked={formData.billingSame} onChange={() => setFormData({...formData, billingSame: !formData.billingSame})} 
                                className="w-4 h-4 accent-[#4E2C8B]" />
                            <label htmlFor="billing" className="text-sm text-brand-silver select-none">Billing address is same as shipping address</label>
                        </div>
                    </div>
                </form>
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <div className="h-fit">
                <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-lg sticky top-32">
                    <h3 className="font-orbitron text-xl font-bold mb-6 border-b border-white/10 pb-4">Order Summary</h3>
                    
                    <div className="space-y-4 mb-6">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-white/80">{item.name} <span className="text-brand-purple">x{item.quantity}</span></span>
                                <span className="text-white">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-2 text-sm text-brand-silver">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{cartTotal.toLocaleString("en-IN")}</span></div>
                        <div className="flex justify-between"><span>Shipping</span><span className="text-green-400">Free</span></div>
                        <div className="flex justify-between"><span>Tax (18% GST Included)</span><span>₹{(cartTotal * 0.18).toFixed(0)}</span></div>
                    </div>

                    <div className="flex justify-between text-xl font-bold text-white mb-8 pt-6 border-t border-white/10">
                        <span>Total</span>
                        <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                    </div>

                    <button 
                        type="submit"
                        form="checkout-form"
                        disabled={loading || pincodeStatus === "invalid"}
                        className="w-full bg-white text-black py-4 font-orbitron font-bold uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Initializing..." : "Pay Now"}
                    </button>
                    
                    <p className="text-[10px] text-center text-[#A0A0A0] mt-4 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> 
                        Secure Payments by Razorpay
                    </p>
                </div>
            </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}