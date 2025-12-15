"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaBoxOpen, FaTruck, FaCheckCircle, FaBarcode, FaMoneyBillWave, FaSave } from "react-icons/fa";

export default function ProcurementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  // State for Inputs
  const [distributorInput, setDistributorInput] = useState<{ [key: string]: string }>({});
  const [costInput, setCostInput] = useState<{ [key: string]: string }>({});
  const [serialInput, setSerialInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/");

    const { data, error } = await supabase
      .from('procurement_items')
      .select(`
        *,
        orders_ops ( order_display_id, source )
      `)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  // --- ACTIONS ---

  const markOrdered = async (itemId: string) => {
    const dist = distributorInput[itemId];
    const cost = costInput[itemId];

    if (!dist || !cost) return alert("Please enter Distributor Name and Cost Price first.");

    const { error } = await supabase
      .from('procurement_items')
      .update({ 
        status: 'ordered',
        distributor_name: dist,
        cost_price: parseFloat(cost)
      })
      .eq('id', itemId);

    if (error) alert("Error updating: " + error.message);
    else fetchItems();
  };

  const markReceived = async (itemId: string) => {
    const serial = serialInput[itemId];
    if (!serial) return alert("Serial Number is MANDATORY for warranty tracking.");

    const { error } = await supabase
      .from('procurement_items')
      .update({ 
        status: 'received',
        serial_number: serial
      })
      .eq('id', itemId);

    if (error) alert("Error updating: " + error.message);
    else fetchItems();
  };

  // --- UI HELPERS ---

  const getStatusColor = (status: string) => {
    if (status === 'pending') return 'bg-red-500/20 text-red-500 border-red-500/50';
    if (status === 'ordered') return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
    if (status === 'received') return 'bg-green-500/20 text-green-500 border-green-500/50';
    return 'bg-gray-500/20 text-gray-400';
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading Operations...</div>;

  const pendingItems = items.filter(i => i.status === 'pending');
  const orderedItems = items.filter(i => i.status === 'ordered');
  const receivedItems = items.filter(i => i.status === 'received');

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-4 max-w-7xl mx-auto">
        
        <h1 className="font-orbitron text-3xl font-bold text-brand-purple mb-2">PROCUREMENT BOARD</h1>
        <p className="text-brand-silver mb-8">Manage supply chain for active orders.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* COLUMN 1: TO BUY (Pending) */}
          <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-4 flex flex-col h-[75vh]">
            <div className="flex items-center gap-2 mb-4 text-red-400 border-b border-white/10 pb-2">
                <FaBoxOpen /> <h2 className="font-bold uppercase tracking-wider">To Buy ({pendingItems.length})</h2>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {pendingItems.map(item => (
                    <div key={item.id} className="bg-black/40 p-3 rounded border border-white/10 hover:border-red-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-brand-silver bg-white/5 px-2 py-1 rounded">{item.orders_ops?.order_display_id}</span>
                            <span className="text-[10px] uppercase text-brand-purple font-bold">{item.category}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-3">{item.product_name}</h3>
                        
                        {/* INPUTS FOR ORDERING */}
                        <div className="space-y-2">
                            <input 
                                placeholder="Distributor Name" 
                                className="w-full bg-[#121212] border border-white/10 rounded p-2 text-xs"
                                onChange={e => setDistributorInput({...distributorInput, [item.id]: e.target.value})}
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="number"
                                    placeholder="Cost Price (₹)" 
                                    className="w-full bg-[#121212] border border-white/10 rounded p-2 text-xs"
                                    onChange={e => setCostInput({...costInput, [item.id]: e.target.value})}
                                />
                                <button 
                                    onClick={() => markOrdered(item.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded text-xs font-bold w-20 flex items-center justify-center gap-1"
                                >
                                    <FaMoneyBillWave /> Buy
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {pendingItems.length === 0 && <div className="text-center text-brand-silver/30 text-xs mt-10">Nothing to buy. Good job!</div>}
            </div>
          </div>

          {/* COLUMN 2: ORDERED (On the Way) */}
          <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-4 flex flex-col h-[75vh]">
            <div className="flex items-center gap-2 mb-4 text-yellow-400 border-b border-white/10 pb-2">
                <FaTruck /> <h2 className="font-bold uppercase tracking-wider">In Transit ({orderedItems.length})</h2>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {orderedItems.map(item => (
                    <div key={item.id} className="bg-black/40 p-3 rounded border border-white/10 hover:border-yellow-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-brand-silver bg-white/5 px-2 py-1 rounded">{item.orders_ops?.order_display_id}</span>
                            <span className="text-[10px] text-brand-silver">from <span className="text-white font-bold">{item.distributor_name}</span></span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-3">{item.product_name}</h3>
                        
                        {/* INPUTS FOR RECEIVING */}
                        <div className="space-y-2">
                             <div className="relative">
                                <FaBarcode className="absolute left-3 top-2.5 text-brand-silver text-xs" />
                                <input 
                                    placeholder="Scan Serial Number" 
                                    className="w-full bg-[#121212] border border-brand-purple/50 rounded p-2 pl-8 text-xs focus:bg-brand-purple/10 transition-colors"
                                    onChange={e => setSerialInput({...serialInput, [item.id]: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={() => markReceived(item.id)}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black p-2 rounded text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <FaCheckCircle /> Mark Received
                            </button>
                        </div>
                    </div>
                ))}
                 {orderedItems.length === 0 && <div className="text-center text-brand-silver/30 text-xs mt-10">No parcels expected.</div>}
            </div>
          </div>

          {/* COLUMN 3: RECEIVED (Ready for Build) */}
          <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-4 flex flex-col h-[75vh]">
             <div className="flex items-center gap-2 mb-4 text-green-400 border-b border-white/10 pb-2">
                <FaCheckCircle /> <h2 className="font-bold uppercase tracking-wider">Received ({receivedItems.length})</h2>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                 {receivedItems.map(item => (
                    <div key={item.id} className="bg-black/40 p-3 rounded border border-green-500/20 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start mb-1">
                             <span className="text-xs font-bold text-brand-silver bg-white/5 px-2 py-1 rounded">{item.orders_ops?.order_display_id}</span>
                             <FaCheckCircle className="text-green-500" />
                        </div>
                        <h3 className="text-sm font-bold text-white">{item.product_name}</h3>
                        <div className="mt-2 text-[10px] text-brand-silver font-mono bg-[#121212] p-1 rounded border border-white/5">
                            SN: {item.serial_number}
                        </div>
                        <div className="mt-1 text-[10px] text-brand-silver">
                            Dist: {item.distributor_name}
                        </div>
                    </div>
                ))}
                {receivedItems.length === 0 && <div className="text-center text-brand-silver/30 text-xs mt-10">No items in stock.</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}