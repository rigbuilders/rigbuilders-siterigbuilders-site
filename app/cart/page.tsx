"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { toast } from "sonner";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa"; // <--- Import Icons

export default function CartPage() {
  
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart(); // <--- Get updateQuantity
  const router = useRouter();

  const subtotalInclusive = cartTotal; 

  const hasRestrictedItems = cart.some(item => item.cod_policy === 'no_cod');
  const hasPartialItems = cart.some(item => item.cod_policy === 'partial_cod');

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const handleRemove = (id: string, name: string) => {
    removeFromCart(id);
    toast.info("Item Removed", { description: `${name} removed from build.` });
  };

  // Helper to handle increment/decrement
  const handleQuantity = (id: string, currentQty: number, delta: number) => {
    if (currentQty === 1 && delta === -1) {
        toast.error("Minimum Limit", { description: "Use the remove button to delete items." });
        return;
    }
    updateQuantity(id, delta);
  };

  return (
    <div className="bg-rb-black min-h-screen text-white font-saira flex flex-col relative">

      <div className="fixed top-0 left-0 w-full h-[500px] bg-rb-orange/5 blur-[120px] pointer-events-none z-0" />
      <NavbarNeo />

      <div className="flex-grow pt-8 lg:pt-10 pb-16 rb-shell relative z-10 overflow-hidden">

        <Reveal>
          <h1 className="font-orbitron text-4xl md:text-5xl font-black mb-8 text-white tracking-tight">
            YOUR <span className="rb-text-ember">CART</span>
          </h1>
        </Reveal>

        {cart.length === 0 ? (
          <Reveal>
            <div className="text-center py-24 border border-dashed border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
              <p className="font-orbitron text-rb-silver text-xl md:text-2xl mb-8">Your cart is empty.</p>
              <Link href="/configure">
                <button className="px-10 py-4 bg-rb-orange text-rb-orange-ink hover:bg-rb-orange-deep rounded-lg font-bold uppercase tracking-widest transition-all shadow-[0_0_24px_-6px_rgba(255,90,31,0.6)]">
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
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-rb-surface p-6 border border-white/5 rounded-lg group hover:border-rb-orange/30 transition-all duration-300 relative overflow-hidden">
                      
                      {/* Product Info */}
                      <div className="flex items-center gap-6 w-full sm:w-auto z-10">
                        <div className="w-24 h-24 bg-black/50 rounded-lg flex items-center justify-center border border-white/10 shrink-0 overflow-hidden relative">
                           {item.image ? (
                               <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                           ) : (
                               <span className="text-xs text-white/30 font-orbitron text-center px-2 uppercase tracking-wider">{item.category || "COMPONENT"}</span>
                           )}
                        </div>
                        
                        <div className="text-center sm:text-left">
                          <h3 className="font-orbitron font-bold text-lg text-white mb-2 line-clamp-1">{item.name}</h3>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                              <p className="text-rb-orange font-bold font-saira text-lg">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>
                              
                              {/* POLICY BADGES */}
                              {item.cod_policy === 'no_cod' && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rb-danger/20 text-rb-danger px-2 py-1 rounded border border-rb-danger/30">
                                      Online Payment Only
                                  </span>
                              )}
                              {item.cod_policy === 'partial_cod' && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rb-warn/20 text-rb-warn px-2 py-1 rounded border border-rb-warn/30">
                                      Requires 10% Advance
                                  </span>
                              )}
                          </div>
                          
                          {/* --- NEW: QUANTITY CONTROLS --- */}
                          <div className="flex items-center justify-center sm:justify-start gap-4">
                              <div className="flex items-center bg-black/40 border border-white/20 rounded">
                                  <button 
                                    onClick={() => handleQuantity(item.id, item.quantity, -1)}
                                    className="px-3 py-1 text-rb-silver hover:text-white hover:bg-white/10 transition-colors border-r border-white/10 h-full"
                                  >
                                    <FaMinus size={10} />
                                  </button>
                                  <span className="px-4 text-sm font-bold font-orbitron w-10 text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => handleQuantity(item.id, item.quantity, 1)}
                                    className="px-3 py-1 text-rb-silver hover:text-white hover:bg-white/10 transition-colors border-l border-white/10 h-full"
                                  >
                                    <FaPlus size={10} />
                                  </button>
                              </div>
                          </div>
                        </div>
                      </div>

                      {/* Remove Action */}
                      <button 
                        onClick={() => handleRemove(item.id, item.name)} 
                        className="mt-6 sm:mt-0 text-rb-danger/50 hover:text-rb-danger p-3 rounded-full hover:bg-rb-danger/10 transition-all z-10"
                        title="Remove Item"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>

            {/* --- SUMMARY --- */}
            <Reveal delay={0.2} className="relative">
                <div className="bg-rb-surface/80 backdrop-blur-md p-8 border border-white/10 rounded-lg sticky top-32 shadow-2xl">
                  <h3 className="font-orbitron text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">Cart Total</h3>
                  <div className="space-y-4 mb-8 text-sm font-saira">
                    <div className="flex justify-between text-rb-silver">
                      <span>Subtotal</span>
                      <span>₹{subtotalInclusive.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-rb-silver">
                      <span>Shipping</span>
                      <span className="text-rb-success font-bold uppercase tracking-wider text-xs">Calculated at Checkout</span>
                    </div>

                    {/* POLICY WARNINGS */}
                    {hasRestrictedItems && (
                        <div className="mt-4 p-3 bg-rb-danger/10 border border-rb-danger/20 rounded text-[10px] text-rb-danger">
                            ⚠️ Some items in cart are restricted to <b>Online Payment Only</b>.
                        </div>
                    )}
                    {!hasRestrictedItems && hasPartialItems && (
                        <div className="mt-4 p-3 bg-rb-warn/10 border border-rb-warn/20 rounded text-[10px] text-rb-warn">
                            ⚠️ High-value items require <b>10% Advance Payment</b>.
                        </div>
                    )}

                  </div>
                  <div className="flex justify-between text-2xl font-black text-white mb-8 pt-6 border-t border-white/10 font-orbitron">
                    <span>TOTAL</span>
                    <span className="font-saira">₹{subtotalInclusive.toLocaleString("en-IN")}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-rb-orange text-rb-orange-ink py-4 font-orbitron font-bold uppercase tracking-[0.15em] hover:bg-rb-orange-deep transition-all duration-300 rounded-lg shadow-[0_0_24px_-6px_rgba(255,90,31,0.6)]">
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