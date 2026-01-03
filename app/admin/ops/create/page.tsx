"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaSearch, FaPlus, FaTrash, FaAmazon, FaStore, FaGlobe, FaUser, FaPhone, FaMapMarker, FaEnvelope, FaDesktop, FaGamepad, FaMicrochip } from "react-icons/fa";
import { toast } from "sonner";
import { generateOrderId } from "@/lib/id-generator";

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form State
  const [source, setSource] = useState<"offline" | "amazon" | "website">("offline");
  // NEW: Order Type State (PB = Prebuilt, CB = Custom Build, CS = Components)
  const [orderType, setOrderType] = useState<"PB" | "CB" | "CS">("CS");
  
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", state: "", city: "", pincode: "" });
  const [externalId, setExternalId] = useState(""); // For Amazon Order IDs
  
  // Cart State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  // Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      } else {
        setIsAdmin(true);
      }
    };
    checkUser();
  }, [router]);

  // Search Products
  useEffect(() => {
    const search = async () => {
        if(searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const { data } = await supabase.from('products').select('*').ilike('name', `%${searchQuery}%`).limit(5);
        if(data) setSearchResults(data);
    }
    const delay = setTimeout(search, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const addToCart = (product: any) => {
    setCart([...cart, { ...product, tempId: Math.random() }]); 
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeFromCart = (tempId: number) => {
    setCart(cart.filter(c => c.tempId !== tempId));
  };

  // --- ID GENERATION ---
  const generateNextId = async (type: string) => {
    try {
        const { data: existing } = await supabase.from('counters').select('*').eq('name', type).single();

        if (existing) {
            const nextVal = existing.current_value + 1;
            await supabase.from('counters').update({ current_value: nextVal }).eq('name', type);
            return nextVal;
        } else {
            // Start at 1 for new logic (will appear as 001)
            const startVal = 1; 
            await supabase.from('counters').insert([{ name: type, current_value: startVal }]);
            return startVal;
        }
    } catch (err: any) {
        console.error("Counter Logic Failed:", err);
        return Math.floor(Date.now() / 1000); 
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading("Creating Order & Procurement Items...");

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) throw new Error("No user found");

        let finalDisplayId = "";
        let finalStatus = "processing"; 

        // 1. Generate ID Logic
        if (source === 'amazon') {
            if (!externalId) throw new Error("Amazon Order ID is required");
            finalDisplayId = externalId; 
        } 
      else {
            // USE SHARED GENERATOR (Matches Website Logic)
            finalDisplayId = await generateOrderId(supabase, orderType);
        }
        const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

        // 2. Insert Order (MAIN TABLE)
        const orderPayload = {
            user_id: user.id,
            full_name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: `${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}`,
            source: source, 
            display_id: finalDisplayId,
            status: finalStatus,
            payment_mode: source === 'offline' ? 'CASH/UPI' : 'AMAZON_PAY',
            total_amount: totalAmount,
            shipping_address: customer, 
            items: cart, 
            created_at: new Date().toISOString()
        };

        // IMPORTANT: We use .select() here to get the new Order's UUID
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert([orderPayload])
            .select()
            .single();

        if (orderError) throw orderError;
        if (!newOrder) throw new Error("Order created but no ID returned");

        // 3. Insert Procurement Items (PHASE 2 TRIGGER)
        // This maps every item in the cart to a row in the procurement table
        const procurementPayload = cart.map(item => ({
            order_id: newOrder.id,           // Links to the order above
            product_name: item.name,
            category: item.category || 'other',
            status: 'pending',               // Default status for Phase 2
            quantity: 1,                     // Individual tracking
            cost_price: 0,                   // To be filled in Phase 2
            created_at: new Date().toISOString()
        }));

        const { error: procError } = await supabase
            .from('procurement_items')
            .insert(procurementPayload);

        if (procError) {
            console.error("Procurement Error:", procError);
            toast.warning("Order created, but failed to add items to Procurement list.");
        }

        toast.dismiss(toastId);
        toast.success(`Order ${finalDisplayId} Created!`, {
            description: "Items moved to Procurement Phase."
        });

        // Reset
        setCart([]);
        setCustomer({ name: "", email: "", phone: "", address: "", state: "", city: "", pincode: "" });
        setExternalId("");
        
    } catch (err: any) {
        console.error("Creation Error:", err);
        toast.dismiss(toastId);
        toast.error("Failed to create order", { description: err.message });
    } finally {
        setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-[1200px] mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-2 text-brand-purple">CREATE ORDER</h1>
        <p className="text-brand-silver mb-8 text-sm">Phase 1: Entry • Manual Order Creation</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: FORM (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* Source Selection */}
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Order Source</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => setSource("offline")} className={`flex flex-col items-center justify-center p-4 rounded border transition-all ${source === "offline" ? "bg-brand-purple border-brand-purple text-white" : "bg-black border-white/10 text-brand-silver hover:border-brand-purple"}`}>
                            <FaStore className="mb-2 text-xl" />
                            <span className="text-xs font-bold">OFFLINE</span>
                        </button>
                        <button onClick={() => setSource("amazon")} className={`flex flex-col items-center justify-center p-4 rounded border transition-all ${source === "amazon" ? "bg-[#FF9900] border-[#FF9900] text-black" : "bg-black border-white/10 text-brand-silver hover:border-[#FF9900]"}`}>
                            <FaAmazon className="mb-2 text-xl" />
                            <span className="text-xs font-bold">AMAZON</span>
                        </button>
                        <button onClick={() => setSource("website")} className={`flex flex-col items-center justify-center p-4 rounded border transition-all ${source === "website" ? "bg-blue-600 border-blue-600 text-white" : "bg-black border-white/10 text-brand-silver hover:border-blue-600"}`}>
                            <FaGlobe className="mb-2 text-xl" />
                            <span className="text-xs font-bold">WEBSITE</span>
                        </button>
                    </div>

                    {source === "amazon" && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs text-[#FF9900] font-bold mb-1 block">Amazon Order ID</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 404-1234567-1234567" 
                                className="w-full bg-black border border-[#FF9900]/50 p-3 rounded text-white font-mono focus:border-[#FF9900] outline-none"
                                value={externalId}
                                onChange={(e) => setExternalId(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                
                {/* 2. ORDER TYPE SELECTION (NEW) */}
                {/* This hides the buttons if 'Amazon' is selected, because Amazon orders don't use RB-XX IDs */}
                {source !== 'amazon' && (
                    <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Order Type</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Button 1: Pre-Built */}
                            <button onClick={() => setOrderType("PB")} className={`flex flex-col items-center justify-center p-4 rounded border transition-all ${orderType === "PB" ? "bg-blue-500 border-blue-500 text-white" : "bg-black border-white/10 text-brand-silver hover:border-blue-500"}`}>
                                <FaDesktop className="mb-2 text-xl" />
                                <span className="text-xs font-bold">PRE-BUILT (PB)</span>
                            </button>
                            
                            {/* Button 2: Custom Rig */}
                            <button onClick={() => setOrderType("CB")} className={`flex flex-col items-center justify-center p-4 rounded border transition-all ${orderType === "CB" ? "bg-purple-500 border-purple-500 text-white" : "bg-black border-white/10 text-brand-silver hover:border-purple-500"}`}>
                                <FaGamepad className="mb-2 text-xl" />
                                <span className="text-xs font-bold">CUSTOM (CB)</span>
                            </button>
                            
                            {/* Button 3: Components/Parts */}
                            <button onClick={() => setOrderType("CS")} className={`flex flex-col items-center justify-center p-4 rounded border transition-all ${orderType === "CS" ? "bg-green-500 border-green-500 text-white" : "bg-black border-white/10 text-brand-silver hover:border-green-500"}`}>
                                <FaMicrochip className="mb-2 text-xl" />
                                <span className="text-xs font-bold">PARTS (CS)</span>
                            </button>
                        </div>
                        
                        {/* ID Preview Text */}
                        <p className="text-[10px] text-brand-silver mt-3 font-mono">
                            Preview ID: <span className="text-white font-bold">RB-{orderType}-{new Date().getFullYear().toString().slice(-2)}-XXX</span>
                        </p>
                    </div>
                )} 

                {/* Customer Details */}
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Customer Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 relative">
                            <FaUser className="absolute left-3 top-3.5 text-brand-silver/50 text-xs"/>
                            <input placeholder="Full Name" className="w-full bg-black border border-white/10 p-3 pl-8 rounded text-sm focus:border-brand-purple outline-none"
                                value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                        </div>
                        <div className="relative">
                            <FaEnvelope className="absolute left-3 top-3.5 text-brand-silver/50 text-xs"/>
                            <input placeholder="Email" className="w-full bg-black border border-white/10 p-3 pl-8 rounded text-sm focus:border-brand-purple outline-none"
                                value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                        </div>
                        <div className="relative">
                            <FaPhone className="absolute left-3 top-3.5 text-brand-silver/50 text-xs"/>
                            <input placeholder="Phone" className="w-full bg-black border border-white/10 p-3 pl-8 rounded text-sm focus:border-brand-purple outline-none"
                                value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                        </div>
                        <div className="col-span-2 relative">
                            <FaMapMarker className="absolute left-3 top-3.5 text-brand-silver/50 text-xs"/>
                            <input placeholder="Street Address" className="w-full bg-black border border-white/10 p-3 pl-8 rounded text-sm focus:border-brand-purple outline-none"
                                value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
                        </div>
                        <input placeholder="City" className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none"
                                value={customer.city} onChange={e => setCustomer({...customer, city: e.target.value})} />
                        <input placeholder="State" className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none"
                                value={customer.state} onChange={e => setCustomer({...customer, state: e.target.value})} />
                        <input placeholder="Pincode" className="bg-black border border-white/10 p-3 rounded text-sm focus:border-brand-purple outline-none"
                                value={customer.pincode} onChange={e => setCustomer({...customer, pincode: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* RIGHT: CART (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Search */}
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 relative">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Add Items</h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            className="w-full bg-black border border-white/10 p-3 pl-10 rounded text-sm focus:border-brand-purple outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver" />
                    </div>
                    {/* Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-[#202020] border border-white/10 shadow-xl z-20 rounded-b-xl overflow-hidden mt-1">
                            {searchResults.map(p => (
                                <div key={p.id} onClick={() => addToCart(p)} className="p-3 border-b border-white/5 hover:bg-brand-purple hover:text-white cursor-pointer flex justify-between items-center group">
                                    <span className="text-sm font-bold truncate w-3/4">{p.name}</span>
                                    <FaPlus className="text-xs opacity-50 group-hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 min-h-[300px] flex flex-col">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex justify-between">
                        <span>Order Items</span>
                        <span className="text-brand-purple">{cart.length}</span>
                    </h3>
                    
                    <div className="flex-grow space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                        {cart.length === 0 ? (
                            <div className="text-center text-brand-silver/30 text-xs py-10 italic">Cart is empty</div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.tempId} className="flex justify-between items-center bg-black/40 p-3 rounded border border-white/5">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <button onClick={() => removeFromCart(item.tempId)} className="text-red-500/50 hover:text-red-500 transition-colors shrink-0">
                                            <FaTrash size={12} />
                                        </button>
                                        <div className="truncate">
                                            <div className="text-sm font-bold text-white truncate">{item.name}</div>
                                            <div className="text-[10px] text-brand-silver uppercase">{item.brand} • {item.category}</div>
                                        </div>
                                    </div>
                                    <div className="font-orbitron font-bold text-sm shrink-0">₹{item.price.toLocaleString("en-IN")}</div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-white/10 mt-4 pt-4">
                        <div className="flex justify-between items-center text-xl font-bold font-orbitron">
                            <span>Total</span>
                            <span>₹{cart.reduce((a,b) => a + b.price, 0).toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={loading || cart.length === 0 || (source === 'amazon' && !externalId)}
                    className="w-full bg-brand-purple hover:bg-white hover:text-black text-white py-4 rounded-xl font-orbitron font-bold uppercase tracking-widest mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {loading ? "Processing..." : "Create Order & Entry"}
                </button>

            </div>
        </div>
      </div>
    </div>
  );
}