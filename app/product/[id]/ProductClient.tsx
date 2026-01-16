"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaStar, FaShoppingCart, FaBolt, FaChevronRight, FaChevronLeft, FaHome, FaRegStar,
  FaExchangeAlt, FaShieldAlt, FaTruck, FaHandHoldingUsd // <--- NEW ICONS ADDED
} from "react-icons/fa";
import { Reveal } from "@/components/ui/MotionWrappers";
import { toast } from "sonner"; 
import ProductBreadcrumb from "@/components/ProductBreadcrumb";


interface ProductClientProps {
    initialProduct: any;
    id: string;
}

export default function ProductClient({ initialProduct, id }: ProductClientProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  
  // Initialize with Server Data (Instant Load)
  const [product, setProduct] = useState<any>(initialProduct);
  const [activeImg, setActiveImg] = useState(initialProduct.image_url);

  // Client-only State
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [user, setUser] = useState<any>(null);

  // Fetch Secondary Data (User, Reviews, Related)
  useEffect(() => {
    const fetchSecondaryData = async () => {
      const [userRes, reviewsRes, relatedRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, price, image_url, category, brand').eq('category', initialProduct.category).neq('id', id).limit(4)
      ]);

      if (userRes.data.user) setUser(userRes.data.user);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (relatedRes.data) setRelatedProducts(relatedRes.data);
    };
    fetchSecondaryData();
  }, [id, initialProduct.category]);

  // --- HANDLERS ---
  const handleAction = (isBuyNow: boolean) => {
    addToCart({ ...product, image: product.image_url });
    if (isBuyNow) {
        router.push("/checkout");
    } else {
        toast.success("Added to Gear", {
            description: `${product.name} is secure in your cart.`,
            action: { label: "Checkout", onClick: () => router.push("/cart") }
        });
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  // Gallery Logic
  const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImg(allImages[(allImages.indexOf(activeImg) + 1) % allImages.length]);
  };
  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImg(allImages[(allImages.indexOf(activeImg) - 1 + allImages.length) % allImages.length]);
  };

  const isPreBuilt = product.category === 'prebuilt';

  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-brand-purple/10 blur-[180px] pointer-events-none z-0" />

      <Navbar />

      {/* --- REPLACEMENT BREADCRUMB --- */}
      <ProductBreadcrumb 
        category={product.category}
        name={product.name}
        series={product.series}
        tier={product.tier}
        breadcrumbName={product.breadcrumb_name}
      />

      <div className="flex-grow pt-12 pb-12 px-[20px] md:px-[40px] 2xl:px-[100px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 mb-24">
            
            {/* GALLERY */}
            <Reveal>
                <div className="flex flex-col-reverse md:flex-row gap-4 sticky top-32">
                    <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto w-full md:w-[90px] md:max-h-[600px] custom-scrollbar shrink-0">
                        {allImages.map((img: string, i: number) => (
                            <button key={i} onClick={() => setActiveImg(img)} className={`relative w-20 h-20 md:w-full md:h-24 rounded-lg border overflow-hidden transition-all ${activeImg === img ? "border-brand-purple opacity-100" : "border-white/10 opacity-50"}`}>
                                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full aspect-square bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden group">
                        <img src={activeImg} alt={product.name} className="w-full h-full object-contain z-10 group-hover:scale-105 transition-transform duration-500" />
                        {allImages.length > 1 && (
                            <>
                                <button onClick={handlePrevImg} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-brand-purple opacity-0 group-hover:opacity-100 transition-all"><FaChevronLeft /></button>
                                <button onClick={handleNextImg} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-brand-purple opacity-0 group-hover:opacity-100 transition-all"><FaChevronRight /></button>
                            </>
                        )}
                    </div>
                </div>
            </Reveal>

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
                    
                    <div className="flex items-end gap-4 mb-8 pb-4 border-b border-white/10">
                        <div className="text-2xl font-medium text-white font-saira">₹{product.price.toLocaleString("en-IN")}</div>
                        <div className="text-brand-silver text-sm mb-1">Inclusive of all taxes</div>
                    </div>

                    {/* MOVED: Description removed from here */}

                    <div className="mb-6 bg-[#1A1A1A]/50 p-6 rounded-xl border border-white/5">
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

                    {/* --- NEW SECTION: SERVICE HIGHLIGHTS --- */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-white/5 hover:border-brand-purple/30 transition-colors">
                            <FaExchangeAlt className="text-brand-purple text-lg mb-1" />
                            <span className="text-white text-xs font-bold uppercase">7 Days</span>
                            <span className="text-[10px] text-brand-silver">Replacement Policy</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-white/5 hover:border-brand-purple/30 transition-colors">
                            <FaShieldAlt className="text-brand-purple text-lg mb-1" />
                            <span className="text-white text-xs font-bold uppercase">{product.warranty_years || "3"} Years</span>
                            <span className="text-[10px] text-brand-silver">Official Warranty</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-white/5 hover:border-brand-purple/30 transition-colors">
                            <FaTruck className="text-brand-purple text-lg mb-1" />
                            <span className="text-white text-xs font-bold uppercase">Safe Shipping</span>
                            <span className="text-[10px] text-brand-silver">Insured Delivery</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-white/5 hover:border-brand-purple/30 transition-colors">
                            <FaHandHoldingUsd className="text-brand-purple text-lg mb-1" />
                            <span className="text-white text-xs font-bold uppercase">COD Available</span>
                            <span className="text-[10px] text-brand-silver">Pay on Delivery</span>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <button 
                            onClick={() => handleAction(false)} 
                            disabled={!product.in_stock} 
                            /* FIX: Added 'px-4' to prevent icon from touching the left edge on mobile */
                            className="flex-1 py-5 px-4 border border-white/20 hover:border-white hover:bg-white hover:text-black font-orbitron font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            <FaShoppingCart /> <span className="truncate">Add to Cart</span>
                        </button>
                        
                        <button 
                            onClick={() => handleAction(true)} 
                            disabled={!product.in_stock} 
                            className="flex-1 py-5 px-4 bg-brand-purple hover:bg-white hover:text-black text-white font-orbitron font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(78,44,139,0.4)] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
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

        {/* --- MOVED SECTION: PRODUCT DESCRIPTION --- */}
        <div className="mb-24 max-w-4xl mx-auto border-t border-white/10 pt-12">
            <Reveal>
                <h3 className="font-orbitron font-bold text-xl mb-6 text-white uppercase tracking-widest">Product <span className="text-brand-purple">Description</span></h3>
                <p className="text-brand-silver leading-loose whitespace-pre-line text-sm md:text-base font-light opacity-80">
                    {product.description}
                </p>
            </Reveal>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
            <div className="border-t border-white/10 pt-16 pb-20">
                <h3 className="font-orbitron font-bold text-2xl mb-8 uppercase text-center">Related Gear</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((item) => (
                        <Link href={`/product/${item.id}`} key={item.id} className="group bg-[#151515] border border-white/5 rounded-xl p-4 hover:border-brand-purple/50 transition-all">
                            <div className="h-40 bg-[#0a0a0a] mb-4 flex items-center justify-center"><img src={item.image_url} className="h-full object-contain" /></div>
                            <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                            <div className="text-brand-silver">₹{item.price.toLocaleString("en-IN")}</div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        

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