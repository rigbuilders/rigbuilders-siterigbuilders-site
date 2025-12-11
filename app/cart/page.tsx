"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, removeFromCart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    
    // 1. Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Please log in to place an order.");
      router.push("/signin");
      setLoading(false);
      return;
    }

    try {
      // 2. Create Order in 'orders' table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata.full_name || "Unknown User",
          email: user.email,
          phone: user.user_metadata.phone || "",
          total_amount: cartTotal,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Add Items to 'order_items' table
      const itemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 4. Success!
      alert("Order placed successfully! We will contact you shortly.");
      clearCart();
      router.push("/dashboard"); // Or /orders

    } catch (err: any) {
      console.error("Checkout Error:", err.message);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      
      <div className="flex-grow pt-32 pb-12 px-[80px] 2xl:px-[100px]">
        <h1 className="font-orbitron text-4xl font-bold mb-8 text-white">YOUR CART</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <p className="text-brand-silver text-xl mb-6">Your cart is empty.</p>
            <Link href="/products">
              <button className="bg-brand-purple px-8 py-3 rounded text-white font-bold uppercase hover:bg-white hover:text-black transition-all">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* CART ITEMS LIST */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#1A1A1A] p-6 border border-white/5 rounded-lg">
                  <div className="flex items-center gap-6">
                    {/* Image Placeholder */}
                    <div className="w-20 h-20 bg-black/50 rounded flex items-center justify-center">
                       <span className="text-xs text-white/20 font-orbitron">{item.category || "ITEM"}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{item.name}</h3>
                      <p className="text-brand-purple text-sm font-bold">₹{item.price.toLocaleString("en-IN")}</p>
                      <p className="text-brand-silver text-xs mt-1">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-400 text-sm underline decoration-red-500/30"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* CHECKOUT SUMMARY */}
            <div className="h-fit bg-[#1A1A1A] p-8 border border-white/5 rounded-lg sticky top-32">
              <h3 className="font-orbitron text-xl font-bold mb-6 border-b border-white/10 pb-4">Summary</h3>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-brand-silver">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-brand-silver">
                  <span>Shipping</span>
                  <span className="text-green-400">Free</span>
                </div>
                <div className="flex justify-between text-brand-silver">
                  <span>Tax (18% GST)</span>
                  <span>Included</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-white mb-8 pt-4 border-t border-white/10">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-white text-black py-4 font-orbitron font-bold uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? "Processing..." : "Checkout"}
              </button>
            </div>

          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}