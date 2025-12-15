"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  FaStar, FaShoppingCart, FaBolt, FaUser, FaChevronRight, FaHome, FaRegStar 
} from "react-icons/fa";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [user, setUser] = useState<any>(null);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. Get Main Product
      const { data: p } = await supabase.from('products').select('*').eq('id', id).single();
      
      if (p) {
        setProduct(p);
        setActiveImg(p.image_url);

        // 3. Get Related Products (Same Category, exclude current)
        const { data: related } = await supabase
            .from('products')
            .select('id, name, price, image_url, category, brand')
            .eq('category', p.category)
            .neq('id', p.id)
            .limit(6); // Fetch max 6 related items
        
        if (related) setRelatedProducts(related);
      }

      // 4. Get Reviews
      const { data: r } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
      if (r) setReviews(r);
      
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // --- HANDLERS ---
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
        user_name: user.user_metadata.full_name || "Verified Builder", 
        rating: newReview.rating, 
        comment: newReview.comment 
    });

    if (!error) {
        setNewReview({ rating: 5, comment: "" });
        // Refresh reviews
        const { data } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
        if (data) setReviews(data);
    } else {
        alert("Failed to post review.");
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
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      
     {/* --- BREADCRUMB NAVIGATOR --- */}
      <div className="pt-[40px] pb-4 px-[20px] md:px-[40px] 2xl:px-[100px] relative z-10 border-b border-white/5 bg-[#121212]">
          <div className="flex flex-wrap items-center gap-2 text-sm text-brand-silver font-medium">
              <Link href="/" className="hover:text-brand-purple transition-colors flex items-center gap-1"><FaHome /> Home</Link>
              <FaChevronRight size={10} className="opacity-50" />

              {/* LOGIC: Check if Prebuilt or Component */}
              {product.category === 'prebuilt' ? (
                  <>
                    <Link href="/products/prebuilt" className="hover:text-brand-purple transition-colors">Desktops</Link>
                    
                    {/* Series Level (e.g., Ascend Series) */}
                    {product.series && (
                        <>
                            <FaChevronRight size={10} className="opacity-50" />
                            <span className="capitalize">{product.series} Series</span>
                        </>
                    )}

                    {/* Tier Level (e.g., Ascend 5) */}
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
                    {/* Map common categories to nice names, else just capitalize */}
                    <Link href={`/products/${product.category}`} className="hover:text-brand-purple transition-colors capitalize">
                        {product.category === 'gpu' ? 'Graphics Card' : 
                         product.category === 'cpu' ? 'Processor' : 
                         product.category === 'psu' ? 'Power Supply' : 
                         product.category}
                    </Link>
                  </>
              )}

              {/* Current Product Name (Use Breadcrumb Name if set, else Product Name) */}
              <FaChevronRight size={10} className="opacity-50" />
              <span className="text-white truncate max-w-[200px] capitalize">
                  {product.breadcrumb_name ? product.breadcrumb_name : product.name.toLowerCase()}
              </span>
          </div>
      </div>

      <div className="flex-grow pt-12 pb-12 px-[20px] md:px-[40px] 2xl:px-[100px] relative z-10">
        
        {/* --- MAIN PRODUCT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 mb-24">
            
            {/* LEFT: CINEMATIC GALLERY */}
            <Reveal>
                <div className="space-y-6 sticky top-32">
                    {/* Main Stage */}
                    <div className="h-[400px] md:h-[500px] bg-gradient-to-b from-[#1A1A1A] to-[#121212] border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden relative group shadow-2xl">
                        
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-brand-purple/5 blur-[100px] opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        {activeImg ? (
                            <img 
                                src={activeImg} 
                                alt={product.name} 
                                className="max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-700 ease-out z-10" 
                            />
                        ) : (
                            <div className="text-white/20 font-orbitron text-4xl -rotate-12 select-none">{product.name}</div>
                        )}
                    </div>
                    
                    {/* Thumbnail Strip */}
                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                        {[product.image_url, ...(product.gallery_urls || [])].filter(Boolean).map((img: string, i: number) => (
                            <div 
                                key={i} 
                                onClick={() => setActiveImg(img)} 
                                className={`w-20 h-20 md:w-24 md:h-24 border rounded-lg cursor-pointer flex-shrink-0 bg-[#1A1A1A] overflow-hidden transition-all duration-300 relative group ${activeImg === img ? "border-brand-purple ring-2 ring-brand-purple/20" : "border-white/10 hover:border-white/30"}`}
                            >
                                <img src={img} alt="Thumbnail" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </div>
            </Reveal>

            {/* RIGHT: DETAILS PANEL */}
            <Reveal delay={0.2}>
                <div>
                    {/* Brand & Badge */}
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-brand-purple font-bold text-xs bg-brand-purple/10 px-3 py-1 rounded border border-brand-purple/20 uppercase tracking-widest">
                            {isPreBuilt ? `LEVEL ${product.tier || "X"}` : product.brand}
                        </span>
                        {product.in_stock ? (
                             <span className="text-green-500 text-xs font-bold flex items-center gap-1 uppercase tracking-wider"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> In Stock</span>
                        ) : (
                             <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                        )}
                    </div>

                    <h1 className="text-1xl md:text-3xl font-saira font-bold mb-4 leading-tight">{product.name}</h1>
                    
                    {/* Price Block */}
                    <div className="flex items-end gap-4 mb-4 pb-4 border-b border-white/10">
                        <div className="text-2xl font-medium text-white font-saira">₹{product.price.toLocaleString("en-IN")}</div>
                        <div className="text-brand-silver text-sm mb-1">Inclusive of all taxes</div>
                    </div>

                    <p className="text-brand-silver leading-relaxed mb-8 whitespace-pre-line text-lg font-light">{product.description}</p>

                    {/* DYNAMIC SPECS OR FEATURES */}
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
                                        <span className="text-brand-purple mt-1">✦</span> 
                                        <span>{feat}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-4 mb-8">
                        <button 
                            onClick={() => handleAction(false)} 
                            disabled={!product.in_stock}
                            className="flex-1 py-5 border border-white/20 hover:border-white hover:bg-white hover:text-black font-orbitron font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            <FaShoppingCart /> Add to Cart
                        </button>
                        <button 
                            onClick={() => handleAction(true)} 
                            disabled={!product.in_stock}
                            className="flex-1 py-5 bg-brand-purple hover:bg-white hover:text-black text-white font-orbitron font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(78,44,139,0.4)] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            Buy Now
                        </button>
                    </div>

                </div>
            </Reveal>
        </div>
        
        {/* --- SECTION: CINEMATIC VISUAL GALLERY --- */}
        <div className="mb-24 pt-16 border-t border-white/10">
            <Reveal>
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-orbitron font-bold text-white uppercase tracking-wider">
                        Visual <span className="text-brand-purple">Showcase</span>
                    </h2>
                    <p className="text-brand-silver text-sm mt-2"> immersive details </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px] md:h-[600px]">
                    {/* Hero Image (Large, Left) */}
                    <div className="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden border border-white/5 group bg-[#151515] flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60 z-10" />
                        
                        {/* FIX 1: Check if image exists before rendering */}
                        {product.image_url ? (
                            <img 
                                src={product.image_url} 
                                alt="Main Showcase" 
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transform group-hover:scale-105 transition-all duration-1000 ease-out relative z-0" 
                            />
                        ) : (
                            <div className="text-white/20 font-orbitron text-2xl -rotate-12">No Preview Available</div>
                        )}
                    </div>

                    {/* Secondary Images (Stacked, Right) */}
                    <div className="flex flex-col gap-4 h-full">
                        {/* FIX 2: Filter out empty strings before mapping */}
                        {(product.gallery_urls?.length ? product.gallery_urls : [product.image_url, product.image_url])
                            .filter((url: any) => url && url.length > 0) // <--- CRITICAL FIX
                            .slice(0, 2)
                            .map((img: string, i: number) => (
                            <div key={i} className="relative flex-1 rounded-2xl overflow-hidden border border-white/5 group bg-[#151515] flex items-center justify-center">
                                <img 
                                    src={img} 
                                    alt={`Detail ${i}`} 
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-700" 
                                />
                            </div>
                        ))}
                        
                        {/* Fallback if no side images exist to fill the space */}
                        {(!product.gallery_urls || product.gallery_urls.length === 0) && !product.image_url && (
                             <div className="flex-1 rounded-2xl border border-white/5 bg-[#151515]"></div>
                        )}
                    </div>
                </div>
            </Reveal>
        </div>

        {/* --- SECTION: RELATED PRODUCTS (Carousel) --- */}
        {relatedProducts.length > 0 && (
            <div className="mb-24 border-t border-white/10 pt-16">
                <h2 className="text-2xl font-orbitron font-bold mb-8 text-white uppercase tracking-wider flex items-center gap-3">
                    <span className="w-1 h-8 bg-brand-purple block"></span> 
                    Similar Components
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((rp) => (
                        <Link key={rp.id} href={`/product/${rp.id}`} className="group bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden hover:border-brand-purple/50 hover:shadow-[0_0_20px_rgba(78,44,139,0.2)] transition-all">
                            <div className="h-48 bg-gradient-to-b from-white/5 to-transparent p-4 flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-brand-purple/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src={rp.image_url} alt={rp.name} className="h-full object-contain relative z-10 transform group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="p-4 bg-[#151515] group-hover:bg-[#181818] transition-colors">
                                <div className="text-[10px] text-brand-purple font-bold uppercase mb-1">{rp.brand}</div>
                                <h4 className="text-white font-bold truncate mb-2 group-hover:text-brand-purple transition-colors">{rp.name}</h4>
                                <div className="text-lg font-orbitron font-bold">₹{rp.price.toLocaleString("en-IN")}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        {/* --- SECTION: REVIEWS --- */}
        <div className="border-t border-white/10 pt-16">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 
                 {/* Write Review */}
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
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm text-white focus:border-brand-purple outline-none h-32 resize-none"
                                    placeholder="Tell us what you think about this product..."
                                    value={newReview.comment}
                                    onChange={e => setNewReview({...newReview, comment: e.target.value})}
                                    required
                                />
                            </div>
                            <button className="w-full bg-white text-black font-bold uppercase py-3 rounded hover:bg-brand-purple hover:text-white transition-all text-xs tracking-widest">
                                Submit Review
                            </button>
                        </form>
                     </div>
                 </div>

                 {/* Read Reviews */}
                 <div className="lg:col-span-2">
                     <h3 className="font-orbitron font-bold text-xl mb-6 uppercase tracking-wider flex items-center justify-between">
                         Customer Reviews <span className="text-sm font-saira text-brand-silver bg-white/5 px-3 py-1 rounded-full">{reviews.length}</span>
                     </h3>
                     
                     {reviews.length === 0 ? (
                         <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                             <p className="text-brand-silver">No reviews yet. Be the first to share your thoughts!</p>
                         </div>
                     ) : (
                         <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                             {reviews.map((rev) => (
                                 <div key={rev.id} className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                     <div className="flex justify-between items-start mb-2">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-blue-600 flex items-center justify-center text-xs font-bold">
                                                 {rev.user_name.charAt(0)}
                                             </div>
                                             <div>
                                                 <h4 className="font-bold text-sm text-white">{rev.user_name}</h4>
                                                 <div className="flex text-yellow-400 text-[10px] gap-1">
                                                     {[...Array(5)].map((_, i) => (
                                                         i < rev.rating ? <FaStar key={i} /> : <FaRegStar key={i} className="text-white/20" />
                                                     ))}
                                                 </div>
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