"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useMemo, useEffect, use } from "react";
import { useCart } from "@/app/context/CartContext"; 
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; 
import Link from "next/link";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaShoppingCart, FaArrowRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { toast } from "sonner"; 
import CategoryLanding from "@/components/CategoryLanding"; // <--- NEW IMPORT

const validCategories = [
  "cpu", "gpu", "motherboard", "memory", "ram", "storage", "psu", "cooler", "cabinet", "prebuilt",
  "monitor", "keyboard", "mouse", "combo", "mousepad", "usb"
];

// --- REUSABLE FILTER COMPONENT ---
const FilterGroup = ({ title, options, selected, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-8 border-b border-white/10 pb-6">
      <div 
        className="flex justify-between items-center cursor-pointer mb-4 hover:text-brand-purple transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
        <span className="text-brand-purple font-light text-xl">{isOpen ? "−" : "+"}</span>
      </div>
      
      {isOpen && (
        <div className="space-y-3">
          {options.map((opt: string) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group hover:pl-1 transition-all">
              <div className={`w-3 h-3 border border-white/30 flex items-center justify-center transition-all ${selected.includes(opt) ? "bg-brand-purple border-brand-purple" : "group-hover:border-white"}`}>
                 {selected.includes(opt) && <div className="w-1.5 h-1.5 bg-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={selected.includes(opt)}
                onChange={() => onChange(opt)}
              />
              <span className={`text-xs font-saira uppercase tracking-wider ${selected.includes(opt) ? "text-white" : "text-brand-silver group-hover:text-white"}`}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// Change function signature to accept simple 'category' string
export default function CategoryClient({ category }: { category: string }) {
  // const resolvedParams = use(params); // <--- DELETE THIS LINE
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  
  // Use the prop directly
  const categoryParam = category.toLowerCase();
  const dbCategory = categoryParam === "memory" ? "ram" : categoryParam;

  if (!validCategories.includes(dbCategory)) {
    return notFound();
  }

  // --- INTERCEPTION LOGIC ---
  // If category is CPU or GPU, AND no specific brand filter is in the URL, show Landing Page.
  const paramBrand = searchParams.get('brand');
  const paramSearch = searchParams.get('search');
  const showLanding = (dbCategory === 'cpu' || dbCategory === 'gpu') && !paramBrand && !paramSearch;

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize filters with URL params if present
  const [selectedBrand, setSelectedBrand] = useState<string[]>(paramBrand ? [paramBrand] : []);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // If user navigated via Landing Page (e.g., clicked "Intel"), we sync the state
  useEffect(() => {
    if (paramBrand) {
        setSelectedBrand([paramBrand]);
    }
  }, [paramBrand]);

  useEffect(() => {
    const fetchProducts = async () => {
      // Don't fetch if we are showing the landing page (saves resources)
      if (showLanding) {
          setLoading(false);
          return;
      }

      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('category', dbCategory);
      if (data) {
        setProducts(data.map(p => ({ ...p, image: p.image_url, ...(p.specs || {}) })));
      }
      setLoading(false);
    };
    fetchProducts();
  }, [dbCategory, showLanding]);

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
    addToCart(product);
    if (isBuyNow) {
        router.push("/checkout");
    } else {
        toast.success("Added to Gear", {
            description: `${product.name} is secure in your cart.`,
            action: { label: "View Cart", onClick: () => router.push("/cart") }
        });
    }
  };

  const toggleFilter = (item: string, list: string[], setList: Function) => {
    if (list.includes(item)) setList(list.filter((i) => i !== item));
    else setList([...list, item]);
  };

  const availableBrands = Array.from(new Set(products.map((p) => p.brand)));

  // --- RENDER LANDING PAGE IF APPLICABLE ---
  if (showLanding) {
      return (
        <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
            <Navbar />
            <CategoryLanding category={dbCategory} />
            <Footer />
        </div>
      );
  }

  // --- RENDER STANDARD PRODUCT LIST ---
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />

      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
        <aside className="w-full lg:w-[300px] xl:w-[350px] border-r border-white/5 p-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-[#0A0A0A]">
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
                <div className="mb-10 pt-4 hidden lg:block">
                    <span className="text-[10px] text-brand-purple font-bold tracking-[0.2em] uppercase block mb-2">Refine Results</span>
                    <h2 className="font-orbitron text-2xl text-white">SPECS</h2>
                </div>

                {loading ? (
                    <p className="text-xs text-brand-silver animate-pulse">Scanning database...</p>
                ) : (
                    <>
                        <FilterGroup 
                            title="Brands" 
                            options={availableBrands} 
                            selected={selectedBrand}
                            onChange={(val: string) => toggleFilter(val, selectedBrand, setSelectedBrand)}
                        />
                        <FilterGroup 
                            title="Budget" 
                            options={["Under ₹10K", "₹10K - ₹30K", "₹30K - ₹80K", "Above ₹80K"]} 
                            selected={selectedPrice}
                            onChange={(val: string) => toggleFilter(val, selectedPrice, setSelectedPrice)}
                        />
                    </>
                )}
            </div>
        </aside>
          
        <div className="flex-1 bg-[#121212] p-4 lg:p-0">
             <div className="py-4 px-8 border-b border-white/5 bg-[#121212]/90 backdrop-blur sticky top-0 z-10 lg:hidden">
                <span className="text-brand-silver text-xs font-bold uppercase tracking-widest">Found: {filteredProducts.length} Items</span>
             </div>

             {loading ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-brand-purple animate-pulse">
                    <div className="text-xl font-orbitron mb-2 tracking-widest">LOADING INVENTORY</div>
                    <div className="h-[1px] w-24 bg-brand-purple"></div>
                </div>
             ) : (
               <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-l border-white/5">
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
                            
                            <div className="p-8 flex flex-col flex-grow relative z-10 border-t border-white/5">
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
                                            .filter(([key]) => key.toLowerCase() !== 'wattage') 
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
                   <p className="text-sm text-brand-silver/50 uppercase tracking-widest">Adjust filters to locate hardware.</p>
                </div>
             )}
        </div>
      </div>
      <Footer />
    </div>
  );
}