"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { allProducts } from "@/app/data/products"; 
import { FaBars, FaTimes, FaSearch, FaShoppingCart, FaUser } from "react-icons/fa";

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
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
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

// --- SUB-COMPONENTS ---

// 1. User Menu (Fixed Hover Gap & Spacing)
const UserAccountMenu = ({ user }: { user: User | null }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  // FIX: Wrapper now uses 'pt-2' instead of 'mt-2'. 
  // This transparent padding acts as a bridge so the mouse doesn't "fall" through the gap.
  const wrapperClasses = "absolute top-full right-0 w-64 pt-2 z-50 cursor-default";
  
  // Inner visible box handles the background and borders
  const innerClasses = "bg-[#090909] border border-white/10 shadow-2xl font-saira text-white";

  if (user) {
    return (
      <div className={wrapperClasses}>
        <div className={innerClasses}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center bg-white/5">
                    <FaUser className="text-sm" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate font-orbitron">{user.user_metadata.full_name || "RigBuilder"}</p>
                    <p className="text-[10px] text-brand-silver truncate">{user.email}</p>
                </div>
            </div>
            </div>
            {/* Links List */}
            <div className="py-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-sm text-brand-silver hover:text-white"><span>→</span> Dashboard</Link>
            <Link href="/dashboard" className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-sm text-brand-silver hover:text-white"><span>→</span> Orders</Link>
            <Link href="/cart" className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-sm text-brand-silver hover:text-white"><span>→</span> Cart</Link>
            <Link href="/support" className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-sm text-brand-silver hover:text-white"><span>→</span> Support</Link>
            
            <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-6 py-4 hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors text-sm border-t border-white/10 mt-2 font-bold">
                <span>→</span> Sign Out
            </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
        <div className={`${innerClasses} p-6 text-center`}>
            <p className="text-sm font-bold mb-4 font-orbitron">WELCOME</p>
            <div className="space-y-4">
                <Link href="/signin" className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs uppercase font-bold tracking-wider transition-all">Log In</Link>
                <Link href="/signup" className="block w-full py-3 bg-brand-purple hover:bg-white hover:text-black text-white text-xs uppercase font-bold tracking-wider transition-all">Sign Up</Link>
            </div>
        </div>
    </div>
  );
};

// 2. Search Menu (Top Right Hover)
const SearchMenu = () => {
  const { query, setQuery, suggestions, handleSearch } = useGlobalSearch();

  return (
    // Added 'pt-2' here as well to fix the gap issue for search too
    <div className="absolute top-full right-0 w-[400px] pt-0 z-50"> 
        <div className="bg-[#090909] border border-white/10 shadow-2xl p-6 font-saira text-white">
            <div className="relative mb-6">
                <Image src="/icons/navbar/search.svg" alt="Search" width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70" />
                <input 
                    type="text" 
                    placeholder="Search rigbuilders.in..." 
                    className="w-full bg-[#090909] border border-white/20 text-white text-sm py-3 pl-12 focus:outline-none focus:border-brand-purple transition-colors rounded-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => handleSearch(e)}
                    autoFocus
                />
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-[#1A1A1A] border border-white/10 mt-1 rounded shadow-xl z-[60]">
                        {suggestions.map((product) => (
                            <div key={product.id} onClick={() => handleSearch(product.name)} className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center text-xs border-b border-white/5 last:border-0">
                                <span className="text-white truncate">{product.name}</span>
                                <span className="text-brand-purple font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div>
                <h4 className="font-orbitron font-bold text-xs text-white mb-4 uppercase tracking-widest">Quick Links</h4>
                <ul className="space-y-3 text-sm text-brand-silver">
                    <li><Link href="/ascend" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> Ascend Series</Link></li>
                    <li><Link href="/products" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> All Components</Link></li>
                    <li><Link href="/configure" className="hover:text-white transition-colors flex items-center gap-2"><span>→</span> System Configurator</Link></li>
                </ul>
            </div>
        </div>
    </div>
  )
}

// 3. Quick Link Item
const QuickLinkItem = ({ href, label }: { href: string, label: string }) => (
    <li className="group/item">
        <Link href={href} className="flex items-center gap-2 hover:text-white transition-colors">
            <span className="relative w-3 h-3 opacity-50 group-hover/item:opacity-100 transition-opacity">
                <Image src="/icons/navbar/products/arrow.svg" alt="->" fill className="object-contain" />
            </span>
            {label}
        </Link>
    </li>
);

// --- MAIN NAVBAR ---
export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: string) => {
    // If there is a pending close action, cancel it immediately
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    // Add a delay (e.g., 200ms) before closing
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200); 
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const search = useGlobalSearch(); 
  const megaMenuSearch = useGlobalSearch(); 

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  
  return (
    <>
    <nav className="sticky top-0 left-0 w-full z-50 bg-[#090909] border-b border-white/10 font-orbitron" onMouseLeave={() => setActiveMenu(null)}>
      <div className="h-[80px] px-[30px] flex items-center justify-between relative bg-[#090909] z-50">
        {/* MOBILE HAMBURGER */}
        <div className="lg:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(true)} className="text-white text-2xl p-2"><FaBars /></button>
        </div>

        {/* LOGO */}
        <Link href="/" className="flex-shrink-0 flex items-center justify-center">
           <div className="hidden lg:block relative h-10 w-40"><Image src="/icons/navbar/logo.png" alt="Rig Builders" fill className="object-contain object-left" priority /></div>
           <div className="lg:hidden relative h-10 w-10"><Image src="/icons/navbar/logo.svg" alt="Rig Builders" fill className="object-contain" priority /></div>
        </Link>

        {/* MOBILE SEARCH */}
        <div className="lg:hidden flex items-center">
            <button onClick={() => setMobileSearchOpen(true)} className="text-white text-xl p-2"><FaSearch /></button>
        </div>

        {/* DESKTOP RIGHT SECTION (Links + Icons) */}
        <div className="hidden lg:flex items-center h-full gap-[35px]">
          
          {/* NAV LINKS */}
          <div className="flex items-center gap-[35px] text-[15px] font-bold tracking-widest text-white h-full">
            {["products", "desktops", "accessories", "support"].map((menu) => (
                <div key={menu} className="h-full flex items-center relative group" onMouseEnter={() => setActiveMenu(menu)}>
                  <Link href={`/${menu}`} className="flex items-center h-full px-2 cursor-pointer uppercase hover:text-brand-purple transition-colors">{menu}</Link>
                  <span className={`absolute bottom-0 left-0 w-full h-[3px] bg-brand-purple transition-transform duration-200 origin-center ${activeMenu === menu ? "scale-x-100" : "scale-x-0"}`}></span>
                </div>
            ))}
          </div>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-[20px] h-full">
            <Link href="/cart" className="relative group p-2 hover:opacity-80"><Image src="/icons/navbar/cart.png" alt="Cart" width={28} height={28} /></Link>

            {/* User Icon */}
            <div 
              className="relative h-full flex items-center group" 
              onMouseEnter={() => handleMouseEnter("user")} 
              onMouseLeave={handleMouseLeave}
            >
              <button className="p-2 hover:opacity-80">
                <Image src="/icons/navbar/User Account.svg" alt="Account" width={26} height={26} />
              </button>
              
              {/* The UserAccountMenu component already has 'pt-2' in your code.
                 Combined with the handleMouseLeave delay above, this creates a 
                 perfect bridge so the menu won't close unexpectedly.
              */}
              {activeMenu === "user" && <UserAccountMenu user={user} />}
            </div>

            {/* Search Icon */}
            <div className="relative h-full flex items-center group" onMouseEnter={() => setActiveMenu("search")} onMouseLeave={() => setActiveMenu(null)}>
              <button className="p-2 hover:opacity-80"><Image src="/icons/navbar/search.svg" alt="Search" width={28} height={28} /></button>
              {activeMenu === "search" && <SearchMenu />}
            </div>
            
            <Link href="/configure">
              <button className="border border-white text-white w-[150px] h-[36px] text-[11px] font-bold tracking-[0.15em] hover:bg-white hover:text-[#121212] transition-all uppercase flex items-center justify-center">BUILD YOURS</button>
            </Link>
          </div>
        </div>
      </div>
  
      {/* --- MEGA MENUS --- */}

      {/* 1. PRODUCTS HOVER */}
      <div className={`hidden lg:block absolute top-[80px] left-0 w-full bg-[#090909] border-t border-white/10 transition-all duration-300 overflow-hidden z-40 ${activeMenu === "products" ? "max-h-[600px] opacity-100 visible" : "max-h-0 opacity-0 invisible"}`}
           onMouseEnter={() => setActiveMenu("products")} onMouseLeave={() => setActiveMenu(null)}>
        
        {/* FIXED: Removed wide gap, added 'divide-x' for vertical lines, brought columns closer */}
        <div className="max-w-[1400px] mx-auto py-12 px-8 grid grid-cols-4 divide-x divide-white/10 text-white font-saira">
            
            {/* PC Components */}
            <div className="px-8"> {/* Added padding inside column instead of gap */}
                <div className="flex gap-4 mb-6"><Image src="/icons/navbar/products/PC Components.svg" alt="Icon" width={32} height={32} /><Image src="/icons/navbar/products/PC Components 2.png" alt="Icon" width={32} height={32} /></div>
                <h3 className="font-orbitron text-lg font-bold mb-4 text-white uppercase tracking-wider">PC Components</h3>
                <ul className="space-y-2 text-sm text-brand-silver">
                    <li><Link href="/products/cpu" className="hover:text-brand-purple transition-colors">Processors</Link></li>
                    <li><Link href="/products/gpu" className="hover:text-brand-purple transition-colors">Graphics Cards</Link></li>
                    <li><Link href="/products/motherboard" className="hover:text-brand-purple transition-colors">Motherboards</Link></li>
                    <li><Link href="/products/ram" className="hover:text-brand-purple transition-colors">Memory (RAM)</Link></li>
                    <li><Link href="/products/storage" className="hover:text-brand-purple transition-colors">Storage</Link></li>
                    <li><Link href="/products/psu" className="hover:text-brand-purple transition-colors">Power Supply</Link></li>
                    <li><Link href="/products/cabinet" className="hover:text-brand-purple transition-colors">PC Cabinets</Link></li>
                    <li><Link href="/products/cooler" className="hover:text-brand-purple transition-colors">Cooling</Link></li>
                </ul>
            </div>

            {/* Desktops */}
            <div className="px-8">
                <div className="mb-6"><Image src="/icons/navbar/products/Desktops.png" alt="Desktops" width={40} height={40} /></div>
                <h3 className="font-orbitron text-lg font-bold mb-4 text-white uppercase tracking-wider">Desktops</h3>
                <ul className="space-y-2 text-sm text-brand-silver">
                    <li><Link href="/ascend" className="hover:text-brand-purple">Ascend Series</Link></li>
                    <li><Link href="/workpro" className="hover:text-brand-purple">WorkPro Series</Link></li>
                    <li><Link href="/creator" className="hover:text-brand-purple">Creator Series</Link></li>
                    <li><Link href="/signature" className="hover:text-brand-purple">Signature Series</Link></li>
                </ul>
            </div>

            {/* Accessories */}
            <div className="px-8">
                <div className="mb-6"><Image src="/icons/navbar/products/Accessories.png" alt="Accessories" width={40} height={40} /></div>
                <h3 className="font-orbitron text-lg font-bold mb-4 text-white uppercase tracking-wider">Accessories</h3>
                <ul className="space-y-2 text-sm text-brand-silver">
                    <li><Link href="/products/monitor" className="hover:text-brand-purple">Displays</Link></li>
                    <li><Link href="/products/keyboard" className="hover:text-brand-purple">Keyboards</Link></li>
                    <li><Link href="/products/mouse" className="hover:text-brand-purple">Mouse</Link></li>
                    <li><Link href="/products/combo" className="hover:text-brand-purple">Combos</Link></li>
                    <li><Link href="/products/mousepad" className="hover:text-brand-purple">Mouse Pads</Link></li>
                    <li><Link href="/products/usb" className="hover:text-brand-purple">USB Drives</Link></li>
                </ul>
            </div>

            {/* Quick Links + Search */}
            <div className="px-8">
                <div className="relative mb-8">
                    <Image src="/icons/navbar/search.svg" alt="Search" width={14} height={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                    <input type="text" placeholder="Search..." className="w-full bg-white/5 border border-white/10 text-white text-sm py-2 pl-10 focus:outline-none focus:border-brand-purple rounded-sm"
                        value={megaMenuSearch.query} onChange={(e) => megaMenuSearch.setQuery(e.target.value)} onKeyDown={megaMenuSearch.handleSearch} />
                </div>
                <h3 className="font-orbitron text-lg font-bold mb-4 text-white uppercase tracking-wider">Quick Links</h3>
                <ul className="space-y-3 text-sm text-brand-silver">
                    <QuickLinkItem href="/ascend" label="Ascend Series" />
                    <QuickLinkItem href="/products/cpu" label="Processors" />
                    <QuickLinkItem href="/products/gpu" label="Graphics Cards" />
                    <QuickLinkItem href="/products/monitor" label="Displays" />
                </ul>
            </div>
        </div>
      </div>

      {/* 2. DESKTOPS HOVER */}
      <div className={`hidden lg:block absolute top-[80px] left-0 w-full bg-[#090909] border-t border-white/10 transition-all duration-300 overflow-hidden z-40 ${activeMenu === "desktops" ? "max-h-[600px] opacity-100 visible" : "max-h-0 opacity-0 invisible"}`}
           onMouseEnter={() => setActiveMenu("desktops")} onMouseLeave={() => setActiveMenu(null)}>
        <div className="max-w-[1400px] mx-auto py-20 grid grid-cols-4 divide-x divide-white/10 text-white text-center">
            <div className="px-4 flex flex-col items-center group">
                <h2 className="text-[40px] leading-tight mb-8 group-hover:text-brand-purple transition-colors" style={{ fontFamily: '"Android Assassin", "Orbitron", sans-serif' }}>ASCEND</h2>
                <Link href="/ascend" className="border border-white/30 py-3 px-8 text-[10px] font-bold tracking-[0.2em] font-orbitron hover:bg-white hover:text-black transition-all">VIEW SERIES</Link>
            </div>
            <div className="px-4 flex flex-col items-center group">
                <h2 className="text-[40px] font-semibold leading-tight mb-8 group-hover:text-brand-purple transition-colors" style={{ fontFamily: '"Montserrat", sans-serif' }}><span className="uppercase">W</span>ork<span className="uppercase">P</span>ro</h2>
                <Link href="/workpro" className="border border-white/30 py-3 px-8 text-[10px] font-bold tracking-[0.2em] font-orbitron hover:bg-white hover:text-black transition-all">VIEW SERIES</Link>
            </div>
            <div className="px-4 flex flex-col items-center group">
                <h2 className="text-[40px] font-semibold leading-tight mb-8 uppercase group-hover:text-brand-purple transition-colors" style={{ fontFamily: '"Saira", sans-serif', fontStretch: 'expanded' }}>CREATOR</h2>
                <Link href="/creator" className="border border-white/30 py-3 px-8 text-[10px] font-bold tracking-[0.2em] font-orbitron hover:bg-white hover:text-black transition-all">VIEW SERIES</Link>
            </div>
            <div className="px-4 flex flex-col items-center group">
                <h2 className="text-[40px] font-bold leading-tight mb-8 uppercase group-hover:text-brand-purple transition-colors font-orbitron">SIGNATURE</h2>
                <Link href="/signature" className="border border-white/30 py-3 px-8 text-[10px] font-bold tracking-[0.2em] font-orbitron hover:bg-white hover:text-black transition-all">VIEW SERIES</Link>
            </div>
        </div>
      </div>
                  
      {/* 3. ACCESSORIES HOVER */}
      <div className={`hidden lg:block absolute top-[80px] left-0 w-full bg-[#090909] border-t border-white/10 transition-all duration-300 overflow-hidden z-40 ${activeMenu === "accessories" ? "max-h-[600px] opacity-100 visible" : "max-h-0 opacity-0 invisible"}`}
           onMouseEnter={() => setActiveMenu("accessories")} onMouseLeave={() => setActiveMenu(null)}>
        <div className="max-w-[1200px] mx-auto py-16 px-8 flex gap-16">
            <div className="flex-shrink-0 w-1/4 border-r border-white/10 pr-12">
                <div className="mb-6"><Image src="/icons/navbar/products/Accessories.png" alt="Accessories" width={64} height={64} /></div>
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2 uppercase">Accessories</h3>
                <p className="text-brand-silver text-sm font-saira leading-relaxed">Upgrade your battle station with premium peripherals and displays.</p>
            </div>
            <div className="flex-grow grid grid-cols-2 gap-y-6 gap-x-12 text-sm font-saira">
                {[
                    { name: "Displays", link: "/products/monitor" },
                    { name: "Keyboards", link: "/products/keyboard" },
                    { name: "Mouse", link: "/products/mouse" },
                    { name: "Keyboard & Mouse Combos", link: "/products/combo" },
                    { name: "Mouse Pads", link: "/products/mousepad" },
                    { name: "USB Drives", link: "/products/usb" },
                ].map((item) => (
                    <Link key={item.name} href={item.link} className="flex items-center gap-4 hover:text-brand-purple transition-colors group">
                        <span className="w-1.5 h-1.5 bg-white/30 rounded-full group-hover:bg-brand-purple transition-colors"></span>
                        <span className="text-lg uppercase tracking-wide font-medium">{item.name}</span>
                    </Link>
                ))}
            </div>
        </div>
      </div>
      
     {/* ... (Mobile menu drawer) ... */}   
      
      <div className={`absolute top-0 left-0 w-full h-[100dvh] z-[90] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`} onClick={() => setMobileMenuOpen(false)}>
            <div 
                className={`absolute top-0 left-0 h-[100dvh] w-[85%] max-w-[320px] bg-[#121212] border-r border-white/10 shadow-2xl p-6 transition-transform duration-300 flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
                onClick={(e) => e.stopPropagation()} 
            >
                {/* ... (Keep all the inner content exactly the same) ... */}
                
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <div className="relative h-10 w-10">
                        <Image src="/icons/navbar/logo.svg" alt="Logo" fill className="object-contain" />
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-white text-2xl"><FaTimes /></button>
                </div>

                {/* ACTION GRID */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <Link href={user ? "/dashboard" : "/signin"} onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-center justify-center bg-[#1A1A1A] p-3 rounded border border-white/5 hover:border-brand-purple/50">
                        <FaUser className="text-white mb-2" />
                        <span className="text-[10px] text-brand-silver uppercase font-bold">{user ? "Account" : "Login"}</span>
                    </Link>
                    <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-center justify-center bg-[#1A1A1A] p-3 rounded border border-white/5 hover:border-brand-purple/50">
                        <FaShoppingCart className="text-white mb-2" />
                        <span className="text-[10px] text-brand-silver uppercase font-bold">Cart</span>
                    </Link>
                    <Link href="/configure" onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-center justify-center bg-brand-purple p-3 rounded text-white">
                        <span className="font-bold text-lg leading-none mb-1">+</span>
                        <span className="text-[10px] uppercase font-bold">Build</span>
                    </Link>
                </div>

                {/* LINKS LIST */}
                <div className="space-y-8 overflow-y-auto font-orbitron flex-grow pr-2">
                    <div>
                        <h3 className="text-brand-purple text-xs font-bold uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Main Menu</h3>
                        <ul className="space-y-4 text-white text-lg">
                            <li><Link href="/products" onClick={() => setMobileMenuOpen(false)}>Products</Link></li>
                            <li><Link href="/accessories" onClick={() => setMobileMenuOpen(false)}>Accessories</Link></li>
                            <li><Link href="/support" onClick={() => setMobileMenuOpen(false)}>Support</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-brand-purple text-xs font-bold uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Desktops</h3>
                        <ul className="space-y-4 text-white text-lg">
                            <li><Link href="/ascend" onClick={() => setMobileMenuOpen(false)}>Ascend Series</Link></li>
                            <li><Link href="/workpro" onClick={() => setMobileMenuOpen(false)}>WorkPro Series</Link></li>
                            <li><Link href="/creator" onClick={() => setMobileMenuOpen(false)}>Creator Series</Link></li>
                            <li><Link href="/signature" onClick={() => setMobileMenuOpen(false)}>Signature Edition</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-auto pt-6 text-center text-xs text-brand-silver/50 border-t border-white/10 font-saira">
                    &copy; 2025 Rig Builders.
                </div>
            </div>
      </div>

    </nav>

    {/* ==============================
        MOBILE DRAWERS 
       ============================== */}

    {/* MOBILE SEARCH */}
    {mobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-[#121212] p-6 animate-in slide-in-from-top-10 duration-200 flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-orbitron text-white">Search</h2>
                <button onClick={() => setMobileSearchOpen(false)} className="text-white text-2xl"><FaTimes /></button>
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search anything..." 
                    className="w-full bg-[#1A1A1A] border border-white/20 p-4 text-white font-saira focus:border-brand-purple outline-none rounded"
                    value={search.query}
                    onChange={(e) => search.setQuery(e.target.value)}
                    autoFocus
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-purple">
                    <FaSearch />
                </button>
            </div>
            {/* Mobile Results */}
            {search.suggestions.length > 0 && (
                <div className="mt-4 bg-[#1A1A1A] border border-white/10 rounded flex-grow overflow-y-auto">
                    {search.suggestions.map((p) => (
                        <div key={p.id} onClick={() => { search.handleSearch(p.name); setMobileSearchOpen(false); }} className="p-4 border-b border-white/5 text-white flex justify-between">
                            <span className="truncate pr-4">{p.name}</span>
                            <span className="text-brand-purple font-bold">₹{p.price.toLocaleString("en-IN")}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )}

    
    </>
  );
}