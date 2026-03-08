"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/app/context/CartContext"; 
import { notFound, useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; 
import Link from "next/link";
import { StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaShoppingCart, FaArrowRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { toast } from "sonner"; 
import CategoryLanding from "@/components/CategoryLanding"; 
import FilterSidebar from "./components/FilterSidebar";
import ProductBreadcrumb from "@/components/ProductBreadcrumb";
import ChipsetHub from "./components/ChipsetHub";

const validCategories = [
  "cpu", "gpu", "motherboard", "memory", "ram", "storage", "psu", "cooler", "cabinet", "prebuilt",
  "monitor", "keyboard", "mouse", "combo", "mousepad", "usb"
];

export default function CategoryClient({ category }: { category: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { addToCart } = useCart();
  
  const categoryParam = category.toLowerCase();
  const dbCategory = categoryParam === "memory" ? "ram" : categoryParam;

  if (!validCategories.includes(dbCategory)) {
    return notFound();
  }

  // --- 1. PURE ISOLATED REACT STATE (Completely bypasses Next.js URL bugs) ---
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    brand: searchParams.get('brand')?.split(',').filter(Boolean) || [],
    budget: searchParams.get('budget')?.split(',').filter(Boolean) || [],
    socket: searchParams.get('socket')?.split(',').filter(Boolean) || [],
    memory: searchParams.get('memory')?.split(',').filter(Boolean) || [],
    capacity: searchParams.get('capacity')?.split(',').filter(Boolean) || [],
    form_factor: searchParams.get('form_factor')?.split(',').filter(Boolean) || [],
    radiator: searchParams.get('radiator')?.split(',').filter(Boolean) || []
  });

  const [searchQuery, setSearchQuery] = useState("");

  // FIX: Sync URL to State if user clicks a Landing Page card (Shallow Routing sync)
  useEffect(() => {
      const urlBrand = searchParams.get('brand');
      if (urlBrand && activeFilters.brand.length === 0) {
          setActiveFilters(prev => ({ ...prev, brand: urlBrand.split(',').filter(Boolean) }));
      }
  }, [searchParams]);

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters(prev => {
        const current = prev[key] || [];
        const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        return { ...prev, [key]: updated };
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({ brand: [], budget: [], socket: [], memory: [], capacity: [], form_factor: [], radiator: [] });
  };

  // --- 2. STATE & LANDING LOGIC ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // --- ROUTING INTELLIGENCE (The 4-Step Funnel) ---
  const pMaker = searchParams.get('maker');
  const pSeries = searchParams.get('series');
  const pChipset = searchParams.get('chipset'); 
  const pBrand = searchParams.get('brand'); // Catch CPU selections

  // UX LOCK: Once a user interacts with sidebar filters or arrives from a landing selection, lock into grid mode
  const [hasInteracted, setHasInteracted] = useState(false);
  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0) || searchQuery !== "";
  
  useEffect(() => {
      if (hasActiveFilters || pBrand) setHasInteracted(true);
  }, [hasActiveFilters, pBrand]);

  // 1. Show Landing (Step 1) if they haven't picked a maker, chipset, or brand
  const showLanding = ['gpu', 'motherboard', 'cpu'].includes(dbCategory) && !pMaker && !pChipset && !pBrand && !hasInteracted && !hasActiveFilters;

  // 2. Show Chipset Hub (Steps 2 & 3) if they picked a Maker (GPU/Mobo), but not a specific model yet
  const showHub = ['gpu', 'motherboard'].includes(dbCategory) && pMaker && !pChipset && !hasInteracted && !hasActiveFilters;
  useEffect(() => {
    const fetchProducts = async () => {
      if (showLanding) {
          setLoading(false);
          return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', dbCategory)
        .order('created_at', { ascending: true }); 

      if (data) {
        const uniqueList: any[] = [];
        const seenGroups = new Set<string>();

        data.forEach(p => {
            const formattedProduct = { ...p, image: p.image_url, ...(p.specs || {}) };
            if (p.variant_group_id) {
                if (!seenGroups.has(p.variant_group_id)) {
                    seenGroups.add(p.variant_group_id);
                    uniqueList.push(formattedProduct); 
                }
            } else {
                uniqueList.push(formattedProduct);
            }
        });
        setProducts(uniqueList);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [dbCategory, showLanding]);


  // --- 4. INSTANT FILTERING ---
  const filteredProducts = useMemo(() => {
    const { brand, budget, socket, memory, capacity, form_factor, radiator } = activeFilters;

    return products.filter((product) => {
      // NEW: Force grid to ONLY show the selected chipset (e.g. RTX 4070)
      if (pChipset && product.specs?.chipset !== pChipset) return false;

      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (brand.length > 0 && !brand.includes(product.brand)) return false;
      
      if (budget.length > 0) {
        const matchesPrice = budget.some((range) => {
          if (range === "Under ₹10K") return product.price < 10000;
          if (range === "₹10K - ₹30K") return product.price >= 10000 && product.price <= 30000;
          if (range === "₹30K - ₹80K") return product.price > 30000 && product.price <= 80000;
          if (range === "Above ₹80K") return product.price > 80000;
          return false;
        });
        if (!matchesPrice) return false;
      }

      if (socket.length > 0 && !socket.includes(product.specs?.socket)) return false;
      if (memory.length > 0 && !memory.includes(product.specs?.memory_type)) return false;
      if (capacity.length > 0 && !capacity.includes(product.specs?.capacity) && !capacity.includes(product.specs?.vram)) return false;
      if (form_factor.length > 0 && !form_factor.includes(product.specs?.form_factor)) return false;
      if (radiator.length > 0 && !radiator.includes(product.specs?.radiator_size)) return false;

      return true;
    });
  }, [products, activeFilters, searchQuery]);

  const handleAction = async (product: any, isBuyNow: boolean) => {
    addToCart(product);
    if (isBuyNow) router.push("/checkout");
    else toast.success("Added to Gear", { description: `${product.name} is secure in your cart.`, action: { label: "View Cart", onClick: () => router.push("/cart") } });
  };

  // --- RENDERS ---
  if (showLanding) {
      return (
        <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
            <Navbar />
            <CategoryLanding category={dbCategory} />
            <Footer />
        </div>
      );
  }

  if (showHub) {
      return (
        <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
            <Navbar />
            <ChipsetHub category={dbCategory} maker={pMaker!} series={pSeries} products={products} />
            <Footer />
        </div>
      );
  }

  return (
    // FIX: Removed 'overflow-hidden' so the Navbar can properly stick to the top of the viewport
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col relative">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />

     <Navbar />
      
      {/* STICKY BREADCRUMB: Locked directly under the 80px Navbar */}
      <div className="sticky top-[80px] z-[90] w-full bg-[#121212]">
          <ProductBreadcrumb category={dbCategory} />
      </div>

      <div className="flex flex-col lg:flex-row flex-grow relative z-10 max-w-[1920px] mx-auto w-full items-start">
        
        {/* FIX: Removed fixed height and sticky classes so the filter extends naturally to the bottom */}
        {/* STICKY SIDEBAR: Locked below the Breadcrumb (80px Navbar + ~60px Breadcrumb = 140px) */}
        <aside className="w-full lg:w-[300px] xl:w-[350px] border-r border-white/5 p-8 bg-[#0A0A0A] lg:sticky lg:top-[140px] lg:h-[calc(100vh-140px)] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div 
                className="lg:hidden flex items-center justify-between mb-6 cursor-pointer text-brand-purple border-b border-white/10 pb-4"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="font-orbitron font-bold uppercase tracking-wider">Show Filters</span>
                </div>
                {mobileFiltersOpen ? <FaChevronUp /> : <FaChevronDown />}
            </div>

            <div className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block`}>
                {loading ? (
                    <p className="text-xs text-brand-silver animate-pulse">Scanning database...</p>
                ) : (
                    <FilterSidebar products={products} activeFilters={activeFilters} toggleFilter={toggleFilter} />
                )}
            </div>
        </aside>
          
        {/* FIX 1: Removed lg:p-10 so the grid stretches completely to the right edge */}
        <div className="flex-1 bg-[#121212] p-4 lg:p-0 w-full">
             <div className="mb-6 lg:hidden">
                <span className="text-brand-silver text-xs font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded">Found: {filteredProducts.length} Items</span>
             </div>

             {loading ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-brand-purple animate-pulse">
                    <div className="text-xl font-orbitron mb-2 tracking-widest">LOADING INVENTORY</div>
                    <div className="h-[1px] w-24 bg-brand-purple"></div>
                </div>
             ) : (
               <StaggerGrid key={`grid-${filteredProducts.length}`} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-l border-white/5">
                  {filteredProducts.map((product) => (
                    <StaggerItem key={product.id}>
                        <div className="group relative border-b border-r border-white/5 bg-[#121212] hover:bg-[#151515] transition-colors duration-300 flex flex-col h-full min-h-[500px]">
                            
                            {!product.in_stock && (
                              <div className="absolute top-0 right-0 z-20 bg-red-500 text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest">
                                  Out of Stock
                              </div>
                            )}

                            <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden block flex items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-transparent">
                               <div className="absolute inset-0 bg-brand-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl z-0" />
                               {product.image ? (
                                 <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain relative z-10 transform group-hover:scale-110 transition-transform duration-700" />
                               ) : (
                                 <span className="text-brand-silver/20 font-orbitron text-2xl font-bold -rotate-12 select-none">{product.name}</span>
                               )}
                            </Link>
                            
                            <div className="p-8 flex flex-col flex-grow relative z-10 border-t border-white/5 bg-[#121212]">
                                <span className="text-[10px] font-bold text-brand-purple tracking-[0.2em] uppercase mb-2 block">
                                    {product.brand}
                                </span>

                                <Link href={`/product/${product.id}`} className="block mb-4">
                                   <h4 className="text-white font-orbitron text-lg leading-tight group-hover:text-brand-purple transition-colors line-clamp-2 uppercase">
                                       {product.name}
                                   </h4>
                                </Link>

                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-8 mt-2 min-h-[40px]">
                                    {product.specs && Object.keys(product.specs).length > 0 ? (
                                        Object.entries(product.specs)
                                            // FIX: Removed 'color' and 'group' from exclusion so they show up again
                                            .filter(([key]) => !['wattage', 'variant_label'].includes(key.toLowerCase())) 
                                            .slice(0, 4)
                                            .map(([key, value]: any) => (
                                                <div key={key} className="border-l border-white/10 pl-2">
                                                    <span className="block text-white/40 text-[9px] uppercase tracking-wider truncate">
                                                        {key.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-brand-silver text-xs font-bold truncate block">
                                                        {value}
                                                    </span>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="col-span-2 border-l border-white/10 pl-2">
                                            <span className="block text-white/40 text-[9px] uppercase tracking-wider">Details</span>
                                            <span className="text-brand-silver text-xs font-bold">See Product Page</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/5 flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] text-brand-silver uppercase tracking-widest mb-1">Price</p>
                                        <span className="text-white font-orbitron font-bold text-xl">₹{product.price.toLocaleString("en-IN")}</span>
                                    </div>
                                    
                                    <div className="flex gap-0">
                                        <button 
                                            onClick={() => handleAction(product, false)} 
                                            disabled={!product.in_stock} 
                                            className="h-10 w-12 border border-white/20 text-white hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center disabled:opacity-20"
                                            title="Add to Cart"
                                        >
                                            <FaShoppingCart size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleAction(product, true)} 
                                            disabled={!product.in_stock} 
                                            className="h-10 px-6 bg-white text-black text-[10px] font-orbitron font-bold uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all disabled:opacity-20 flex items-center gap-2"
                                        >
                                            Buy <FaArrowRight />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </StaggerItem>
                  ))}
               </StaggerGrid>
             )}

             {!loading && filteredProducts.length === 0 && (
                <div className="h-[50vh] flex flex-col items-center justify-center text-brand-silver border border-dashed border-white/10 m-8">
                   <p className="font-orbitron text-xl mb-2">NO SIGNALS DETECTED</p>
                   <p className="text-sm text-brand-silver/50 uppercase tracking-widest text-center mt-2">
                        Try adjusting your filters or checking a different category.
                    </p>
                   <button 
                        onClick={clearAllFilters}
                        className="mt-6 px-6 py-2 border border-brand-purple text-brand-purple text-xs font-bold uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all"
                   >
                        Clear All Filters
                   </button>
                </div>
             )}
        </div>
      </div>
      <Footer />
    </div>
  );
}