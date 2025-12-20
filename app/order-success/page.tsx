"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaCheckCircle, FaArrowRight, FaCube, FaShoppingCart } from "react-icons/fa";

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
      // 1. Attempt to fetch the Order
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('display_id', orderId)
        .single();

      if (!error && orderData) {
         setOrder(orderData);
      } else {
         // Fallback by UUID
         const { data: orderUUID } = await supabase.from('orders').select('*').eq('id', orderId).single();
         if (orderUUID) setOrder(orderUUID);
      }

      // 2. Fetch Recommendations (Random "Complete Setup" items)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, image_url, category, brand')
        .limit(4);
      
      if (products) setRecommendations(products);
      
      setLoading(false);
    };

    fetchOrderDetails();
  }, [orderId, router]);

  // LOADING STATE
  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white pt-24">
        <div className="text-brand-purple font-orbitron text-xl animate-pulse tracking-widest mb-4">SECURING ASSETS...</div>
    </div>
  );

  return (
    <div className="flex-grow pt-32 pb-24 px-[20px] md:px-[40px] xl:px-[100px] relative z-10">
        
        {/* --- HERO: PURE SUCCESS --- */}
        <div className="text-center mb-24">
            <Reveal>
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 text-green-500 mb-8 ring-1 ring-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-pulse-slow">
                    <FaCheckCircle size={48} />
                </div>
                <h1 className="text-5xl md:text-6xl font-orbitron font-bold text-white mb-6 uppercase tracking-wide">
                    ORDER <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">CONFIRMED</span>
                </h1>
                <p className="text-brand-silver text-lg max-w-xl mx-auto font-light">
                    Your equipment has been secured and is entering the assembly queue.
                </p>
            </Reveal>
        </div>

        {/* --- SECTION: CINEMATIC ARMORY (Purchased Items) --- */}
        {/* Only show if we successfully fetched the order items */}
        {order && order.items && order.items.length > 0 && (
            <div className="max-w-7xl mx-auto mb-32">
                <Reveal>
                    <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-4">
                        <FaCube className="text-brand-purple text-xl" />
                        <h2 className="text-2xl font-orbitron font-bold text-white tracking-widest">
                            ACQUIRED <span className="text-brand-purple">GEAR</span>
                        </h2>
                    </div>
                </Reveal>

                <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {order.items.map((item: any, i: number) => (
                        <StaggerItem key={i}>
                            <div className="group relative h-[350px] bg-[#151515] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple/50 transition-all duration-500 flex flex-col">
                                
                                {/* Image Stage */}
                                <div className="flex-grow relative flex items-center justify-center p-8 bg-gradient-to-b from-white/5 to-transparent">
                                    <div className="absolute inset-0 bg-brand-purple/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    {item.image ? (
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="relative z-10 max-h-full max-w-full object-contain drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                                        />
                                    ) : (
                                        <div className="text-white/20 font-orbitron text-4xl -rotate-12 select-none">RB</div>
                                    )}
                                </div>

                                {/* Details Panel */}
                                <div className="relative z-20 bg-[#1A1A1A] p-6 border-t border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-[10px] text-brand-purple font-bold uppercase tracking-[0.2em] mb-1">{item.category || "COMPONENT"}</p>
                                            <h3 className="text-white font-bold font-orbitron text-lg leading-tight line-clamp-1 group-hover:text-brand-purple transition-colors">
                                                {item.name}
                                            </h3>
                                        </div>
                                        <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
                                            x{item.quantity}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerGrid>
            </div>
        )}

        {/* --- SECTION: RECOMMENDATIONS --- */}
        <div className="border-t border-white/10 pt-16 max-w-7xl mx-auto">
            <Reveal>
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <h3 className="text-xl font-orbitron font-bold text-white mb-2 tracking-widest">
                            COMPLETE THE <span className="text-brand-purple">SETUP</span>
                        </h3>
                        <p className="text-brand-silver text-sm">Recommended peripherals for your new build.</p>
                    </div>
                    <Link href="/products" className="flex items-center gap-2 text-white hover:text-brand-purple transition-colors text-xs font-bold uppercase tracking-[0.2em] border border-white/20 px-6 py-3 rounded hover:border-brand-purple hover:bg-brand-purple/10">
                        View Full Inventory <FaArrowRight />
                    </Link>
                </div>
            </Reveal>

            <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {recommendations.map((product) => (
                    <StaggerItem key={product.id}>
                        <Link href={`/product/${product.id}`} className="group bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden hover:border-brand-purple/50 transition-all block h-full">
                            <div className="h-40 bg-gradient-to-b from-white/5 to-transparent p-4 flex items-center justify-center relative">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="h-full object-contain relative z-10 transform group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <span className="text-white/10 font-orbitron">NO IMG</span>
                                )}
                            </div>
                            <div className="p-4 bg-[#151515] border-t border-white/5">
                                <h4 className="text-white text-xs font-bold truncate group-hover:text-brand-purple transition-colors mb-1">{product.name}</h4>
                                <div className="text-brand-silver font-orbitron text-sm">₹{product.price.toLocaleString("en-IN")}</div>
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
        <div className="min-h-screen flex items-center justify-center text-white pt-20">
            <div className="text-brand-purple font-orbitron animate-pulse">LOADING...</div>
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}