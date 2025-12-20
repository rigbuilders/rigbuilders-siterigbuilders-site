"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaCheckCircle, FaArrowRight } from "react-icons/fa";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (!orderId) {
        router.push("/");
        return;
    }

    const fetchRecommendations = async () => {
      // Simple fetch for random products to show "Complete the Setup"
      // This is public data, so it will ALWAYS work (Guest or User)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, image_url, category, brand')
        .limit(4);
      
      if (products) setRecommendations(products);
    };

    fetchRecommendations();
  }, [orderId, router]);

  return (
    <div className="flex-grow pt-32 pb-24 px-[20px] md:px-[40px] xl:px-[100px] relative z-10">
        
        {/* --- HERO: PURE SUCCESS --- */}
        <div className="text-center mb-32">
            <Reveal>
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 text-green-500 mb-8 ring-1 ring-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-pulse-slow">
                    <FaCheckCircle size={48} />
                </div>
                <h1 className="text-5xl md:text-6xl font-orbitron font-bold text-white mb-6 uppercase tracking-wide">
                    ORDER <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">CONFIRMED</span>
                </h1>
                <p className="text-brand-silver text-lg max-w-xl mx-auto font-light mb-8">
                    Your equipment has been secured and is entering the assembly queue.
                    A confirmation email with full details has been sent to your E-mail address.
                </p>

                {/* --- ORDER ID DISPLAY --- */}
              
            </Reveal>
        </div>

        {/* --- SECTION: RECOMMENDATIONS (COMPLETE THE SETUP) --- */}
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