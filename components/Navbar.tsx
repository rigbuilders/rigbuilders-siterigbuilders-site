"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { allProducts } from "@/app/data/products"; 

// --- SEARCH HOOK ---
const useGlobalSearch = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (query.trim().length > 1) {
      const lowerQuery = query.toLowerCase();
      const matches = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.brand.toLowerCase().includes(lowerQuery)
      ).slice(0, 5); 
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement> | string) => {
    const searchTerm = typeof e === 'string' ? e : query;
    const isEnter = typeof e !== 'string' && e.key === 'Enter';

    if ((isEnter || typeof e === 'string') && searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSuggestions([]); 
    }
  };

  return { query, setQuery, suggestions, handleSearch };
};

// --- USER MENU ---
const UserAccountMenu = ({ user }: { user: User | null }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  const menuWrapperClasses = "absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#121212] border border-white/10 shadow-2xl font-saira text-white z-50 cursor-default";
  const Bridge = () => <div className="absolute -top-6 left-0 w-full h-6 bg-transparent" />;

  if (user) {
    return (
      <div className={`${menuWrapperClasses} w-64`}>
        <Bridge />
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center">
              <Image src="/icons/navbar/User Account.svg" alt="User" width={16} height={16} />
           </div>
           <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.user_metadata.full_name || "User"}</p>
              <p className="text-[10px] text-brand-silver truncate">{user.email}</p>
           </div>
        </div>
        <div className="py-2">
          <Link href="/account" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-sm"><span>→</span> Account</Link>
          <Link href="/orders" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-sm"><span>→</span> Orders</Link>
          <Link href="/cart" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-sm"><span>→</span> Cart</Link>
          <Link href="/support" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-sm"><span>→</span> Support</Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-sm border-t border-white/10 mt-2"><span>→</span> Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${menuWrapperClasses} w-48 p-2 text-white/90`}>
      <Bridge />
      <p className="text-sm font-bold p-2 mb-1 text-center">Guest Mode</p>
      <Link href="/signin" className="block text-center w-full py-2 bg-brand-charcoal hover:bg-white/10 transition-colors text-sm">Log In</Link>
      <Link href="/signup" className="block text-center w-full py-2 mt-1 bg-brand-purple hover:bg-brand-purple/80 transition-colors text-sm font-bold">Sign Up</Link>
    </div>
  );
};

// --- SEARCH MENU ---
const SearchMenu = () => {
  const { query, setQuery, suggestions, handleSearch } = useGlobalSearch();

  return (
    <div className="absolute top-full mt-2 right-0 w-[400px] bg-[#121212] border border-white/10 shadow-2xl p-6 font-saira text-white z-50">
       <div className="absolute -top-6 right-0 w-20 h-6 bg-transparent" />
       <div className="relative mb-6">
          <Image src="/icons/navbar/search.svg" alt="Search" width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search rigbuilders.in..." 
            className="w-full bg-transparent border border-white/30 text-white text-sm py-2 pl-10 focus:outline-none focus:border-white transition-colors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => handleSearch(e)}
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-[#1A1A1A] border border-white/10 mt-1 rounded shadow-xl z-[60]">
                {suggestions.map((product) => (
                    <div 
                        key={product.id}
                        onClick={() => handleSearch(product.name)}
                        className="px-4 py-2 hover:bg-white/5 cursor-pointer flex justify-between items-center text-xs"
                    >
                        <span className="text-white truncate">{product.name}</span>
                        <span className="text-brand-purple font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                    </div>
                ))}
            </div>
          )}
       </div>
       <div>
          <h4 className="font-bold text-sm text-white mb-3">Quick links</h4>
          <ul className="space-y-2 text-sm text-brand-silver">
             <li><Link href="/ascend" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Desktops</Link></li>
             <li><Link href="/products" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> All Products</Link></li>
             <li><Link href="/configure" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Build your own rig</Link></li>
          </ul>
       </div>
    </div>
  )
}

// --- MAIN NAVBAR ---
export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const megaMenuSearch = useGlobalSearch(); 

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#121212] border-b border-white/10 font-orbitron" onMouseLeave={() => setActiveMenu(null)}>
      <div className="h-[80px] px-[80px] 2xl:px-[100px] flex items-center justify-between relative">
        
        {/* LOGO */}
        <Link href="/" className="flex-shrink-0 flex items-center">
           <div className="relative h-10 w-40">
             <Image src="/icons/navbar/logo.png" alt="Rig Builders" fill className="object-contain object-left" priority />
           </div>
        </Link>

        {/* CENTER NAVIGATION */}
        <div className="hidden lg:flex items-center h-full gap-12 text-[16px] font-medium tracking-wide text-white">
          
          {/* PRODUCTS (Mega Menu 1) */}
          <div className="h-full flex items-center relative group cursor-pointer" onMouseEnter={() => setActiveMenu("products")}>
            <span className="relative py-2">
              PRODUCTS
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white transition-transform duration-300 origin-center ${activeMenu === "products" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </span>
          </div>

          {/* DESKTOPS (Mega Menu 2 - NEW) */}
          <Link href="/desktops" className="h-full flex items-center relative group" onMouseEnter={() => setActiveMenu("desktops")}>
            <span className="relative py-2">
              DESKTOPS
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white transition-transform duration-300 origin-center ${activeMenu === "desktops" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </span>
          </Link>

          {/* ACCESSORIES */}
          <Link href="/accessories" className="h-full flex items-center relative group" onMouseEnter={() => setActiveMenu(null)}>
            <span className="relative py-2">
              ACCESSORIES
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white transition-transform duration-300 origin-center scale-x-0 group-hover:scale-x-100"></span>
            </span>
          </Link>

          {/* SUPPORT */}
          <Link href="/support" className="h-full flex items-center relative group" onMouseEnter={() => setActiveMenu(null)}>
            <span className="relative py-2">
              SUPPORT
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white transition-transform duration-300 origin-center scale-x-0 group-hover:scale-x-100"></span>
            </span>
          </Link>
        </div>

        {/* RIGHT ICONS */}
        <div className="flex items-center justify-center h-full space-x-[37px]">
          <button className="h-full flex items-center justify-center relative group">
            <div className="relative py-2">
              <Image src="/icons/navbar/cart.png" alt="Cart" width={24} height={24} className="group-hover:opacity-80 transition-opacity" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white transition-transform duration-300 origin-center scale-x-0 group-hover:scale-x-100"></span>
            </div>
          </button>

          <div className="relative h-full flex items-center group" onMouseEnter={() => setActiveMenu("user")} onMouseLeave={() => setActiveMenu(null)}>
            <button className="h-full flex items-center justify-center relative py-2">
              <Image src="/icons/navbar/User Account.svg" alt="Account" width={24} height={24} className="group-hover:opacity-80 transition-opacity" />
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white transition-transform duration-300 origin-center ${activeMenu === "user" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </button>
            {activeMenu === "user" && <UserAccountMenu user={user} />}
          </div>

          <div className="relative h-full flex items-center group" onMouseEnter={() => setActiveMenu("search")} onMouseLeave={() => setActiveMenu(null)}>
             <button className="h-full flex items-center justify-center relative py-2">
                <Image src="/icons/navbar/search.svg" alt="Search" width={24} height={24} className="group-hover:opacity-80 transition-opacity" />
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white transition-transform duration-300 origin-center ${activeMenu === "search" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
             </button>
             {activeMenu === "search" && <SearchMenu />}
          </div>
          
          <Link href="/configure" className="h-full flex items-center">
            <button className="border border-white text-white px-[20px] py-[8px] text-xs font-medium tracking-wider hover:bg-white hover:text-[#121212] transition-all uppercase leading-none" style={{ width: '153px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              BUILD YOURS
            </button>
          </Link>
        </div>
      </div>

      {/* --- MEGA MENUS --- */}
      
      {/* 1. PRODUCTS MENU (Original) */}
      <div 
        className={`absolute top-[80px] left-0 w-full bg-[#121212]/90 backdrop-blur-md border-t border-white/10 transition-all duration-300 overflow-hidden ${activeMenu === "products" ? "opacity-100 visible max-h-[600px]" : "opacity-0 invisible max-h-0"}`}
        onMouseEnter={() => setActiveMenu("products")}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="mx-[312px] py-12 grid grid-cols-4 gap-8 text-white">
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
               <Image src="/icons/navbar/products/PC Components 2.png" alt="Chip Icon" width={32} height={32} className="object-contain"/>
               <Image src="/icons/navbar/products/PC Components.svg" alt="Fan Icon" width={32} height={32} className="object-contain"/>
            </div>
            <h3 className="font-orbitron text-lg font-bold text-white mb-2">PC Components</h3>
            <ul className="space-y-3 text-sm font-saira text-brand-silver">
              <li><Link href="/products?category=cpu" className="hover:text-white transition-colors">Processors</Link></li>
              <li><Link href="/products?category=gpu" className="hover:text-white transition-colors">Graphics Card</Link></li>
              <li><Link href="/products?category=motherboard" className="hover:text-white transition-colors">Motherboards</Link></li>
              <li><Link href="/products?category=storage" className="hover:text-white transition-colors">Storage</Link></li>
              <li><Link href="/products?category=psu" className="hover:text-white transition-colors">Power Supply</Link></li>
              <li><Link href="/products?category=ram" className="hover:text-white transition-colors">RAM</Link></li>
              <li><Link href="/products?category=cabinet" className="hover:text-white transition-colors">PC Cabinets</Link></li>
              <li><Link href="/products?category=cooler" className="hover:text-white transition-colors">Air/Liquid Cooler</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <div className="mb-4 h-[32px] flex items-center">
               <Image src="/icons/navbar/products/Desktops.png" alt="Desktops" width={32} height={32} className="object-contain"/>
            </div>
            <h3 className="font-orbitron text-lg font-bold text-white mb-2">Desktops</h3>
            <ul className="space-y-3 text-sm font-saira text-brand-silver">
              <li><Link href="/ascend" className="hover:text-white transition-colors">Ascend Series</Link></li>
              <li><Link href="/workpro" className="hover:text-white transition-colors">WorkPro Series</Link></li>
              <li><Link href="/creator" className="hover:text-white transition-colors">Creator Series</Link></li>
              <li><Link href="/signature" className="hover:text-white transition-colors">Signature Series</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <div className="mb-4 h-[32px] flex items-center">
               <Image src="/icons/navbar/products/Accessories.png" alt="Accessories" width={32} height={32} className="object-contain"/>
            </div>
            <h3 className="font-orbitron text-lg font-bold text-white mb-2">Accessories</h3>
            <ul className="space-y-3 text-sm font-saira text-brand-silver">
              <li><Link href="/accessories" className="hover:text-white transition-colors">Displays</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Keyboards</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Mouse</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Keyboard Mouse Combos</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">Mouse pads</Link></li>
              <li><Link href="/accessories" className="hover:text-white transition-colors">USB Drives</Link></li>
            </ul>
          </div>
          <div className="space-y-8 pl-8 border-l border-white/10">
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Image src="/icons/navbar/search.svg" alt="Search" width={16} height={16} />
                </div>
                <input 
                  type="text" 
                  placeholder="search rigbuilders.in" 
                  className="w-full bg-transparent border border-white text-white placeholder-brand-silver/70 px-4 py-2 pl-10 text-sm focus:outline-none focus:bg-white/5 transition-colors font-saira" 
                  value={megaMenuSearch.query}
                  onChange={(e) => megaMenuSearch.setQuery(e.target.value)}
                  onKeyDown={(e) => megaMenuSearch.handleSearch(e)}
                />
                {megaMenuSearch.suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-[#1A1A1A] border border-white/10 mt-1 rounded shadow-xl z-[60]">
                        {megaMenuSearch.suggestions.map((product) => (
                            <div 
                                key={product.id}
                                onClick={() => megaMenuSearch.handleSearch(product.name)}
                                className="px-4 py-2 hover:bg-white/5 cursor-pointer flex justify-between items-center text-xs"
                            >
                                <span className="text-white truncate">{product.name}</span>
                                <span className="text-brand-purple font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div>
                <h3 className="font-orbitron text-lg font-bold text-white mb-4">Quick Links :</h3>
                <ul className="space-y-2 text-sm font-saira text-brand-silver">
                    <li><Link href="/ascend" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Ascend Series</Link></li>
                    <li><Link href="/products?category=cpu" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Processors</Link></li>
                    <li><Link href="/products?category=gpu" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Graphics Cards</Link></li>
                    <li><Link href="/accessories" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Keyboard Mouse Combos</Link></li>
                    <li><Link href="/workpro" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> WorkPro Series</Link></li>
                    <li><Link href="/accessories" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Displays</Link></li>
                </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DESKTOPS MEGA MENU (NEW DESIGN) */}
      <div 
        className={`absolute top-[80px] left-0 w-full bg-[#121212]/90 backdrop-blur-md border-t border-white/10 transition-all duration-300 overflow-hidden ${activeMenu === "desktops" ? "opacity-100 visible max-h-[600px]" : "opacity-0 invisible max-h-0"}`}
        onMouseEnter={() => setActiveMenu("desktops")}
        onMouseLeave={() => setActiveMenu(null)}
      >
        {/* Adjusted grid: Removed gap-8, added divide-x for clean vertical lines */}
        <div className="mx-[100px] py-16 grid grid-cols-4 divide-x divide-white/10 text-white">
          
          {/* COL 1: ASCEND */}
          <div className="flex flex-col items-center px-8">
             <div className="text-center">
               <h2 className="text-[40px] uppercase leading-none font-orbitron" style={{ fontFamily: 'Android Assassin, Orbitron, sans-serif' }}>ASCEND</h2>
               <h3 className="text-[22px] font-medium font-orbitron uppercase tracking-widest text-brand-silver mt-[13px] leading-none">SERIES</h3>
             </div>
             <Link href="/ascend" className="w-full mt-[21px]">
                <div className="border border-white/30 py-3 text-center hover:bg-white hover:text-black transition-all cursor-pointer">
                   <span className="font-orbitron font-medium text-[18px] uppercase">GAMING</span>
                </div>
             </Link>
          </div>

          {/* COL 2: WORKPRO */}
          <div className="flex flex-col items-center px-8">
             <div className="text-center">
               <h2 className="text-[40px] font-semibold leading-none font-montserrat">WorkPro</h2>
               <h3 className="text-[22px] font-medium font-orbitron uppercase tracking-widest text-brand-silver mt-[13px] leading-none">SERIES</h3>
             </div>
             <Link href="/workpro" className="w-full mt-[21px]">
                <div className="border border-white/30 py-3 text-center hover:bg-white hover:text-black transition-all cursor-pointer">
                   <span className="font-orbitron font-medium text-[18px] uppercase">WORKSTATIONS</span>
                </div>
             </Link>
          </div>

          {/* COL 3: CREATOR */}
          <div className="flex flex-col items-center px-8">
             <div className="text-center">
               <h2 className="text-[40px] font-medium leading-none font-saira uppercase">CREATOR</h2>
               <h3 className="text-[22px] font-medium font-orbitron uppercase tracking-widest text-brand-silver mt-[13px] leading-none">SERIES</h3>
             </div>
             <Link href="/creator" className="w-full mt-[21px]">
                <div className="border border-white/30 py-3 text-center hover:bg-white hover:text-black transition-all cursor-pointer">
                   <span className="font-orbitron font-medium text-[18px] uppercase">STUDIO</span>
                </div>
             </Link>
          </div>

          {/* COL 4: SIGNATURE */}
          <div className="flex flex-col items-center px-8">
             <div className="text-center">
               <h2 className="text-[40px] font-bold leading-none font-orbitron uppercase">SIGNATURE</h2>
               <h3 className="text-[22px] font-medium font-orbitron uppercase tracking-widest text-brand-silver mt-[13px] leading-none">SERIES</h3>
             </div>
             <Link href="/signature" className="w-full mt-[21px]">
                <div className="border border-white/30 py-3 text-center hover:bg-white hover:text-black transition-all cursor-pointer">
                   <span className="font-orbitron font-medium text-[18px] uppercase">FLAGSHIP</span>
                </div>
             </Link>
          </div>

        </div>
      </div>

    </nav>
  );
}