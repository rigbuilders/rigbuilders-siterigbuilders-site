"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { useState, useMemo, useEffect, use } from "react";
import { useCart } from "@/app/context/CartContext"; 
import { notFound, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; 
import Link from "next/link";

const validCategories = ["cpu", "gpu", "motherboard", "memory", "ram", "storage", "psu", "cooler", "cabinet"];

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const categoryParam = resolvedParams.category.toLowerCase();
  const dbCategory = categoryParam === "memory" ? "ram" : categoryParam;

  if (!validCategories.includes(dbCategory)) { return notFound(); }

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('category', dbCategory);
      if (data) {
        setProducts(data.map(p => ({ ...p, image: p.image_url, ...(p.specs || {}) })));
      }
      setLoading(false);
    };
    fetchProducts();
  }, [dbCategory]);

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
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="flex-grow pt-32 pb-12 px-[40px] lg:px-[80px] 2xl:px-[100px]">
        <div className="flex flex-col lg:flex-row gap-12">
          
          <aside className="w-full lg:w-1/4 h-fit sticky top-28 space-y-8">
            <h1 className="font-orbitron text-2xl font-bold uppercase text-white pb-4 border-b border-white/20">
                {categoryParam.toUpperCase()}
            </h1>
            <div>
               <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider mb-4">Brands</h3>
               <div className="space-y-2">
                 {availableBrands.map((brand) => (
                   <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                     <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${selectedBrand.includes(brand) ? "bg-brand-purple border-brand-purple" : "border-white/30"}`}>
                        {selectedBrand.includes(brand) && <span className="text-xs">✓</span>}
                     </div>
                     <input type="checkbox" className="hidden" onChange={() => toggleFilter(brand, selectedBrand, setSelectedBrand)} />
                     <span className="text-sm text-brand-silver group-hover:text-white">{brand}</span>
                   </label>
                 ))}
               </div>
            </div>
          </aside>

          <div className="w-full lg:w-3/4">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-[#1A1A1A] border border-white/5 p-6 flex flex-col group relative">
                      {!product.in_stock && <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-[10px] px-2 py-1 rounded">Sold Out</div>}

                      <div className="mb-4">
                        <h3 className="font-orbitron text-xl font-bold uppercase">{product.brand}</h3>
                        <span className="text-[10px] text-brand-purple font-bold tracking-widest uppercase">{product.category}</span>
                      </div>

                      <Link href={`/product/${product.id}`} className="block h-48 bg-black/40 border border-white/5 mb-6 flex items-center justify-center hover:opacity-80 transition-opacity">
                         <span className="text-brand-silver/20 font-orbitron text-2xl font-bold -rotate-12 px-4 text-center">{product.name}</span>
                      </Link>
                      
                      <div className="mb-4 flex-grow">
                         <Link href={`/product/${product.id}`}><h4 className="text-white font-bold hover:text-brand-purple transition-colors">{product.name}</h4></Link>
                         <p className="text-brand-silver text-xs mt-2">
                            {product.socket && `Socket: ${product.socket} • `}
                            {product.wattage && `Power: ${product.wattage}W`}
                         </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 mt-auto">
                          <span className="block text-white font-bold text-lg mb-3">₹{product.price.toLocaleString("en-IN")}</span>
                          <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => handleAction(product, false)} disabled={!product.in_stock} className="border border-white text-white text-xs py-2 uppercase hover:bg-white hover:text-black transition-all">
                                  Add to Cart
                              </button>
                              <button onClick={() => handleAction(product, true)} disabled={!product.in_stock} className="bg-brand-purple text-white text-xs py-2 uppercase font-bold hover:bg-white hover:text-black transition-all">
                                  Buy Now
                              </button>
                          </div>
                      </div>
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