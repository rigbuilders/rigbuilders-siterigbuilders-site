"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { FaSearch, FaSpinner } from "react-icons/fa";

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  variant?: "minimal" | "standard"; // minimal for mega menu, standard for main search
  onSearchSubmit?: () => void; // Callback to close menus on selection
}

export default function GlobalSearch({ 
  placeholder = "Search...", 
  className = "",
  variant = "standard",
  onSearchSubmit 
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce Search Logic
  useEffect(() => {
    const fetchResults = async () => {
      // 1. Sanitize: Remove special characters that break the .or() syntax
      const cleanQuery = query.trim().replace(/[,%]/g, ""); 
      
      if (cleanQuery.length > 1) {
        setLoading(true);
        
        // 2. The Query: Use 'ilike' (Case Insensitive) and cleaned query
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, category, image_url, brand')
          .or(`name.ilike.%${cleanQuery}%,brand.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`)
          .limit(6);
        
        if (error) {
            console.error("Search Error:", error.message);
            setResults([]);
        } else if (data) {
            setResults(data);
        }
        
        setLoading(false);
      } else {
        setResults([]);
        setLoading(false);
      }
    };

    // Wait 400ms after user stops typing to avoid spamming the DB
    const delayDebounceFn = setTimeout(fetchResults, 2000);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle Enter Key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      setResults([]);
      if (onSearchSubmit) onSearchSubmit();
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Input Field */}
      <div className="relative">
        <Image 
            src="/icons/navbar/search.svg" 
            alt="Search" 
            width={variant === "minimal" ? 14 : 16} 
            height={variant === "minimal" ? 14 : 16} 
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${variant === "minimal" ? "opacity-50" : "opacity-70"}`} 
        />
        <input 
            type="text" 
            placeholder={placeholder}
            autoComplete="off" 
            className={`w-full text-white text-sm focus:outline-none focus:border-brand-purple transition-colors rounded-sm 
              ${variant === "minimal" 
                ? "bg-white/5 border border-white/10 py-2 pl-10" 
                : "bg-[#090909] border border-white/20 py-3 pl-12"
              }`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus={variant === "standard"}
        />
        {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white animate-spin">
                <FaSpinner />
            </div>
        )}
      </div>

      {/* Results Dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-[#1A1A1A] border border-white/10 mt-1 rounded shadow-xl z-[60] overflow-hidden">
          {results.map((product) => (
            <Link 
                href={`/product/${product.id}`} 
                key={product.id} 
                onClick={() => { setResults([]); if(onSearchSubmit) onSearchSubmit(); }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors group"
            >
                <div className="w-8 h-8 bg-black/50 rounded flex items-center justify-center flex-shrink-0">
                    {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-contain" />}
                </div>
                <div className="flex-grow min-w-0">
                    <p className="text-white text-xs font-bold truncate group-hover:text-brand-white transition-colors">{product.name}</p>
                    <p className="text-brand-silver text-[10px] uppercase">{product.category}</p>
                </div>
                <span className="text-brand-white text-xs font-bold whitespace-nowrap">₹{product.price.toLocaleString("en-IN")}</span>
            </Link>
          ))}
          <button 
            onClick={() => {
                router.push(`/products?search=${encodeURIComponent(query)}`);
                if(onSearchSubmit) onSearchSubmit();
            }}
            className="w-full text-center py-2 text-[10px] uppercase font-bold text-brand-silver hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            View all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
}