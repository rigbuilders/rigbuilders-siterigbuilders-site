"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaStar, FaShoppingCart, FaBolt, FaChevronRight, FaChevronLeft, FaHome, FaRegStar,
  FaExchangeAlt, FaShieldAlt, FaTruck, FaHandHoldingUsd, FaInfoCircle
} from "react-icons/fa";
import { Reveal } from "@/components/ui/MotionWrappers";
import { toast } from "sonner"; 
import ProductBreadcrumb from "@/components/ProductBreadcrumb";
import { addRecentView } from "@/lib/recentViews";

// --- IMPORT THE NEW VARIANT SELECTOR ---
import VariantSelector from "./components/VariantSelector"; 

interface ProductClientProps {
    initialProduct: any;
    id: string;
}

export default function ProductClient({ initialProduct, id }: ProductClientProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  
  // Initialize with Server Data (Instant Load)
  const [product, setProduct] = useState<any>(initialProduct);
  const [activeImg, setActiveImg] = useState(initialProduct.image_url || initialProduct.gallery_urls?.[0] || "");

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

  // Record a view: global counter (RPC), browser-cache recents, and per-user
  // history when signed in. Powers the homepage "components picker".
  useEffect(() => {
    if (!id) return;
    const cat = initialProduct.category ?? null;
    addRecentView(id, cat);
    supabase.rpc("increment_product_view", { pid: id, cat });
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from("user_views").upsert(
          { user_id: data.user.id, product_id: id, category: cat, viewed_at: new Date().toISOString() },
          { onConflict: "user_id,product_id" }
        );
      }
    })();
  }, [id, initialProduct.category]);

   // Handlers
   const handleAction = (isBuyNow: boolean) => {
    addToCart({ 
        ...product, 
        image: product.image_url,
        // Pass COD Policy to Cart
        cod_policy: product.cod_policy || 'full_cod' 
    });
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
  // Gallery Logic
  const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
  
  const handleNextImg = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setActiveImg(allImages[(allImages.indexOf(activeImg) + 1) % allImages.length]);
  };
  
  const handlePrevImg = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setActiveImg(allImages[(allImages.indexOf(activeImg) - 1 + allImages.length) % allImages.length]);
  };

  // --- SWIPE LOGIC ---
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50; // Minimum pixel distance to trigger swipe

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance) handleNextImg();
    if (distance < -minSwipeDistance) handlePrevImg();
  };

  const isPreBuilt = product.category === 'prebuilt';
  
  // SEO Schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": [product.image_url, ...(product.gallery_urls || [])],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Rig Builders"
    },
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : `https://www.rigbuilders.in/product/${id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "INR" }, 
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "IN" },
        "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "d" },
            "transitTime": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 7, "unitCode": "d" }
        }
      }
    },
    ...(reviews.length > 0 && {
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
            "reviewCount": reviews.length
        }
    })
  };

  return (
    <div className="bg-rb-black min-h-screen text-white font-saira flex flex-col relative">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-rb-orange/10 blur-[180px] pointer-events-none z-0" />

      <NavbarNeo />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Breadcrumb Navigation */}
        <ProductBreadcrumb
          category={product.category}
          name={product.name}
          series={product.series}
          tier={product.tier}
          breadcrumbName={product.breadcrumb_name}
        />

        <div className="flex-grow pt-6 pb-16 rb-shell relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 mb-24 items-start">

            {/* GALLERY */}
            <Reveal>
                <div className="flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-24 items-start">
                    
                    {/* Thumbnails (Scrollbar completely hidden via CSS) */}
                    <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto w-full md:w-[90px] md:max-h-[700px] shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {allImages.map((img: string, i: number) => (
                            <button key={i} onClick={() => setActiveImg(img)} className={`relative w-20 h-20 md:w-[90px] md:h-[90px] rounded-lg border overflow-hidden transition-all shrink-0 ${activeImg === img ? "border-rb-orange opacity-100" : "border-white/10 opacity-50 hover:opacity-100"}`}>
                                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    
                    {/* Main Image Container (Perfectly fits the 50% grid column) */}
                    <div 
                        className="relative w-full aspect-square bg-rb-black border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden group touch-pan-y"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {activeImg ? (
                            <img
                                src={activeImg}
                                alt={product.name}
                                className="w-full h-full object-cover z-10 group-hover:scale-[1.12] transition-transform duration-500 select-none"
                                draggable={false}
                            />
                        ) : (
                            <span className="text-rb-silver/20 font-saira text-3xl font-bold -rotate-12 select-none px-6 text-center">{product.name}</span>
                        )}
                        {allImages.length > 1 && (
                            <>
                                <button onClick={handlePrevImg} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rb-orange opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer">
                                    <FaChevronLeft />
                                </button>
                                <button onClick={handleNextImg} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rb-orange opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer">
                                    <FaChevronRight />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </Reveal>

            {/* RIGHT: DETAILS */}
            <Reveal delay={0.2}>
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-rb-orange font-bold text-xs bg-rb-orange/10 px-3 py-1 rounded border border-rb-orange/20 uppercase tracking-widest">{isPreBuilt ? `LEVEL ${product.tier || "X"}` : product.brand}</span>
                        {product.in_stock ? (
                             <span className="text-rb-success text-xs font-bold flex items-center gap-1 uppercase tracking-wider"><span className="w-2 h-2 bg-rb-success rounded-full animate-pulse"/> In Stock</span>
                        ) : (
                             <span className="text-rb-danger text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                        )}
                    </div>

                    <h1 className="text-1xl md:text-3xl font-saira font-bold mb-4 leading-tight">{product.name}</h1>
                    
                    {/* Price Block */}
                    <div className="mb-8 pb-4 border-b border-white/10">
                        <div className="flex items-end gap-3 mb-1">
                            <div className="text-3xl font-medium text-white font-saira">₹{Number(product.price || 0).toLocaleString("en-IN")}</div>
                            <div className="text-xl text-white/30 line-through font-saira">
                                ₹{(product.mrp || Math.round(product.price * 1.18)).toLocaleString("en-IN")}
                            </div>
                            <div className="text-rb-success text-xs font-bold uppercase bg-rb-success/10 px-2 py-1 rounded ml-2">
                                {Math.round((((product.mrp || (product.price * 1.18)) - product.price) / (product.mrp || (product.price * 1.18))) * 100)}% OFF
                            </div>
                        </div>
                        <div className="text-rb-silver text-xs">Inclusive of all taxes</div>
                    </div>

                    {/* --- LAYER C: CONDITIONAL POLICY INJECTOR --- */}
                    {product.category?.toLowerCase() === 'cpu' && (
                        <div className="bg-rb-orange/10 border border-rb-orange/30 p-4 rounded-lg mb-6 text-sm flex items-start gap-3">
                            <span className="text-rb-orange text-lg mt-0.5"><FaInfoCircle /></span>
                            <div>
                                <strong className="text-rb-orange block uppercase tracking-wider text-xs mb-1 font-saira">Retail Box Note</strong>
                                <span className="text-rb-silver text-xs leading-relaxed">This standalone processor does not include a stock thermal cooler. An aftermarket liquid or air cooler is required.</span>
                            </div>
                        </div>
                    )}
                    
                    {product.cod_policy === 'no_cod' && (
                        <div className="bg-rb-orange/10 border border-rb-orange/30 p-4 rounded-lg mb-6 text-sm flex items-start gap-3">
                            <span className="text-xl">🔒</span>
                            <div>
                                <strong className="text-rb-orange block uppercase tracking-wider text-xs mb-1 font-saira">Secure Fulfillment</strong>
                                <span className="text-rb-silver text-xs leading-relaxed">Prepaid orders only. Includes standard 5-7 Day Insured Delivery across India.</span>
                            </div>
                        </div>
                    )}

                    {/* --- LAYER B: SEMANTIC SPEC TRANSFORMER --- */}
                    <div className="mb-6 bg-rb-surface/50 p-6 rounded-xl border border-white/5">
                        <h3 className="font-saira font-bold text-white mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
                            <FaBolt className="text-rb-orange" /> {isPreBuilt ? "System Specifications" : "Technical Highlights"}
                        </h3>
                        
                        {isPreBuilt ? (
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-white/5">
                                    {Object.entries(product.specs || {}).map(([key, val]: any) => (
                                        <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                                            <th className="py-3 text-rb-silver uppercase tracking-wide text-xs font-bold w-1/3">{key.replace(/_/g, " ")}</th>
                                            <td className="py-3 text-white font-medium text-right">{val}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {product.features?.map((feat: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-rb-silver">
                                        <span className="text-rb-orange mt-1">✦</span><span>{feat}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Service Highlights */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-white/5 hover:border-rb-orange/30 transition-colors">
                            <FaExchangeAlt className="text-rb-white text-lg mb-1" />
                            <span className="text-white text-xs font-bold uppercase">7 Days</span>
                            <span className="text-[10px] text-rb-silver">Replacement Policy</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-white/5 hover:border-rb-orange/30 transition-colors">
                            <FaShieldAlt className="text-rb-white text-lg mb-1" />
                            <span className="text-white text-xs font-bold uppercase">{product.warranty || "3 Years"}</span>
                            <span className="text-[10px] text-rb-silver">Official Warranty</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-white/5 hover:border-rb-orange/30 transition-colors">
                            <FaTruck className="text-rb-white text-lg mb-1" />
                            <span className="text-white text-xs font-bold uppercase">Safe Shipping</span>
                            <span className="text-[10px] text-rb-silver">Insured Delivery</span>
                        </div>
                        <div className={`flex flex-col gap-1 p-3 border rounded bg-white/5 transition-colors ${product.cod_policy === 'no_cod' ? 'border-rb-danger/30' : product.cod_policy === 'partial_cod' ? 'border-rb-warn/30' : 'border-white/5 hover:border-rb-orange/30'}`}>
                            <FaHandHoldingUsd className={`text-lg mb-1 ${product.cod_policy === 'no_cod' ? 'text-rb-danger' : product.cod_policy === 'partial_cod' ? 'text-rb-warn' : 'text-rb-white'}`} />
                            {product.cod_policy === 'no_cod' ? (
                                <><span className="text-rb-danger text-xs font-bold uppercase">Online Only</span><span className="text-[10px] text-rb-silver">COD Unavailable</span></>
                            ) : product.cod_policy === 'partial_cod' ? (
                                <><span className="text-rb-warn text-xs font-bold uppercase">Partial COD</span><span className="text-[10px] text-rb-silver">10% Advance Req.</span></>
                            ) : (
                                <><span className="text-white text-xs font-bold uppercase">COD Available</span><span className="text-[10px] text-rb-silver">Pay on Delivery</span></>
                            )}
                        </div>
                    </div>

                    {/* --- VARIANT SELECTOR (INJECTED HERE) --- */}
                    <VariantSelector 
                        currentProductId={product.id}
                        variantGroupId={product.variant_group_id}
                        currentSpecs={product.specs || {}}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-4 mb-8">
                        <button 
                            onClick={() => handleAction(false)} 
                            disabled={!product.in_stock} 
                            className="flex-1 py-5 px-4 border border-white/20 hover:border-white hover:bg-white hover:text-black font-saira font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            <FaShoppingCart /> <span className="truncate">Add to Cart</span>
                        </button>
                        
                        <button
                            onClick={() => handleAction(true)}
                            disabled={!product.in_stock}
                            className="flex-1 py-5 px-4 bg-rb-orange hover:bg-rb-orange-deep text-rb-orange-ink font-saira font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_24px_-6px_rgba(255,90,31,0.6)] disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            Buy Now
                        </button>
                    </div>

                </div>
            </Reveal>
        </div>

         {/* --- GALLERY SECTION (RETAINED) --- */}
        <div className="mb-24 pt-16 border-t border-white/10 relative z-10">
            <Reveal>
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-saira font-bold text-white uppercase tracking-wider">PRODUCT <span className="text-rb-orange">GALLERY</span></h2>
                </div>
                <div className="flex flex-col md:grid md:grid-cols-3 gap-4 h-auto">
                    <div className="w-full h-[400px] md:h-[600px] md:col-span-2 relative rounded-2xl overflow-hidden border border-white/5 group bg-rb-surface flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-rb-black via-transparent to-transparent opacity-60 z-10" />
                        {product.image_url ? (
                            <img src={product.image_url} alt="Main Showcase" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transform group-hover:scale-105 transition-all duration-1000 ease-out relative z-0" />
                        ) : (
                            <div className="text-white/20 font-saira text-2xl -rotate-12">No Preview Available</div>
                        )}
                    </div>
                    <div className="w-full h-[300px] md:h-[600px] flex flex-col gap-4">
                        {(product.gallery_urls?.length ? product.gallery_urls : [product.image_url, product.image_url])
                            .filter((url: any) => url && url.length > 0)
                            .slice(0, 2)
                            .map((img: string, i: number) => (
                            <div key={i} className="relative flex-1 rounded-2xl overflow-hidden border border-white/5 group bg-rb-surface flex items-center justify-center">
                                <img src={img} alt={`Detail ${i}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-700" />
                            </div>
                        ))}
                    </div>
                </div>
            </Reveal>
        </div>

        {/* --- DESCRIPTION (RETAINED) --- */}
        <div className="mb-24 max-w-4xl mx-auto border-t border-white/10 pt-12 text-center">
            <Reveal>
                <h3 className="text-2xl font-saira font-bold text-white uppercase tracking-wider pb-4 ">DESCRIPTION <span className="text-rb-orange"></span></h3>
                <p className="text-rb-silver leading-loose whitespace-pre-line text-sm md:text-base font-light opacity-80 max-w-3xl mx-auto">
                    {product.description}
                </p>
            </Reveal>
        </div>

        {/* --- RELATED PRODUCTS (RETAINED) --- */}
        {relatedProducts.length > 0 && (
            <div className="border-t border-white/10 pt-16 pb-20">
                <h3 className="font-saira font-bold text-2xl mb-8 uppercase text-center">Related Gear</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((item) => (
                        <Link href={`/product/${item.id}`} key={item.id} className="group bg-rb-surface border border-white/5 rounded-xl p-4 hover:border-rb-orange/50 transition-all">
                            <div className="h-40 bg-rb-black mb-4 flex items-center justify-center">
                                {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full object-contain" /> : <span className="text-rb-silver/20 text-xs text-center px-2">{item.name}</span>}
                            </div>
                            <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                            <div className="text-rb-silver font-saira">₹{Number(item.price || 0).toLocaleString("en-IN")}</div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        {/* --- REVIEWS (RETAINED) --- */}
        <div className="border-t border-white/10 pt-16">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 <div className="lg:col-span-1">
                     <h3 className="font-saira font-bold text-xl mb-6 uppercase tracking-wider">Write a Review</h3>
                     <div className="bg-rb-surface p-6 rounded-xl border border-white/5">
                        <form onSubmit={submitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-rb-silver font-bold mb-2">Rating</label>
                                <div className="flex gap-2 text-rb-orange text-lg">
                                    {[1,2,3,4,5].map(star => (
                                        <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})}>
                                            {star <= newReview.rating ? <FaStar /> : <FaRegStar className="text-white/20" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-rb-silver font-bold mb-2">Your Experience</label>
                                <textarea className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm text-white focus:border-rb-orange outline-none h-32 resize-none" placeholder="Tell us what you think about this product..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} required />
                            </div>
                            <button className="w-full bg-white text-black font-bold uppercase py-3 rounded hover:bg-rb-orange hover:text-white transition-all text-xs tracking-widest">Submit Review</button>
                        </form>
                     </div>
                 </div>
                 <div className="lg:col-span-2">
                     <h3 className="font-saira font-bold text-xl mb-6 uppercase tracking-wider flex items-center justify-between">Customer Reviews <span className="text-sm font-saira text-rb-silver bg-white/5 px-3 py-1 rounded-full">{reviews.length}</span></h3>
                     {reviews.length === 0 ? (
                         <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5"><p className="text-rb-silver">No reviews yet. Be the first to share your thoughts!</p></div>
                     ) : (
                         <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                             {reviews.map((rev) => (
                                 <div key={rev.id} className="bg-rb-surface p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                     <div className="flex justify-between items-start mb-2">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rb-orange to-rb-orange-deep flex items-center justify-center text-xs font-bold">{rev.user_name.charAt(0)}</div>
                                             <div>
                                                 <h4 className="font-bold text-sm text-white">{rev.user_name}</h4>
                                                 <div className="flex text-rb-orange text-[10px] gap-1">{[...Array(5)].map((_, i) => i < rev.rating ? <FaStar key={i} /> : <FaRegStar key={i} className="text-white/20" />)}</div>
                                             </div>
                                         </div>
                                         <span className="text-[10px] text-rb-silver">{new Date(rev.created_at).toLocaleDateString()}</span>
                                     </div>
                                     <p className="text-rb-silver text-sm pl-11">{rev.comment}</p>
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
    </div>
  );
}