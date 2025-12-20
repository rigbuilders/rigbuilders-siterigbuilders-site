"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaCheckCircle, FaBox, FaMapMarkerAlt, FaArrowRight, FaShoppingCart } from "react-icons/fa";

// Component to handle the logic inside Suspense
function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (!orderId) {
        router.push("/");
        return;
    }

    const fetchOrderDetails = async () => {
      // 1. Fetch the Order
      // We assume your 'orders' table has 'items' (JSON) or we fetch related 'order_items'
      // Adjust this query if your schema is strictly relational (e.g., .select('*, order_items(*)'))
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('display_id', orderId) // Assuming you use a friendly ID like ORD-123
        .single();

      if (error || !orderData) {
         // Fallback: try fetching by UUID if display_id failed
         const { data: orderUUID } = await supabase.from('orders').select('*').eq('id', orderId).single();
         if (orderUUID) setOrder(orderUUID);
      } else {
         setOrder(orderData);
      }

      // 2. Fetch "Relevant Products" (Simple Recommendation Engine)
      // Fetches 4 random products to show as "Complete Your Setup"
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, image_url, category, brand')
        .limit(4);
      
      if (products) setRecommendations(products);
      
      setLoading(false);
    };

    fetchOrderDetails();
  }, [orderId, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <div className="text-brand-purple font-orbitron text-xl animate-pulse tracking-widest">INITIALIZING ORDER DATA...</div>
    </div>
  );

  if (!order) return null;

  return (
    <div className="flex-grow pt-32 pb-24 px-[20px] md:px-[40px] xl:px-[100px] relative z-10">
        
        {/* --- HERO: SUCCESS MESSAGE --- */}
        <div className="text-center mb-16">
            <Reveal>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500 mb-6 ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <FaCheckCircle size={40} />
                </div>
                <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4 uppercase tracking-wide">
                    Order <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Confirmed</span>
                </h1>
                <p className="text-brand-silver text-lg max-w-2xl mx-auto">
                    Thank you, <span className="text-white font-bold">{order.shipping_address?.fullName || "Builder"}</span>. 
                    Your gear has been secured. We have sent a confirmation email to <span className="text-brand-purple">{order.customer_email || order.shipping_address?.email}</span>.
                </p>
                <div className="mt-4 inline-block bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded text-sm text-brand-silver font-mono">
                    Order ID: <span className="text-white font-bold tracking-wider">{order.display_id || order.id}</span>
                </div>
            </Reveal>
        </div>

        {/* --- GRID: DETAILS & RECEIPT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto mb-24">
            
            {/* LEFT: ORDER ITEMS */}
            <div className="lg:col-span-2 space-y-6">
                <Reveal delay={0.1}>
                    <h2 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <FaBox className="text-brand-purple" /> Your Armory
                    </h2>
                    <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden">
                        {/* NOTE: Assuming order.items is a JSON array stored during checkout.
                           If you use a separate table, you might need to map 'order.order_items' instead.
                        */}
                        {order.items && Array.isArray(order.items) ? order.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <div className="w-16 h-16 bg-[#000] rounded-lg border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-white font-bold text-sm md:text-base line-clamp-1">{item.name}</h4>
                                    <p className="text-xs text-brand-silver uppercase tracking-wider">{item.category} • Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-white font-bold font-saira">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-6 text-brand-silver text-sm">Items details are being processed...</div>
                        )}
                        
                        <div className="p-6 bg-black/20 flex justify-between items-center">
                            <span className="text-brand-silver uppercase tracking-widest text-xs font-bold">Total Amount Paid</span>
                            <span className="text-2xl font-orbitron font-bold text-white">₹{order.amount?.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </Reveal>
            </div>

            {/* RIGHT: SHIPPING INFO */}
            <div className="lg:col-span-1">
                <Reveal delay={0.2}>
                    <h2 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <FaMapMarkerAlt className="text-brand-blue" /> Shipping To
                    </h2>
                    <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/10 blur-[50px] rounded-full transition-all group-hover:bg-brand-blue/20" />
                        
                        <div className="relative z-10 space-y-1 text-sm">
                            <p className="text-white font-bold text-lg mb-2">{order.shipping_address?.fullName}</p>
                            <p className="text-brand-silver">{order.shipping_address?.addressLine1}</p>
                            {order.shipping_address?.addressLine2 && <p className="text-brand-silver">{order.shipping_address?.addressLine2}</p>}
                            <p className="text-brand-silver">
                                {order.shipping_address?.city}, {order.shipping_address?.state} - <span className="text-white font-mono">{order.shipping_address?.pincode}</span>
                            </p>
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-brand-silver text-xs uppercase tracking-wider mb-1">Contact</p>
                                <p className="text-white">{order.shipping_address?.phone}</p>
                                <p className="text-white">{order.shipping_address?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link href="/" className="block w-full py-4 bg-brand-purple hover:bg-white hover:text-black text-white text-center font-orbitron font-bold uppercase tracking-widest rounded transition-all shadow-lg hover:shadow-brand-purple/50">
                            Continue Shopping
                        </Link>
                    </div>
                </Reveal>
            </div>
        </div>

        {/* --- SECTION: RELEVANT PRODUCTS --- */}
        <div className="border-t border-white/10 pt-16 max-w-7xl mx-auto">
            <Reveal>
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h3 className="text-2xl font-orbitron font-bold text-white mb-2">COMPLETE YOUR <span className="text-brand-purple">SETUP</span></h3>
                        <p className="text-brand-silver text-sm">Recommended upgrades for your new hardware.</p>
                    </div>
                    <Link href="/products" className="hidden md:flex items-center gap-2 text-brand-purple hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                        View All <FaArrowRight />
                    </Link>
                </div>
            </Reveal>

            <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                    <StaggerItem key={product.id}>
                        <Link href={`/product/${product.id}`} className="group bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden hover:border-brand-purple/50 hover:shadow-[0_0_20px_rgba(78,44,139,0.2)] transition-all block h-full">
                            <div className="h-48 bg-gradient-to-b from-white/5 to-transparent p-6 flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-brand-purple/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src={product.image_url} alt={product.name} className="h-full object-contain relative z-10 transform group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="p-5 bg-[#151515] group-hover:bg-[#181818] transition-colors border-t border-white/5">
                                <div className="text-[10px] text-brand-purple font-bold uppercase mb-1">{product.brand}</div>
                                <h4 className="text-white font-bold truncate mb-2 group-hover:text-brand-purple transition-colors">{product.name}</h4>
                                <div className="flex justify-between items-center">
                                    <div className="text-lg font-orbitron font-bold">₹{product.price.toLocaleString("en-IN")}</div>
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-brand-purple group-hover:text-white transition-all">
                                        <FaShoppingCart size={12} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </StaggerItem>
                ))}
            </StaggerGrid>
        </div>
    </div>
  );
}

// Main Page Component
export default function OrderSuccessPage() {
  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-[600px] bg-brand-purple/5 blur-[150px] pointer-events-none z-0" />
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
            <div className="text-brand-purple font-orbitron animate-pulse">LOADING RECEIPT...</div>
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}