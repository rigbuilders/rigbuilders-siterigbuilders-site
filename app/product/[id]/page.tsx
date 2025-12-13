"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import { FaStar, FaShoppingCart, FaBolt, FaUser } from "react-icons/fa";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: p } = await supabase.from('products').select('*').eq('id', id).single();
      if (p) {
        setProduct(p);
        setActiveImg(p.image_url);
      }

      const { data: r } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
      if (r) setReviews(r);
      
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleAction = (isBuyNow: boolean) => {
    if (!user) { setShowAuthModal(true); return; }
    addToCart({ ...product, image: product.image_url });
    if (isBuyNow) router.push("/checkout");
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowAuthModal(true); return; }
    const { error } = await supabase.from('reviews').insert({ product_id: id, user_id: user.id, user_name: user.user_metadata.full_name || "User", rating: newReview.rating, comment: newReview.comment });
    if (!error) {
        setNewReview({ rating: 5, comment: "" });
        const { data } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
        if (data) setReviews(data);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Product Not Found</div>;

  const isPreBuilt = product.category === 'prebuilt';

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="flex-grow pt-32 pb-12 px-[40px] 2xl:px-[100px] max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="space-y-4">
                <div className="h-[400px] bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden relative">
                    {activeImg ? <img src={activeImg} alt={product.name} className="max-h-full max-w-full object-contain" /> : <div className="text-white/20 font-orbitron text-4xl -rotate-12">{product.name}</div>}
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {[product.image_url, ...(product.gallery_urls || [])].filter(Boolean).map((img: string, i: number) => (
                        <div key={i} onClick={() => setActiveImg(img)} className={`w-20 h-20 border rounded cursor-pointer flex-shrink-0 bg-white/5 overflow-hidden ${activeImg === img ? "border-brand-purple" : "border-white/10"}`}>
                            <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h1 className="text-3xl font-orbitron font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-brand-purple font-bold text-sm bg-brand-purple/10 px-3 py-1 rounded">
                        {isPreBuilt ? `LEVEL ${product.tier || "X"}` : product.category.toUpperCase()}
                    </span>
                    <span className="text-brand-silver text-sm">{product.brand}</span>
                </div>

                <div className="text-3xl font-bold mb-6">₹{product.price.toLocaleString("en-IN")}</div>
                <p className="text-brand-silver leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>

                {/* DYNAMIC SPECS OR COMPONENTS LIST */}
                <div className="mb-8">
                    <h3 className="font-bold text-white mb-4 border-b border-white/10 pb-2">{isPreBuilt ? "System Specifications" : "Key Features"}</h3>
                    
                    {isPreBuilt ? (
                        <div className="space-y-2 text-sm">
                            {Object.entries(product.specs || {}).map(([key, val]: any) => (
                                <div key={key} className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-brand-silver">{key}</span>
                                    <span className="text-white font-bold">{val}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {product.features?.map((feat: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-white/80"><span className="text-brand-purple">•</span> {feat}</div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button onClick={() => handleAction(false)} className="flex-1 py-4 border border-white hover:bg-white hover:text-black font-bold uppercase transition-all flex items-center justify-center gap-2">Add to Cart</button>
                    <button onClick={() => handleAction(true)} className="flex-1 py-4 bg-brand-purple hover:bg-white hover:text-black text-white font-bold uppercase transition-all flex items-center justify-center gap-2">Buy Now</button>
                </div>
            </div>
        </div>
        
        {/* Reviews Section Omitted for brevity (Same as before) */}
      </div>
      <Footer />
    </div>
  );
}