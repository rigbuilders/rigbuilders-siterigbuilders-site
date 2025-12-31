"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
// import AuthModal from "@/components/AuthModal"; // <-- REMOVED
import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaStar, FaShoppingCart, FaBolt, FaChevronRight, FaChevronLeft, FaHome, FaRegStar 
} from "react-icons/fa";
import { Reveal } from "@/components/ui/MotionWrappers";
import { toast } from "sonner"; 

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const router = useRouter();
  
  // Data State
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeImg, setActiveImg] = useState("");
  // const [showAuthModal, setShowAuthModal] = useState(false); // <-- REMOVED
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [user, setUser] = useState<any>(null);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: p } = await supabase.from('products').select('*').eq('id', id).single();
      
      if (p) {
        setProduct(p);
        setActiveImg(p.image_url);

        const { data: related } = await supabase
            .from('products')
            .select('id, name, price, image_url, category, brand')
            .eq('category', p.category)
            .neq('id', p.id)
            .limit(6);
        
        if (related) setRelatedProducts(related);
      }

      const { data: r } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
      if (r) setReviews(r);
      
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // --- 2. UPDATED HANDLER (GUEST MODE ENABLED) ---
  const handleAction = (isBuyNow: boolean) => {
    // --- AUTH CHECK REMOVED ---
    // Guests can now proceed freely
    
    addToCart({ ...product, image: product.image_url });

    if (isBuyNow) {
        router.push("/checkout");
    } else {
        toast.success("Added to Gear", {
            description: `${product.name} is secure in your cart.`,
            action: {
                label: "Checkout",
                onClick: () => router.push("/cart")
            }
        });
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reviews still require login (this is standard practice)
    if (!user) { 
        toast.error("Login Required", { description: "Please sign in to leave a review." });
        return; 
    }
    
    const { error } = await supabase.from('reviews').insert({ 
        product_id: id, 
        user_id: user.id, 
        user_name: user.user_metadata.full_name || "Verified Builder", 
        rating: newReview.rating, 
        comment: newReview.comment 
    });

    if (!error) {
        setNewReview({ rating: 5, comment: "" });
        const { data } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
        if (data) setReviews(data);
        toast.success("Review Posted", { description: "Thanks for your feedback!" });
    } else {
        toast.error("Review Failed", { description: "Could not post your review." });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-brand-purple font-orbitron animate-pulse text-xl">LOADING COMPONENT DATA...</div>
    </div>
  );
  
  if (!product) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Product Not Found</div>;

  const isPreBuilt = product.category === 'prebuilt';

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-brand-purple/10 blur-[180px] pointer-events-none z-0" />

      <Navbar />
      {/* <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />  <-- REMOVED */}

      {/* --- BREADCRUMB NAVIGATOR --- */}
      <div className="pt-[40px] pb-4 px-[20px] md:px-[40px] 2xl:px-[100px] relative z-10 border-b border-white/5 bg-[#121212]">
          <div className="flex flex-wrap items-center gap-2 text-sm text-brand-silver font-medium">
              <Link href="/" className="hover:text-brand-purple transition-colors flex items-center gap-1"><FaHome /> Home</Link>
              <FaChevronRight size={10} className="opacity-50" />

              {product.category === 'prebuilt' ? (
                  <>
                    <Link href="/products/prebuilt" className="hover:text-brand-purple transition-colors">Desktops</Link>
                    {product.series && (
                        <>
                            <FaChevronRight size={10} className="opacity-50" />
                            <span className="capitalize">{product.series} Series</span>
                        </>
                    )}
                    {product.series && product.tier && (
                        <>
                            <FaChevronRight size={10} className="opacity-50" />
                            <span className="capitalize">{product.series} {product.tier}</span>
                        </>
                    )}
                  </>
              ) : (
                  <>
                    <Link href="/products" className="hover:text-brand-purple transition-colors">Components</Link>
                    <FaChevronRight size={10} className="opacity-50" />
                    <Link href={`/products/${product.category}`} className="hover:text-brand-purple transition-colors capitalize">
                        {product.category === 'gpu' ? 'Graphics Card' : 
                         product.category === 'cpu' ? 'Processor' : 
                         product.category === 'psu' ? 'Power Supply' : 
                         product.category}
                    </Link>
                  </>
              )}
              <FaChevronRight size={10} className="opacity-50" />
              <span className="text-white truncate max-w-[200px] capitalize">
                  {product.breadcrumb_name ? product.breadcrumb_name : product.name.toLowerCase()}
              </span>
          </div>
      </div>

      <div className="flex-grow pt-12 pb-12 px-[20px] md:px-[40px] 2xl:px-[100px] relative z-10">
        
        {/* --- MAIN PRODUCT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 mb-24">
            
           {/* LEFT: CINEMATIC GALLERY (Final: No Padding, Full Fit Square) */}
            <Reveal>
                {(() => {
                    const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
                    
                    const handleNext = () => {
                        const curr = allImages.indexOf(activeImg);
                        const next = (curr + 1) % allImages.length;
                        setActiveImg(allImages[next]);
                    };

                    const handlePrev = () => {
                        const curr = allImages.indexOf(activeImg);
                        const prev = (curr - 1 + allImages.length) % allImages.length;
                        setActiveImg(allImages[prev]);
                    };

                    return (
                        <div className="flex flex-col-reverse md:flex-row gap-4 sticky top-32">
                            
                            {/* 1. THUMBNAILS (Separate Column) */}
                            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto w-full md:w-[90px] md:max-h-[600px] custom-scrollbar shrink-0">
                                {allImages.map((img: string, i: number) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setActiveImg(img)} 
                                        className={`
                                            relative w-20 h-20 md:w-full md:h-24 rounded-lg cursor-pointer flex-shrink-0 
                                            bg-[#151515] border overflow-hidden transition-all duration-300
                                            ${activeImg === img ? "border-brand-purple opacity-100 ring-1 ring-brand-purple/50" : "border-white/10 opacity-50 hover:opacity-100 hover:border-white/20"}
                                        `}
                                    >
                                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>

                            {/* 2. MAIN IMAGE (Square & Full Fit) */}
                            {/* FIX: 'aspect-square' forces the 1:1 ratio. Removed all padding. */}
                            <div className="relative w-full aspect-square bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden group shadow-2xl">
                                
                                {/* Ambient Glow */}
                                <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* MAIN IMAGE */}
                                {activeImg ? (
                                    <img 
                                        src={activeImg} 
                                        alt={product.name} 
                                        // FIX: 'object-contain' + 'w-full h-full' ensures it touches edges if aspect ratio allows.
                                        // If you want to force fill even if it cuts off parts, change to 'object-cover'.
                                        className="w-full h-full object-contain z-10 transition-transform duration-500 ease-out group-hover:scale-105" 
                                    />
                                ) : (
                                    <div className="text-white/20 font-orbitron text-2xl -rotate-12 select-none">No Preview</div>
                                )}

                                {/* ARROWS */}
                                {allImages.length > 1 && (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#121212]/80 border border-white/10 text-white flex items-center justify-center hover:bg-brand-purple hover:border-brand-purple transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 duration-300 shadow-lg"
                                        >
                                            <FaChevronLeft size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#121212]/80 border border-white/10 text-white flex items-center justify-center hover:bg-brand-purple hover:border-brand-purple transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300 shadow-lg"
                                        >
                                            <FaChevronRight size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Reveal>

            {/* RIGHT: DETAILS PANEL */}
            <Reveal delay={0.2}>
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-brand-purple font-bold text-xs bg-brand-purple/10 px-3 py-1 rounded border border-brand-purple/20 uppercase tracking-widest">{isPreBuilt ? `LEVEL ${product.tier || "X"}` : product.brand}</span>
                        {product.in_stock ? (
                             <span className="text-green-500 text-xs font-bold flex items-center gap-1 uppercase tracking-wider"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> In Stock</span>
                        ) : (
                             <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                        )}
                    </div>

                    <h1 className="text-1xl md:text-3xl font-saira font-bold mb-4 leading-tight">{product.name}</h1>
                    
                    <div className="flex items-end gap-4 mb-4 pb-4 border-b border-white/10">
                        <div className="text-2xl font-medium text-white font-saira">₹{product.price.toLocaleString("en-IN")}</div>
                        <div className="text-brand-silver text-sm mb-1">Inclusive of all taxes</div>
                    </div>

                    <p className="text-brand-silver leading-relaxed mb-8 whitespace-pre-line text-lg font-light">{product.description}</p>

                    <div className="mb-10 bg-[#1A1A1A]/50 p-6 rounded-xl border border-white/5">
                        <h3 className="font-orbitron font-bold text-white mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
                            <FaBolt className="text-brand-purple" /> {isPreBuilt ? "System Specifications" : "Technical Highlights"}
                        </h3>
                        {isPreBuilt ? (
                            <div className="space-y-3 text-sm">
                                {Object.entries(product.specs || {}).map(([key, val]: any) => (
                                    <div key={key} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                        <span className="text-brand-silver uppercase tracking-wide text-xs font-bold">{key}</span>
                                        <span className="text-white font-medium text-right">{val}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {product.features?.map((feat: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-brand-silver">
                                        <span className="text-brand-purple mt-1">✦</span><span>{feat}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 mb-8">
                        <button onClick={() => handleAction(false)} disabled={!product.in_stock} className="flex-1 py-5 border border-white/20 hover:border-white hover:bg-white hover:text-black font-orbitron font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded">
                            <FaShoppingCart /> Add to Cart
                        </button>
                        <button onClick={() => handleAction(true)} disabled={!product.in_stock} className="flex-1 py-5 bg-brand-purple hover:bg-white hover:text-black text-white font-orbitron font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(78,44,139,0.4)] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed rounded">
                            Buy Now
                        </button>
                    </div>

                </div>
            </Reveal>
        </div>
        
        
        {/* --- SECTION: CINEMATIC VISUAL GALLERY --- */}
        <div className="mb-24 pt-16 border-t border-white/10 relative z-10">
            <Reveal>
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-orbitron font-bold text-white uppercase tracking-wider">PRODUCT <span className="text-brand-purple">GALLERY</span></h2>
                </div>
                
                {/* FIX: Removed fixed height on container. Used 'h-auto' so the container MUST expand to fit the children.
                    We now control height via the children elements directly. */}
                <div className="flex flex-col md:grid md:grid-cols-3 gap-4 h-auto">
                    
                    {/* Main Image:
                        - Mobile: h-[400px] 
                        - Desktop: h-[600px] (Explicit height prevents collapse)
                    */}
                    <div className="w-full h-[400px] md:h-[600px] md:col-span-2 relative rounded-2xl overflow-hidden border border-white/5 group bg-[#151515] flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60 z-10" />
                        {product.image_url ? (
                            <img src={product.image_url} alt="Main Showcase" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transform group-hover:scale-105 transition-all duration-1000 ease-out relative z-0" />
                        ) : (
                            <div className="text-white/20 font-orbitron text-2xl -rotate-12">No Preview Available</div>
                        )}
                    </div>

                    {/* Side Images Column:
                        - Mobile: h-[300px] 
                        - Desktop: h-[600px] (Matches main image height)
                    */}
                    <div className="w-full h-[300px] md:h-[600px] flex flex-col gap-4">
                        {(product.gallery_urls?.length ? product.gallery_urls : [product.image_url, product.image_url])
                            .filter((url: any) => url && url.length > 0)
                            .slice(0, 2)
                            .map((img: string, i: number) => (
                            <div key={i} className="relative flex-1 rounded-2xl overflow-hidden border border-white/5 group bg-[#151515] flex items-center justify-center">
                                <img src={img} alt={`Detail ${i}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-700" />
                            </div>
                        ))}
                    </div>
                </div>
            </Reveal>
        </div>

        {/* --- SECTION: REVIEWS (Login Required Check is Inside submitReview) --- */}
        <div className="border-t border-white/10 pt-16">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 <div className="lg:col-span-1">
                     <h3 className="font-orbitron font-bold text-xl mb-6 uppercase tracking-wider">Write a Review</h3>
                     <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                        <form onSubmit={submitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-brand-silver font-bold mb-2">Rating</label>
                                <div className="flex gap-2 text-brand-purple text-lg">
                                    {[1,2,3,4,5].map(star => (
                                        <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})}>
                                            {star <= newReview.rating ? <FaStar /> : <FaRegStar className="text-white/20" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-brand-silver font-bold mb-2">Your Experience</label>
                                <textarea className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm text-white focus:border-brand-purple outline-none h-32 resize-none" placeholder="Tell us what you think about this product..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} required />
                            </div>
                            <button className="w-full bg-white text-black font-bold uppercase py-3 rounded hover:bg-brand-purple hover:text-white transition-all text-xs tracking-widest">Submit Review</button>
                        </form>
                     </div>
                 </div>
                 <div className="lg:col-span-2">
                     <h3 className="font-orbitron font-bold text-xl mb-6 uppercase tracking-wider flex items-center justify-between">Customer Reviews <span className="text-sm font-saira text-brand-silver bg-white/5 px-3 py-1 rounded-full">{reviews.length}</span></h3>
                     {reviews.length === 0 ? (
                         <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5"><p className="text-brand-silver">No reviews yet. Be the first to share your thoughts!</p></div>
                     ) : (
                         <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                             {reviews.map((rev) => (
                                 <div key={rev.id} className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                     <div className="flex justify-between items-start mb-2">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-blue-600 flex items-center justify-center text-xs font-bold">{rev.user_name.charAt(0)}</div>
                                             <div>
                                                 <h4 className="font-bold text-sm text-white">{rev.user_name}</h4>
                                                 <div className="flex text-yellow-400 text-[10px] gap-1">{[...Array(5)].map((_, i) => i < rev.rating ? <FaStar key={i} /> : <FaRegStar key={i} className="text-white/20" />)}</div>
                                             </div>
                                         </div>
                                         <span className="text-[10px] text-brand-silver">{new Date(rev.created_at).toLocaleDateString()}</span>
                                     </div>
                                     <p className="text-brand-silver text-sm pl-11">{rev.comment}</p>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}