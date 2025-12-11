"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useMemo, useEffect, use } from "react";
import { useCart } from "@/app/context/CartContext"; 
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; 

const validCategories = ["cpu", "gpu", "motherboard", "memory", "ram", "storage", "psu", "cooler", "cabinet"];

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const { addToCart } = useCart();
  
  const categoryParam = resolvedParams.category.toLowerCase();
  const dbCategory = categoryParam === "memory" ? "ram" : categoryParam;

  if (!validCategories.includes(dbCategory)) {
    return notFound();
  }

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);

  // Fetch Data
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', dbCategory);

      if (error) {
        console.error("Error loading products:", error);
      } else if (data) {
        // Flatten 'specs' so we can access product.raw or product.Socket directly
        const formattedData = data.map(p => ({
            ...p,
            image: p.image_url, 
            ...(p.specs || {}) // Spread the specs JSON into the main object
        }));
        setProducts(formattedData);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [dbCategory]);

  const availableBrands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand)));
  }, [products]);

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

  const toggleFilter = (item: string, list: string[], setList: Function) => {
    if (list.includes(item)) setList(list.filter((i) => i !== item));
    else setList([...list, item]);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />

      <div className="flex-grow pt-32 pb-12 px-[40px] lg:px-[80px] 2xl:px-[100px]">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* SIDEBAR FILTERS */}
          <aside className="w-full lg:w-1/4 h-fit sticky top-28 space-y-8">
            <div className="border-b border-white/20 pb-4">
              <h1 className="font-orbitron text-2xl font-bold uppercase text-white">
                {categoryParam === "cpu" ? "PROCESSORS" : categoryParam.toUpperCase()}
              </h1>
            </div>

            {/* Brand Filter */}
            <div>
               <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider mb-4">Brands</h3>
               {loading ? <p className="text-xs text-brand-silver">Loading filters...</p> : (
                 <div className="space-y-2">
                   {availableBrands.map((brand) => (
                     <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                       <div className={`w-4 h-4 border border-white/30 rounded-sm flex items-center justify-center transition-all ${selectedBrand.includes(brand) ? "bg-brand-purple border-brand-purple" : "group-hover:border-white"}`}>
                          {selectedBrand.includes(brand) && <span className="text-white text-xs">✓</span>}
                       </div>
                       <input type="checkbox" className="hidden" checked={selectedBrand.includes(brand)} onChange={() => toggleFilter(brand, selectedBrand, setSelectedBrand)} />
                       <span className={`text-sm ${selectedBrand.includes(brand) ? "text-white" : "text-brand-silver group-hover:text-white"}`}>{brand}</span>
                     </label>
                   ))}
                 </div>
               )}
            </div>

            {/* Price Filter */}
            <div>
               <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider mb-4">Pricing</h3>
               <div className="space-y-2">
                 {["Under ₹10K", "₹10K - ₹30K", "₹30K - ₹80K", "Above ₹80K"].map((range) => (
                   <label key={range} className="flex items-center gap-3 cursor-pointer group">
                     <div className={`w-4 h-4 border border-white/30 rounded-sm flex items-center justify-center transition-all ${selectedPrice.includes(range) ? "bg-brand-purple border-brand-purple" : "group-hover:border-white"}`}>
                        {selectedPrice.includes(range) && <span className="text-white text-xs">✓</span>}
                     </div>
                     <input type="checkbox" className="hidden" checked={selectedPrice.includes(range)} onChange={() => toggleFilter(range, selectedPrice, setSelectedPrice)} />
                     <span className={`text-sm ${selectedPrice.includes(range) ? "text-white" : "text-brand-silver group-hover:text-white"}`}>{range}</span>
                   </label>
                 ))}
               </div>
            </div>
          </aside>

          {/* PRODUCT GRID */}
          <div className="w-full lg:w-3/4">
             <div className="mb-6 flex justify-between items-center">
                <span className="text-brand-silver text-sm">Showing {filteredProducts.length} results</span>
             </div>

             {loading ? (
                <div className="py-20 text-center text-brand-silver">Loading products...</div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-[#1A1A1A] border border-white/5 p-6 flex flex-col hover:border-brand-purple/50 transition-all group relative">
                        {!product.in_stock && (
                          <div className="absolute top-4 right-4 z-10"><span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Sold Out</span></div>
                        )}

                        <div className="mb-4">
                          <h3 className="font-orbitron text-xl font-bold text-white uppercase">{product.brand}</h3>
                          <span className="text-[10px] text-brand-purple font-bold tracking-widest uppercase">{product.category}</span>
                        </div>

                        <div className="h-48 bg-black/40 border border-white/5 mb-6 flex items-center justify-center relative overflow-hidden">
                           {/* If image URL exists, you could use <Image> here, otherwise placeholder */}
                           <span className="text-brand-silver/20 font-orbitron text-2xl font-bold -rotate-12 text-center px-4">{product.name}</span>
                        </div>
                        
                        <div className="mb-4 flex-grow">
                           <h4 className="text-white font-bold text-md leading-tight">{product.name}</h4>
                           
                           {/* DYNAMIC SPECS RENDERING */}
                           <div className="text-brand-silver text-xs mt-3 min-h-[40px]">
                              {/* 1. If Manual Specs ('raw') exist, show them directly */}
                              {'raw' in product ? (
                                <span className="whitespace-pre-line leading-relaxed block opacity-80 font-mono">
                                    {product.raw}
                                </span>
                              ) : (
                                /* 2. Fallback: Old structured data (for imported items) */
                                <>
                                  {'Socket' in product ? `Socket: ${product.Socket} • ` : ''}
                                  {'socket' in product ? `Socket: ${product.socket} • ` : ''}
                                  {'VRAM' in product ? `VRAM: ${product.VRAM} • ` : ''}
                                  {'Wattage' in product ? `Power: ${product.Wattage}` : ''}
                                </>
                              )}
                           </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-auto">
                            <span className="text-white font-bold text-lg">₹{product.price.toLocaleString("en-IN")}</span>
                            <button 
                                onClick={() => addToCart(product)}
                                disabled={!product.in_stock}
                                className={`border text-xs px-6 py-2 font-bold uppercase tracking-wider transition-all ${
                                    product.in_stock 
                                    ? "border-white text-white hover:bg-white hover:text-black" 
                                    : "border-white/10 text-white/30 cursor-not-allowed"
                                }`}
                            >
                                {product.in_stock ? "Add to Cart" : "No Stock"}
                            </button>
                        </div>
                    </div>
                  ))}
               </div>
             )}

             {!loading && filteredProducts.length === 0 && (
                <div className="w-full py-20 text-center border border-dashed border-white/10 text-brand-silver rounded-xl">
                   No products found in this category matching your filters.
                </div>
             )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}