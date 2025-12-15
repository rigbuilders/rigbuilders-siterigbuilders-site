"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { useState, useMemo, useEffect, use } from "react";
import { useCart } from "@/app/context/CartContext"; 
import { notFound, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; 
import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaFilter, FaShoppingCart, FaBolt, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";

// Valid categories list
const validCategories = [
  "cpu", "gpu", "motherboard", "memory", "ram", "storage", "psu", "cooler", "cabinet", "prebuilt",
  "monitor", "keyboard", "mouse", "combo", "mousepad", "usb"
];

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const categoryParam = resolvedParams.category.toLowerCase();
  const dbCategory = categoryParam === "memory" ? "ram" : categoryParam;

  if (!validCategories.includes(dbCategory)) {
    return notFound();
  }

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false); // NEW: Toggle State

  // --- 1. DATA FETCHING (Unchanged Logic) ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', dbCategory);

      if (data) {
        setProducts(data.map(p => ({ ...p, image: p.image_url, ...(p.specs || {}) })));
      }
      setLoading(false);
    };

    fetchProducts();
  }, [dbCategory]);

  // --- 2. FILTERING LOGIC (Unchanged Logic) ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedBrand.length > 0 && !selectedBrand.includes(product.brand)) return false;

      if (selectedPrice.length > 0) {
        const matchesPrice = selectedPrice.some((range) => {
          if (range === "Under ₹10K") return product.price < 10000;
          if (range === "₹10K - ₹30K") return product.price >= 10000 && product.price <= 30000;
          if (range === "₹30K - ₹80K") return product.price > 30000 && product.price <= 80000;
          if (range === "Above ₹80K") return product.price > 80000;
          return false;
        });
        if (!matchesPrice) return false;
      }
      return true;
    });
  }, [products, selectedBrand, selectedPrice]);

  const handleAction = async (product: any, isBuyNow: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setShowAuthModal(true);
        return;
    }
    addToCart(product);
    if (isBuyNow) router.push("/checkout");
  };

  const toggleFilter = (item: string, list: string[], setList: Function) => {
    if (list.includes(item)) setList(list.filter((i) => i !== item));
    else setList([...list, item]);
  };

  const availableBrands = Array.from(new Set(products.map((p) => p.brand)));

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />

      <Navbar />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* HEADER SECTION */}
      <Reveal>
        <div className="pt-12 pb-8 px-[20px] lg:px-[80px] 2xl:px-[100px] border-b border-white/5 bg-gradient-to-b from-[#121212] to-[#1A1A1A] relative z-10">
            <h1 className="font-orbitron text-4xl md:text-5xl font-black uppercase text-white tracking-wide">
                {categoryParam === "cpu" ? "PROCESSORS" : categoryParam.toUpperCase()}
            </h1>
            <p className="text-brand-silver mt-2 text-sm tracking-wider">
                Showing {filteredProducts.length} Premium Components
            </p>
        </div>
      </Reveal>

      <div className="flex-grow py-12 px-[20px] lg:px-[80px] 2xl:px-[100px] relative z-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* --- SIDEBAR FILTERS --- */}
          {/* --- SIDEBAR FILTERS --- */}
          <aside className="w-full lg:w-1/4 h-fit lg:sticky lg:top-32 space-y-8">
            <Reveal delay={0.1}>
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 rounded-xl p-6 shadow-2xl transition-all duration-300">
                    
                    {/* Header: Clickable on Mobile to Toggle */}
                    <div 
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                        className="flex items-center justify-between mb-2 lg:mb-6 text-brand-purple border-b border-white/10 pb-4 cursor-pointer lg:cursor-default"
                    >
                        <div className="flex items-center gap-2">
                            <FaFilter />
                            <h3 className="font-orbitron font-bold uppercase tracking-wider">Filters</h3>
                        </div>
                        {/* Show Chevron only on Mobile */}
                        <div className="lg:hidden text-white">
                            {mobileFiltersOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                    </div>

                    {/* Filter Content Wrapper: Toggles on Mobile, Always Visible on Desktop */}
                    <div className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block`}>
                        
                        {/* Brand Filter */}
                        <div className="mb-8 pt-4 lg:pt-0">
                            <h4 className="font-bold text-white text-sm uppercase mb-4 tracking-wide">Brands</h4>
                            {loading ? <p className="text-xs text-brand-silver animate-pulse">Loading brands...</p> : (
                                <div className="space-y-3">
                                    {availableBrands.map((brand) => (
                                        <label key={brand} className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded transition-colors">
                                            <div className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-all ${selectedBrand.includes(brand) ? "bg-brand-purple border-brand-purple" : "border-white/30 group-hover:border-white"}`}>
                                                {selectedBrand.includes(brand) && <FaCheck size={10} />}
                                            </div>
                                            <input type="checkbox" className="hidden" onChange={() => toggleFilter(brand, selectedBrand, setSelectedBrand)} />
                                            <span className={`text-sm transition-colors ${selectedBrand.includes(brand) ? "text-white font-bold" : "text-brand-silver group-hover:text-white"}`}>{brand}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price Filter */}
                        <div>
                            <h4 className="font-bold text-white text-sm uppercase mb-4 tracking-wide">Price Range</h4>
                            <div className="space-y-3">
                                {["Under ₹10K", "₹10K - ₹30K", "₹30K - ₹80K", "Above ₹80K"].map((range) => (
                                    <label key={range} className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded transition-colors">
                                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-all ${selectedPrice.includes(range) ? "bg-brand-purple border-brand-purple" : "border-white/30 group-hover:border-white"}`}>
                                            {selectedPrice.includes(range) && <FaCheck size={10} />}
                                        </div>
                                        <input type="checkbox" className="hidden" onChange={() => toggleFilter(range, selectedPrice, setSelectedPrice)} />
                                        <span className={`text-sm transition-colors ${selectedPrice.includes(range) ? "text-white font-bold" : "text-brand-silver group-hover:text-white"}`}>{range}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div> 
                    {/* End of Filter Content Wrapper */}

                </div>
            </Reveal>
          </aside>
          
          {/* --- PRODUCT GRID --- */}
          <div className="w-full lg:w-3/4">
             {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-brand-purple animate-pulse">
                    <div className="text-xl font-orbitron mb-2">LOADING HARDWARE</div>
                    <div className="h-1 w-24 bg-brand-purple rounded-full"></div>
                </div>
             ) : (
               <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <StaggerItem key={product.id}>
                        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden flex flex-col group relative hover:border-brand-purple/50 hover:shadow-[0_0_20px_rgba(78,44,139,0.2)] transition-all duration-300 h-full">
                            
                            {/* Sold Out Badge */}
                            {!product.in_stock && (
                              <div className="absolute top-4 right-4 z-20 bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider shadow-lg">
                                  Sold Out
                              </div>
                            )}

                            {/* Image Section */}
                            <Link href={`/product/${product.id}`} className="relative h-56 bg-gradient-to-b from-white/5 to-transparent overflow-hidden block">
                               {/* Hover Glow */}
                               <div className="absolute inset-0 bg-brand-purple/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
                               
                               {product.image ? (
                                 <img src={product.image} alt={product.name} className="w-full h-full object-cover relative z-10 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-xl" />
                               ) : (
                                 <span className="text-brand-silver/20 font-orbitron text-2xl font-bold -rotate-12 select-none">{product.name}</span>
                               )}
                            </Link>
                            
                            {/* Content Section */}
                            <div className="p-6 flex flex-col flex-grow bg-[#151515] group-hover:bg-[#181818] transition-colors relative z-10">
                                
                                <div className="mb-2 flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-brand-purple tracking-widest uppercase bg-brand-purple/10 px-2 py-1 rounded">
                                        {product.brand}
                                    </span>
                                    {/* Wattage Badge (if exists) */}
                                    {product.wattage && (
                                        <span className="text-[10px] text-brand-silver flex items-center gap-1">
                                            <FaBolt size={8} className="text-yellow-400" /> {product.wattage}W
                                        </span>
                                    )}
                                </div>

                                <Link href={`/product/${product.id}`} className="mb-4 block flex-grow">
                                   <h4 className="text-white font-bold text-lg leading-tight group-hover:text-brand-purple transition-colors line-clamp-2">
                                       {product.name}
                                   </h4>
                                   {/* Socket Spec (if exists) */}
                                   {product.socket && (
                                       <p className="text-brand-silver/60 text-xs mt-2 font-saira">
                                           Socket: <span className="text-brand-silver">{product.socket}</span>
                                       </p>
                                   )}
                                </Link>

                                {/* Price & Actions */}
                                <div className="pt-4 border-t border-white/10 mt-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-white font-orbitron font-bold text-xl">₹{product.price.toLocaleString("en-IN")}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleAction(product, false)} 
                                            disabled={!product.in_stock} 
                                            className="border border-white/20 text-white text-[10px] py-3 uppercase font-bold tracking-wider rounded hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaShoppingCart /> Cart
                                        </button>
                                        <button 
                                            onClick={() => handleAction(product, true)} 
                                            disabled={!product.in_stock} 
                                            className="bg-brand-purple text-white text-[10px] py-3 uppercase font-bold tracking-wider rounded hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-brand-purple/50"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </StaggerItem>
                  ))}
               </StaggerGrid>
             )}

             {/* Empty State */}
             {!loading && filteredProducts.length === 0 && (
                <Reveal>
                    <div className="w-full py-24 text-center border border-dashed border-white/10 bg-white/5 rounded-xl flex flex-col items-center justify-center">
                       <p className="text-brand-silver text-lg font-orbitron mb-2">No components found.</p>
                       <p className="text-sm text-brand-silver/50">Try adjusting your filters.</p>
                    </div>
                </Reveal>
             )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}