"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaTools, FaCheck, FaMicrochip, FaClipboardCheck, FaBox, FaBoxOpen } from "react-icons/fa";

export default function BuildStationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const fetchReadyOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/");

    const { data, error } = await supabase
      .from('orders_ops')
      .select(`*, procurement_items ( id, product_name, status, serial_number )`)
      // FIX: Added 'payment_received' to this list so it catches your new orders
      .in('status', ['payment_received', 'procurement', 'assembly']) 
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setOrders(data || []);
    setLoading(false);
  };

  // --- BUILD ACTIONS ---
  const startBuild = async (orderId: string) => {
    const buildId = `BLD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    await supabase.from('orders_ops').update({ status: 'assembly', build_id: buildId }).eq('id', orderId);
    fetchReadyOrders();
  };

  const updateQC = async (orderId: string, currentQC: any, field: string) => {
    const newQC = { ...currentQC, [field]: !currentQC[field] };
    await supabase.from('orders_ops').update({ build_qc_status: newQC }).eq('id', orderId);
    fetchReadyOrders();
  };

  const finishBuild = async (orderId: string) => {
    if (!confirm("Confirm Build Complete?")) return;
    await supabase.from('orders_ops').update({ status: 'ready_to_ship' }).eq('id', orderId);
    alert("Build Complete! Ready for Docs.");
    fetchReadyOrders();
  };

  // --- COMPONENT ACTIONS ---
  const packAndShip = async (orderId: string) => {
     if (!confirm("Confirm items are packed and ready?")) return;
     // For components, we skip 'assembly' and go straight to 'ready_to_ship'
     await supabase.from('orders_ops').update({ status: 'ready_to_ship' }).eq('id', orderId);
     alert("Order Packed! Ready for Docs.");
     fetchReadyOrders();
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading Station...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
            <FaTools className="text-3xl text-brand-purple" />
            <div>
                <h1 className="font-orbitron text-3xl font-bold text-white">FULFILLMENT STATION</h1>
                <p className="text-brand-silver text-sm">Assembly (Builds) & Packing (Components)</p>
            </div>
        </div>

        <div className="space-y-8">
            {orders.map(order => {
                const allPartsReceived = order.procurement_items.every((i: any) => i.status === 'received');
                const isAssemblyStarted = order.status === 'assembly';

                // If parts missing, don't show yet (or show as blocked)
                if (!allPartsReceived && !isAssemblyStarted) return null;

                const isBuild = order.type === 'build'; // Check Type

                return (
                    <div key={order.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-6 relative overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-orbitron font-bold text-xl text-white">{order.order_display_id}</span>
                                    {/* TYPE BADGE */}
                                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${isBuild ? "bg-brand-purple text-white" : "bg-blue-500 text-white"}`}>
                                        {isBuild ? "Full Build" : "Components"}
                                    </span>
                                    {order.build_id && <span className="text-xs text-brand-purple border border-brand-purple px-1 rounded">{order.build_id}</span>}
                                </div>
                                <div className="text-brand-silver text-xs">Customer: {order.guest_info?.name || "Registered User"}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT: PARTS LIST (Same for both) */}
                            <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                <h3 className="text-xs font-bold text-brand-silver uppercase mb-3 flex items-center gap-2"><FaMicrochip /> Items to Pack</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {order.procurement_items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                            <span className="text-white">{item.product_name}</span>
                                            <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-1 rounded">{item.serial_number}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: ACTION CENTER (Dynamic based on Type) */}
                            <div className="flex flex-col justify-center">
                                
                                {/* SCENARIO A: IT IS A FULL PC BUILD */}
                                {isBuild ? (
                                    <>
                                        {!isAssemblyStarted ? (
                                            <button onClick={() => startBuild(order.id)} className="w-full py-4 bg-brand-purple hover:bg-white hover:text-black text-white font-orbitron font-bold uppercase tracking-widest rounded transition-all">
                                                Start Assembly & Generate ID
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-brand-silver uppercase mb-2 flex items-center gap-2"><FaClipboardCheck /> QC Checklist</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['post', 'cable_mgmt', 'os', 'stress_test'].map((check) => (
                                                        <label key={check} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${order.build_qc_status[check] ? "bg-green-500/20 border-green-500 text-green-400" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                                                            <input type="checkbox" className="hidden" checked={order.build_qc_status[check]} onChange={() => updateQC(order.id, order.build_qc_status, check)} />
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${order.build_qc_status[check] ? "bg-green-500 border-green-500 text-black" : "border-white/30"}`}>{order.build_qc_status[check] && <FaCheck size={10} />}</div>
                                                            <span className="text-xs font-bold uppercase">{check.replace('_', ' ')}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <button onClick={() => finishBuild(order.id)} disabled={!Object.values(order.build_qc_status).every(Boolean)} className="w-full py-3 mt-4 bg-green-500 hover:bg-white hover:text-black text-black font-orbitron font-bold uppercase rounded disabled:opacity-20">Finish Build</button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                // SCENARIO B: IT IS COMPONENT ONLY
                                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
                                        <FaBoxOpen className="mx-auto text-3xl text-blue-400 mb-2" />
                                        <h3 className="text-blue-400 font-bold uppercase mb-4">Direct Packing</h3>
                                        <p className="text-xs text-brand-silver mb-6">Verify serial numbers match the items in the box before sealing.</p>
                                        <button onClick={() => packAndShip(order.id)} className="w-full py-3 bg-blue-500 hover:bg-white hover:text-black text-white font-orbitron font-bold uppercase tracking-widest rounded transition-all">
                                            Confirm Packed & Ready
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {orders.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl text-brand-silver">
                    No orders ready for fulfillment.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}