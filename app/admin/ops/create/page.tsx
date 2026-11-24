"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaSearch, FaPlus, FaTrash, FaAmazon, FaStore, FaGlobe, FaUser, FaPhone, FaMapMarker, FaEnvelope, FaDesktop, FaGamepad, FaMicrochip, FaPen } from "react-icons/fa";
import { toast } from "sonner";
import { generateOrderId, generateActivationId, generateActivationBillingId } from "@/lib/id-generator";

const CATS = ["cpu","gpu","motherboard","ram","storage","psu","cabinet","cooler","monitor","keyboard","mouse","combo","mousepad","usb","prebuilt"];
const pretty = (s: string) => String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const inr = (n: any) => Number(n || 0).toLocaleString("en-IN");

// Exact replica of the DB's compute_selling_price(); includeFloor=false is the
// "percent only" variant (floor forced to 0). Both keep the 49/99 rounding.
type Rules = Record<string, { pct: number | null; floor: number }>;
function computeSp(cost: any, category: string, includeFloor: boolean, rules: Rules, defaultPct: number): number {
  const c = Number(cost) || 0;
  if (c <= 0) return 0;
  const rule = rules[category];
  const pct = rule && rule.pct != null ? rule.pct : defaultPct;
  const floor = includeFloor ? (rule ? rule.floor : 0) : 0;
  const raw = c + Math.max(pct * c, floor);
  const base = Math.floor(raw / 100) * 100;
  if (base + 49 >= raw) return base + 49;
  if (base + 99 >= raw) return base + 99;
  return base + 149;
}

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

  // Pricing engine (mirrors the Quotation Builder) — used both for new parts we
  // save to the catalogue and for recomputing the SP when a cost is edited.
  const [rules, setRules] = useState<Rules>({});
  const [defaultPct, setDefaultPct] = useState(0.05);
  const [includeFloor, setIncludeFloor] = useState(false); // false = percent only

  // "Add item" form. save=false → billed once, never saved to products.
  // save=true → inserted into products as a draft (nickname + distributor_price
  // + category), priced by computeSp; useCalc=false lets you bill a manual SP.
  const [newItem, setNewItem] = useState<any>({ name: "", save: false, category: "cpu", cost: "", useCalc: true, price: "", busy: false });

  const sp = (cost: any, cat: string) => computeSp(cost, cat, includeFloor, rules, defaultPct);
  const authToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;

  // Auth Check + pricing config
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setIsAdmin(true);
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch("/api/admin/pricing-config", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) {
          const json = await res.json();
          setRules(json.rules || {});
          if (json.defaultPct != null) setDefaultPct(Number(json.defaultPct));
        }
      } catch { /* pricing config is best-effort */ }
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

  // Add an item from the "Add item" form.
  //  • save=false → one-time line: billed once, NOT written to products.
  //  • save=true  → insert a draft product (nickname + distributor_price +
  //    category) via /api/admin/quick-product, priced by computeSp. useCalc
  //    bills the calculated SP; otherwise a manual one-time SP is billed while
  //    the real catalogue price is still derived by the DB from the cost.
  const addItem = async () => {
    const name = newItem.name.trim();
    if (!name) { toast.error("Enter an item name"); return; }

    if (!newItem.save) {
      const price = Number(newItem.price);
      if (!Number.isFinite(price) || price < 0) { toast.error("Enter a valid price"); return; }
      setCart([...cart, { tempId: Math.random(), name, price, brand: "Custom", category: "custom", custom: true, image_url: null }]);
      setNewItem({ name: "", save: false, category: "cpu", cost: "", useCalc: true, price: "", busy: false });
      return;
    }

    const cost = Number(newItem.cost);
    if (!Number.isFinite(cost) || cost <= 0) { toast.error("Enter a valid distributor price (cost)"); return; }
    const billPrice = newItem.useCalc ? sp(cost, newItem.category) : Number(newItem.price);
    if (!newItem.useCalc && !(Number(newItem.price) > 0)) { toast.error("Enter the one-time selling price"); return; }

    setNewItem((n: any) => ({ ...n, busy: true }));
    try {
      const token = await authToken();
      const res = await fetch("/api/admin/quick-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ nickname: name, category: newItem.category, distributor_price: cost }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add product");
      setCart([...cart, {
        tempId: Math.random(), id: json.product?.id, name,
        price: billPrice, distributor_price: cost, brand: "", category: newItem.category,
        draft: true, image_url: null,
      }]);
      setNewItem({ name: "", save: false, category: "cpu", cost: "", useCalc: true, price: "", busy: false });
      toast.success("Part added to catalogue & order");
    } catch (e: any) {
      toast.error("Could not add part", { description: e.message });
      setNewItem((n: any) => ({ ...n, busy: false }));
    }
  };

  // Edit a cart product's distributor price → recompute its SP (current mode) +
  // persist the cost to the catalogue (the DB trigger re-derives the real price).
  // A one-time SP override (it.oneTimeSp) is left untouched — the operator set
  // that price deliberately for this order only.
  const updateCartCost = (tempId: number, value: string) => {
    const cost = Number(value) || 0;
    setCart((c) => c.map((it) => it.tempId === tempId ? { ...it, distributor_price: cost, price: (it.custom || it.oneTimeSp) ? it.price : sp(cost, it.category) } : it));
  };

  // Override the selling price for THIS order only — nothing is written to the
  // catalogue (the listed product's real price is unchanged).
  const setOneTimeSp = (tempId: number, value: string) => {
    setCart((c) => c.map((it) => it.tempId === tempId ? { ...it, price: Number(value) || 0, oneTimeSp: true } : it));
  };
  // Drop the override and go back to the calculated SP from the cost.
  const clearOneTimeSp = (tempId: number) => {
    setCart((c) => c.map((it) => it.tempId === tempId ? { ...it, oneTimeSp: false, price: it.custom ? it.price : sp(it.distributor_price, it.category) } : it));
  };
  const persistCartCost = async (item: any) => {
    if (!item.id || !(Number(item.distributor_price) > 0)) return;
    try {
      const token = await authToken();
      const res = await fetch("/api/admin/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: item.id, distributor_price: Number(item.distributor_price) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Cost updated in catalogue");
    } catch (e: any) {
      toast.error("Could not save cost", { description: e.message });
    }
  };

  // Rename a cart product. Drafts → nickname (+ name); listed → breadcrumb_name
  // (the configurator name is mirrored by a DB trigger). The on-screen label is
  // updated to match, whichever field we wrote.
  const renameCartItem = async (item: any) => {
    if (!item.id) return;
    const hasBread = !!item.breadcrumb_name;
    const next = window.prompt(hasBread ? "Catalogue name (shown on the website):" : "Nickname (internal):", item.name);
    if (next == null) return;
    const nm = next.trim();
    if (!nm || nm === item.name) return;
    const patch: any = { id: item.id };
    if (hasBread) { patch.breadcrumb_name = nm; } else { patch.nickname = nm; patch.name = nm; }
    try {
      const token = await authToken();
      const res = await fetch("/api/admin/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setCart((c) => c.map((it) => it.tempId === item.tempId ? { ...it, name: nm, breadcrumb_name: hasBread ? nm : it.breadcrumb_name, nickname: hasBread ? it.nickname : nm } : it));
      toast.success("Name updated");
    } catch (e: any) {
      toast.error("Could not rename", { description: e.message });
    }
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

  // Customer details required before an order can be created (prevents the
  // "guest / unknown" orders that happen when the form is submitted blank).
  const missingCustomer = (
    !customer.name.trim() ? "Name" :
    !customer.phone.trim() ? "Phone" :
    !customer.address.trim() ? "Street Address" :
    !customer.city.trim() ? "City" :
    !customer.state.trim() ? "State" :
    !customer.pincode.trim() ? "Pincode" : ""
  );

  const handleSubmit = async () => {
    // Gate: force the operator to fill customer details first.
    if (missingCustomer) {
      toast.error("Fill customer details first", { description: `${missingCustomer} is required.` });
      return;
    }
    if (cart.length === 0) { toast.error("Add at least one item to the order."); return; }

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

        // 2.5 Record Aegis activation (machine orders only: prebuilt / custom).
        if (orderType !== 'CS') {
            const activationId = generateActivationId();
            const activationBillingId = await generateActivationBillingId(supabase);
            const { error: actErr } = await supabase.from('activations').insert({
                activation_id: activationId,
                activation_billing_id: activationBillingId,
                customer_name: customer.name,
                order_id: newOrder.id,
                build_type: orderType === 'PB' ? 'prebuilt' : 'custom',
                source: 'ops',
            });
            if (actErr) {
                console.error("Activation Error:", actErr);
                toast.warning("Order created, but failed to record the activation key.");
            } else {
                toast.success(`Activation ID: ${activationId}`, { description: "Copy this for the customer / warranty card.", duration: 15000 });
            }
        }

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

                    {/* Add item — one-time line, or save a new part to the catalogue */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] uppercase tracking-wider text-brand-silver">Add item</p>
                            <label className="flex items-center gap-1.5 text-[10px] text-brand-silver cursor-pointer" title="Add the base-margin floor on top of the percentage (matches the live catalogue price). Off = percentage only.">
                                <input type="checkbox" checked={includeFloor} onChange={(e) => setIncludeFloor(e.target.checked)} className="accent-brand-purple" />
                                Apply base margin
                            </label>
                        </div>

                        <input
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder={newItem.save ? "Nickname (e.g. RTX 4060 Ventus)" : "Item name (e.g. Service charge)"}
                            className="w-full bg-black border border-white/10 p-2.5 rounded text-sm focus:border-brand-purple outline-none mb-2"
                        />

                        <label className="flex items-center gap-2 text-xs text-brand-silver mb-2 cursor-pointer">
                            <input type="checkbox" checked={newItem.save} onChange={(e) => setNewItem({ ...newItem, save: e.target.checked })} className="accent-brand-purple" />
                            Save to catalogue (nickname + distributor price)
                        </label>

                        {!newItem.save ? (
                            <div className="flex gap-2">
                                <input
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    type="number" min="0" placeholder="Selling price ₹"
                                    className="flex-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-brand-purple outline-none"
                                />
                                <button type="button" onClick={addItem} className="px-4 bg-brand-purple hover:bg-white hover:text-black rounded text-sm font-bold transition-colors">Add</button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <select
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="flex-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-brand-purple outline-none"
                                    >
                                        {CATS.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                                    </select>
                                    <input
                                        value={newItem.cost}
                                        onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                                        type="number" min="0" placeholder="Distributor ₹"
                                        className="w-28 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-brand-purple outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-brand-silver">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" checked={newItem.useCalc} onChange={() => setNewItem({ ...newItem, useCalc: true })} className="accent-brand-purple" />
                                        Calculated SP {Number(newItem.cost) > 0 && <span className="text-white font-bold">₹{sp(newItem.cost, newItem.category).toLocaleString("en-IN")}</span>}
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" checked={!newItem.useCalc} onChange={() => setNewItem({ ...newItem, useCalc: false })} className="accent-brand-purple" />
                                        One-time SP
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    {!newItem.useCalc && (
                                        <input
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                            type="number" min="0" placeholder="Bill this price ₹"
                                            className="flex-1 bg-black border border-white/10 p-2.5 rounded text-sm focus:border-brand-purple outline-none"
                                        />
                                    )}
                                    <button type="button" disabled={newItem.busy} onClick={addItem} className="px-4 ml-auto bg-brand-purple hover:bg-white hover:text-black rounded text-sm font-bold transition-colors disabled:opacity-50">
                                        {newItem.busy ? "Saving…" : "Save & Add"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
                                <div key={item.tempId} className="bg-black/40 p-3 rounded border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <button onClick={() => removeFromCart(item.tempId)} className="text-red-500/50 hover:text-red-500 transition-colors shrink-0">
                                                <FaTrash size={12} />
                                            </button>
                                            <div className="truncate">
                                                <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                                                    {item.name}
                                                    {item.id && (
                                                        <button onClick={() => renameCartItem(item)} title="Rename (nickname / catalogue name)" className="text-brand-silver/50 hover:text-brand-purple shrink-0">
                                                            <FaPen size={9} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-brand-silver uppercase">{item.brand || (item.draft ? "Draft" : "")} • {item.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-saira font-bold text-sm">₹{Number(item.price).toLocaleString("en-IN")}</div>
                                            {item.oneTimeSp && <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">one-time price</div>}
                                        </div>
                                    </div>
                                    {item.id && !item.custom && (
                                        <div className="mt-2 pl-7 space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-brand-silver uppercase w-20">Distributor ₹</span>
                                                <input
                                                    type="number" min="0"
                                                    value={item.distributor_price ?? ""}
                                                    onChange={(e) => updateCartCost(item.tempId, e.target.value)}
                                                    onBlur={() => persistCartCost(item)}
                                                    className="w-24 bg-black border border-white/10 px-2 py-1 rounded text-xs focus:border-brand-purple outline-none"
                                                />
                                                <span className="text-[10px] text-brand-silver/60">{item.oneTimeSp ? "saved to catalogue" : "→ SP recalculated"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-brand-silver uppercase w-20">One-time SP ₹</span>
                                                <input
                                                    type="number" min="0"
                                                    value={item.oneTimeSp ? (item.price ?? "") : ""}
                                                    onChange={(e) => setOneTimeSp(item.tempId, e.target.value)}
                                                    placeholder={`calc ${inr(sp(item.distributor_price, item.category))}`}
                                                    className="w-24 bg-black border border-white/10 px-2 py-1 rounded text-xs focus:border-amber-400 outline-none"
                                                />
                                                {item.oneTimeSp
                                                    ? <button onClick={() => clearOneTimeSp(item.tempId)} className="text-[10px] text-amber-400 hover:underline">reset to calculated</button>
                                                    : <span className="text-[10px] text-brand-silver/60">overrides this order only</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-white/10 mt-4 pt-4">
                        <div className="flex justify-between items-center text-xl font-bold font-orbitron">
                            <span>Total</span>
                            <span className="font-saira">₹{cart.reduce((a,b) => a + b.price, 0).toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={loading || cart.length === 0 || !!missingCustomer || (source === 'amazon' && !externalId)}
                    className="w-full bg-brand-purple hover:bg-white hover:text-black text-white py-4 rounded-xl font-orbitron font-bold uppercase tracking-widest mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {loading ? "Processing..." : missingCustomer ? `Fill ${missingCustomer} First` : "Create Order & Entry"}
                </button>

            </div>
        </div>
      </div>
    </div>
  );
}