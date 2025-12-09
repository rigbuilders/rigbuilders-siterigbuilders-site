"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { allProducts } from "../data/products";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat ? initialCat : "All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract Categories
  const categories = useMemo(() => ["All", ...Array.from(new Set(allProducts.map(p => p.category)))], []);
  
  // Extract Brands (Dynamic based on Category)
  const availableBrands = useMemo(() => {
    let products = allProducts;
    if (selectedCategory !== "All") {
      products = products.filter(p => p.category === selectedCategory);
    }
    return ["All", ...Array.from(new Set(products.map(p => p.brand)))];
  }, [selectedCategory]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return allProducts.filter(item => {
      const matchCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchBrand = selectedBrand === "All" || item.brand === selectedBrand;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchBrand && matchSearch;
    });
  }, [selectedCategory, selectedBrand, searchQuery]);

  return (
    <main className="min-h-screen bg-brand-black text-white font-saira">
      <Navbar />
      
      {/* HEADER */}
      <section className="pt-32 pb-12 px-6 border-b border-white/5 bg-brand-charcoal">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-orbitron font-bold text-4xl text-white mb-2">PRODUCT <span className="text-brand-purple">CATALOG</span></h1>
          <p className="text-brand-silver">Premium hardware. Verified for compatibility. In Stock.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR */}
        <aside className="space-y-8 h-fit lg:sticky lg:top-24">
          <div>
            <h3 className="font-orbitron font-bold text-white mb-4 uppercase tracking-wider text-sm">Search</h3>
            <input 
              type="text" 
              placeholder="Search components..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-brand-purple focus:outline-none"
            />
          </div>

          <div>
            <h3 className="font-orbitron font-bold text-white mb-4 uppercase tracking-wider text-sm">Categories</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSelectedBrand("All"); }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors uppercase ${selectedCategory === cat ? "bg-brand-purple text-white font-bold" : "text-brand-silver hover:bg-white/5"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-orbitron font-bold text-white mb-4 uppercase tracking-wider text-sm">Brands</h3>
            <div className="flex flex-wrap gap-2">
              {availableBrands.map(brand => (
                <button 
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1 rounded text-xs border transition-all ${
                    selectedBrand === brand 
                    ? "bg-white text-brand-black border-white font-bold" 
                    : "bg-transparent text-brand-silver border-white/10 hover:border-white/30"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <span className="text-brand-silver text-sm">Showing {filteredProducts.length} results</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white/5 border border-white/5 rounded-xl p-6 hover:border-brand-purple/50 transition-all group flex flex-col relative overflow-hidden">
                
                {!product.inStock && (
                   <div className="absolute top-4 right-4 z-10">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Sold Out</span>
                   </div>
                )}

                <div className="h-40 bg-black/50 rounded-lg mb-4 flex items-center justify-center group-hover:bg-brand-purple/10 transition-colors">
                    <span className="text-brand-silver/20 font-orbitron text-2xl font-bold group-hover:scale-110 transition-transform">
                        {product.brand}
                    </span>
                </div>

                <div className="mb-4 grow">
                    <span className="text-[10px] uppercase tracking-widest text-brand-purple font-bold block mb-1">{product.category}</span>
                    <h3 className="text-white font-bold font-saira text-lg leading-tight">{product.name}</h3>
                    <p className="text-xs text-brand-silver/60 mt-2">
                      {'socket' in product ? `Socket: ${(product as any).socket}` : ''}
                      {'vram' in product ? `VRAM: ${(product as any).vram}GB` : ''}
                      {'wattage' in product ? `Power: ${(product as any).wattage}W` : ''}
                    </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-white font-bold text-lg">₹{product.price.toLocaleString("en-IN")}</span>
                    <button 
                        disabled={!product.inStock}
                        className={`text-xs px-4 py-2 rounded font-bold transition-colors ${
                            product.inStock 
                            ? "bg-brand-purple hover:bg-white hover:text-brand-black text-white" 
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                        }`}
                    >
                        {product.inStock ? "Add" : "No Stock"}
                    </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
             <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                <p className="text-brand-silver text-lg">No products found matching filters.</p>
                <button onClick={() => {setSelectedCategory("All"); setSelectedBrand("All"); setSearchQuery("")}} className="mt-4 text-brand-purple underline">Clear All Filters</button>
             </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}