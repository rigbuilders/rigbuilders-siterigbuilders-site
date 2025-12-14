"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";

export default function CartPage() {
  
  const { cart, removeFromCart, cartTotal } = useCart();
  const router = useRouter();

  // Simple Total (No tax/discount calc here anymore)
  const subtotalInclusive = cartTotal; 

  const handleCheckout = () => {
    // Just navigate to checkout. No params needed.
    router.push("/checkout");
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-hidden">
      
      <div className="fixed top-0 left-0 w-full h-[500px] bg-brand-purple/5 blur-[120px] pointer-events-none z-0" />
      <Navbar />
      
      <div className="flex-grow pt-32 pb-24 px-[20px] md:px-[40px] lg:px-[80px] 2xl:px-[100px] relative z-10">
        
        <Reveal>
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-12 text-white tracking-wide">
            YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">BUILD</span>
          </h1>
        </Reveal>

        {cart.length === 0 ? (
          <Reveal>
            <div className="text-center py-24 border border-dashed border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
              <p className="font-orbitron text-brand-silver text-xl md:text-2xl mb-8">Your cart is empty.</p>
              <Link href="/products">
                <button className="rb-btn-primary px-10 py-4 rounded font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(78,44,139,0.4)] transition-all">
                  Start Configuration
                </button>
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* --- CART ITEMS LIST --- */}
            <div className="lg:col-span-2">
              <StaggerGrid className="space-y-6">
                {cart.map((item) => (
                  <StaggerItem key={item.id}>
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-[#1A1A1A] p-6 border border-white/5 rounded-lg group hover:border-brand-purple/30 transition-all duration-300 relative overflow-hidden">
                      <div className="flex items-center gap-6 w-full sm:w-auto z-10">
                        <div className="w-24 h-24 bg-black/50 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                           <span className="text-xs text-white/30 font-orbitron text-center px-2 uppercase tracking-wider">{item.category || "COMPONENT"}</span>
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="font-orbitron font-bold text-lg text-white mb-1">{item.name}</h3>
                          <div className="flex items-center justify-center sm:justify-start gap-4">
                              <p className="text-brand-purple font-bold font-saira text-lg">₹{item.price.toLocaleString("en-IN")}</p>
                              <div className="bg-white/5 px-3 py-1 rounded text-[10px] text-brand-silver border border-white/10 uppercase font-bold tracking-wider">
                                Qty: {item.quantity}
                              </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="mt-4 sm:mt-0 text-red-500/70 hover:text-red-400 text-xs font-bold uppercase tracking-widest border border-red-500/20 hover:border-red-500/50 px-4 py-2 rounded transition-all z-10">
                        Remove
                      </button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>

            {/* --- SIMPLE SUMMARY (No Coupon) --- */}
            <Reveal delay={0.2} className="relative">
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-8 border border-white/10 rounded-lg sticky top-32 shadow-2xl">
                  <h3 className="font-orbitron text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">Cart Total</h3>
                  <div className="space-y-4 mb-8 text-sm font-saira">
                    <div className="flex justify-between text-brand-silver">
                      <span>Subtotal</span>
                      <span>₹{subtotalInclusive.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-brand-silver">
                      <span>Shipping</span>
                      <span className="text-green-400 font-bold uppercase tracking-wider text-xs">Calculated at Checkout</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-2xl font-black text-white mb-8 pt-6 border-t border-white/10 font-orbitron">
                    <span>TOTAL</span>
                    <span>₹{subtotalInclusive.toLocaleString("en-IN")}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-white text-black py-4 font-orbitron font-bold uppercase tracking-[0.15em] hover:bg-brand-purple hover:text-white transition-all duration-300 rounded shadow-lg hover:shadow-brand-purple/50 clip-path-slant">
                    Proceed to Checkout
                  </button>
                </div>
            </Reveal>

          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}