"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaSearch, FaPlus, FaTrash, FaAmazon, FaStore, FaGlobe } from "react-icons/fa";

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form State
  const [source, setSource] = useState<"offline" | "amazon" | "website">("offline");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [externalId, setExternalId] = useState(""); // For Amazon Order IDs
  
  // Cart State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  // Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Replace with your actual admin email check
      if (user?.email !== "rigbuilders123@gmail.com") {
        router.push("/");
      } else {
        setIsAdmin(true);
      }
    };
    checkUser();
  }, [router]);

  // Product Search
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('products')
        .select('id, name, price, category, brand, image_url')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
      
      if (data) setSearchResults(data);
    };
    const delayDebounce = setTimeout(search, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const addToCart = (product: any) => {
    setCart([...cart, { ...product, tempId: Math.random() }]); // Add simple duplicate handling
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeFromCart = (tempId: number) => {
    setCart(cart.filter(item => item.tempId !== tempId));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!customer.name) return alert("Customer Name is required");
    
    setLoading(true);
    try {
        // 1. Generate Custom ID (Simple Random for now, later we do RB-2425-001 logic)
        const orderDisplayId = `RB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 2. Create the Order Row
        const { data: orderData, error: orderError } = await supabase
            .from('orders_ops')
            .insert({
                order_display_id: orderDisplayId,
                source: source,
                status: 'payment_received', // Assuming manual entry means paid or cash
                type: 'component', // Defaulting to component for now
                guest_info: customer,
                total_amount: calculateTotal(),
                payment_status: 'paid', // Mark paid immediately for offline/amazon
                // Store external ID if Amazon
                ...(source === 'amazon' && { note: `Amazon Ref: ${externalId}` })
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 3. Create Procurement Items (The "To Buy" List)
        const procurementPayload = cart.map(item => ({
            order_id: orderData.id,
            product_name: item.name,
            sku: item.id, // Using product ID as SKU for now
            category: item.category,
            status: 'pending', // Needs to be bought
            distributor_name: null, // Unknown yet
            cost_price: 0 // Unknown yet
        }));

        const { error: procError } = await supabase
            .from('procurement_items')
            .insert(procurementPayload);

        if (procError) throw procError;

        alert(`Order Created! ID: ${orderDisplayId}`);
        // Reset Form
        setCart([]);
        setCustomer({ name: "", email: "", phone: "", address: "" });
        setExternalId("");

    } catch (err: any) {
        console.error(err);
        alert("Failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
            <div>
                <h1 className="font-orbitron text-3xl font-bold text-brand-purple">NEW ORDER ENTRY</h1>
                <p className="text-brand-silver text-sm mt-1">Manual logging for Walk-ins & Amazon</p>
            </div>
            <div className="text-right">
                <div className="text-xs text-brand-silver uppercase font-bold tracking-widest mb-1">Total Amount</div>
                <div className="text-4xl font-orbitron font-bold">₹{calculateTotal().toLocaleString("en-IN")}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: CUSTOMER & SOURCE */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Source Selector */}
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                    <label className="text-xs text-brand-purple uppercase font-bold mb-3 block">Order Source</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setSource("offline")} className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${source === "offline" ? "bg-brand-purple text-white border-brand-purple" : "border-white/10 hover:bg-white/5"}`}>
                            <FaStore className="mb-1" /> <span className="text-[10px] font-bold">STORE</span>
                        </button>
                        <button onClick={() => setSource("amazon")} className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${source === "amazon" ? "bg-[#FF9900] text-black border-[#FF9900]" : "border-white/10 hover:bg-white/5"}`}>
                            <FaAmazon className="mb-1" /> <span className="text-[10px] font-bold">AMAZON</span>
                        </button>
                        <button onClick={() => setSource("website")} className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${source === "website" ? "bg-blue-600 text-white border-blue-600" : "border-white/10 hover:bg-white/5"}`}>
                            <FaGlobe className="mb-1" /> <span className="text-[10px] font-bold">WEB</span>
                        </button>
                    </div>
                    {source === 'amazon' && (
                        <input 
                            placeholder="Amazon Order ID (e.g. 404-1234567)" 
                            className="w-full mt-4 bg-black/40 border border-white/10 rounded p-2 text-sm"
                            value={externalId}
                            onChange={(e) => setExternalId(e.target.value)}
                        />
                    )}
                </div>

                {/* Customer Details */}
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 space-y-3">
                    <label className="text-xs text-brand-purple uppercase font-bold mb-1 block">Customer Details</label>
                    <input placeholder="Full Name" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm" 
                        value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                    <input placeholder="Phone Number" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm" 
                        value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                    <input placeholder="Email (Optional)" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm" 
                        value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                    <textarea placeholder="Billing Address" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm h-20 resize-none" 
                        value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
                </div>
            </div>

            {/* RIGHT: PRODUCT SEARCH & CART */}
            <div className="lg:col-span-2 flex flex-col h-full">
                
                {/* Search Bar */}
                <div className="relative mb-4">
                    <FaSearch className="absolute left-4 top-3.5 text-brand-silver" />
                    <input 
                        placeholder="Search products to add..." 
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-purple outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* Live Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-14 left-0 w-full bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden max-h-60 overflow-y-auto">
                            {searchResults.map(p => (
                                <div key={p.id} onClick={() => addToCart(p)} className="flex items-center gap-4 p-3 hover:bg-brand-purple/20 cursor-pointer border-b border-white/5 last:border-0 transition-colors">
                                    <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-[10px]">{p.category.substring(0,2).toUpperCase()}</div>
                                    <div className="flex-grow">
                                        <div className="text-sm font-bold">{p.name}</div>
                                        <div className="text-xs text-brand-silver">₹{p.price}</div>
                                    </div>
                                    <FaPlus className="text-brand-purple" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart List */}
                <div className="flex-grow bg-[#1A1A1A] rounded-xl border border-white/5 p-4 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-brand-silver uppercase">Items ({cart.length})</span>
                        <span className="text-xs font-bold text-brand-silver uppercase">Price</span>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-brand-silver/30 space-y-2">
                                <FaStore size={40} />
                                <p className="text-sm">Cart is empty</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.tempId} className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5 group hover:border-white/20">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => removeFromCart(item.tempId)} className="text-red-500/50 hover:text-red-500 transition-colors">
                                            <FaTrash size={12} />
                                        </button>
                                        <div>
                                            <div className="text-sm font-bold text-white">{item.name}</div>
                                            <div className="text-[10px] text-brand-silver uppercase">{item.brand} • {item.category}</div>
                                        </div>
                                    </div>
                                    <div className="font-orbitron font-bold">₹{item.price.toLocaleString("en-IN")}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    onClick={handleSubmit} 
                    disabled={loading || cart.length === 0}
                    className="w-full bg-brand-purple hover:bg-white hover:text-black text-white py-4 rounded-xl font-orbitron font-bold uppercase tracking-widest mt-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Processing..." : "Create Order"}
                </button>

            </div>
        </div>
      </div>
    </div>
  );
}