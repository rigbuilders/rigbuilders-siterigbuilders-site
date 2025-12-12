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

    const { error } = await supabase.from('reviews').insert({
        product_id: id,
        user_id: user.id,
        user_name: user.user_metadata.full_name || "Verified User",
        rating: newReview.rating,
        comment: newReview.comment
    });

    if (!error) {
        alert("Review Submitted!");
        setNewReview({ rating: 5, comment: "" });
        const { data } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
        if (data) setReviews(data);
    } else {
        alert("Error submitting review.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Product Not Found</div>;

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="flex-grow pt-32 pb-12 px-[40px] 2xl:px-[100px] max-w-7xl mx-auto w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="space-y-4">
                <div className="h-[400px] bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden relative">
                    {activeImg ? (
                        <img src={activeImg} alt={product.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <div className="text-white/20 font-orbitron text-4xl -rotate-12">{product.name}</div>
                    )}
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
                    <span className="text-brand-purple font-bold text-sm bg-brand-purple/10 px-3 py-1 rounded">{product.category.toUpperCase()}</span>
                    <span className="text-brand-silver text-sm">{product.brand}</span>
                </div>

                <div className="text-3xl font-bold mb-6">₹{product.price.toLocaleString("en-IN")}</div>

                <p className="text-brand-silver leading-relaxed mb-8 whitespace-pre-line">{product.description || "No description available for this premium component."}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {product.features?.map((feat: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                            <span className="text-brand-purple">•</span> {feat}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={() => handleAction(false)} className="flex-1 py-4 border border-white hover:bg-white hover:text-black font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                        <FaShoppingCart /> Add to Cart
                    </button>
                    <button onClick={() => handleAction(true)} className="flex-1 py-4 bg-brand-purple hover:bg-white hover:text-black text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                        <FaBolt /> Buy Now
                    </button>
                </div>
            </div>
        </div>

        <div className="border-t border-white/10 pt-12">
            <h2 className="font-orbitron text-2xl font-bold mb-8">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="bg-[#1A1A1A] p-6 rounded-xl h-fit">
                    <h3 className="font-bold mb-4">Write a Review</h3>
                    <form onSubmit={submitReview} className="space-y-4">
                        <div>
                            <label className="text-xs text-brand-silver block mb-1">Rating</label>
                            <select value={newReview.rating} onChange={e => setNewReview({...newReview, rating: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 p-2 rounded text-sm text-white">
                                <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                                <option value="4">⭐⭐⭐⭐ (Good)</option>
                                <option value="3">⭐⭐⭐ (Average)</option>
                                <option value="2">⭐⭐ (Poor)</option>
                                <option value="1">⭐ (Bad)</option>
                            </select>
                        </div>
                        <textarea placeholder="Share your experience..." required className="w-full bg-black/50 border border-white/10 p-3 rounded text-sm h-32 focus:border-brand-purple outline-none text-white" value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} />
                        <button className="w-full bg-white/10 hover:bg-brand-purple text-white py-2 rounded font-bold transition-all">Submit Review</button>
                    </form>
                </div>
                <div className="md:col-span-2 space-y-6">
                    {reviews.length === 0 ? (
                        <p className="text-brand-silver italic">No reviews yet. Be the first to review!</p>
                    ) : reviews.map((rev) => (
                        <div key={rev.id} className="border-b border-white/5 pb-6 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-brand-purple/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-purple"><FaUser /></div>
                                <div><p className="font-bold text-sm">{rev.user_name}</p><div className="flex text-yellow-500 text-xs">{[...Array(rev.rating)].map((_, i) => <FaStar key={i} />)}</div></div>
                                <span className="ml-auto text-xs text-brand-silver">{new Date(rev.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-white/80 text-sm pl-11">{rev.comment}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}