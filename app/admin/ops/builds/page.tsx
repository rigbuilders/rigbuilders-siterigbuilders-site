"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaTools, FaCheck, FaMicrochip, FaClipboardCheck, FaBoxOpen } from "react-icons/fa";

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
      .from('orders') // Correct Table
      .select(`*, procurement_items ( id, product_name, status, serial_number )`)
      // FIX 1: Added 'processing' so new orders appear immediately
      .in('status', ['processing', 'payment_received', 'procurement', 'assembly']) 
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setOrders(data || []);
    setLoading(false);
  };

  // --- BUILD ACTIONS ---
  // FIX 2: Changed all .from('orders_ops') to .from('orders')
  const startBuild = async (orderId: string) => {
    const buildId = `BLD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    await supabase.from('orders').update({ status: 'assembly', build_id: buildId }).eq('id', orderId);
    fetchReadyOrders();
  };

  const updateQC = async (orderId: string, currentQC: any, field: string) => {
    // Handle safe defaults if QC is null
    const safeQC = currentQC || { post: false, cable_mgmt: false, os: false, stress_test: false };
    const newQC = { ...safeQC, [field]: !safeQC[field] };
    await supabase.from('orders').update({ build_qc_status: newQC }).eq('id', orderId);
    fetchReadyOrders();
  };

  const finishBuild = async (orderId: string) => {
    if (!confirm("Confirm Build Complete?")) return;
    await supabase.from('orders').update({ status: 'ready_to_ship' }).eq('id', orderId);
    alert("Build Complete! Ready for Docs.");
    fetchReadyOrders();
  };

  // --- COMPONENT ACTIONS ---
  const packAndShip = async (orderId: string) => {
     if (!confirm("Confirm items are packed and ready?")) return;
     await supabase.from('orders').update({ status: 'ready_to_ship' }).eq('id', orderId);
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
                // Check if parts are received
                const allPartsReceived = order.procurement_items?.every((i: any) => i.status === 'received') || false;
                const isAssemblyStarted = order.status === 'assembly';

                // FIX 3: DELETED the "if (!allPartsReceived) return null" line.
                // Now the order shows up even if parts are pending.

                const isBuild = order.type === 'build'; 
                const qcStatus = order.build_qc_status || { post: false, cable_mgmt: false, os: false, stress_test: false };

                return (
                    <div key={order.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-6 relative overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-orbitron font-bold text-xl text-white">{order.display_id}</span>
                                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${isBuild ? "bg-brand-purple text-white" : "bg-blue-500 text-white"}`}>
                                        {isBuild ? "Full Build" : "Components"}
                                    </span>
                                    {order.build_id && <span className="text-xs text-brand-purple border border-brand-purple px-1 rounded">{order.build_id}</span>}
                                </div>
                                <div className="text-brand-silver text-xs">Customer: {order.full_name || "Guest"}</div>
                            </div>
                            
                            {/* Status Indicator for Pending Parts */}
                            <div className="text-right">
                                {!allPartsReceived && !isAssemblyStarted && (
                                    <span className="text-[10px] text-yellow-500 font-bold border border-yellow-500/30 px-2 py-1 rounded animate-pulse">
                                        WAITING FOR PARTS
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT: PARTS LIST */}
                            <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                <h3 className="text-xs font-bold text-brand-silver uppercase mb-3 flex items-center gap-2"><FaMicrochip /> Items to Pack</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {order.procurement_items && order.procurement_items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                            <span className="text-white">{item.product_name}</span>
                                            <span className={`text-[10px] font-mono px-1 rounded ${item.status === 'received' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                                {item.status === 'received' ? item.serial_number : 'PENDING'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: ACTION CENTER */}
                            <div className="flex flex-col justify-center">
                                
                                {isBuild ? (
                                    <>
                                        {!isAssemblyStarted ? (
                                            <button 
                                                onClick={() => startBuild(order.id)} 
                                                // Optional: Disable button if parts aren't here yet
                                                disabled={!allPartsReceived}
                                                className="w-full py-4 bg-brand-purple hover:bg-white hover:text-black text-white font-orbitron font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {allPartsReceived ? "Start Assembly & Generate ID" : "Waiting for Procurement"}
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-brand-silver uppercase mb-2 flex items-center gap-2"><FaClipboardCheck /> QC Checklist</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['post', 'cable_mgmt', 'os', 'stress_test'].map((check) => (
                                                        <label key={check} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${qcStatus[check] ? "bg-green-500/20 border-green-500 text-green-400" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                                                            <input type="checkbox" className="hidden" checked={qcStatus[check]} onChange={() => updateQC(order.id, qcStatus, check)} />
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${qcStatus[check] ? "bg-green-500 border-green-500 text-black" : "border-white/30"}`}>{qcStatus[check] && <FaCheck size={10} />}</div>
                                                            <span className="text-xs font-bold uppercase">{check.replace('_', ' ')}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <button onClick={() => finishBuild(order.id)} disabled={!Object.values(qcStatus).every(Boolean)} className="w-full py-3 mt-4 bg-green-500 hover:bg-white hover:text-black text-black font-orbitron font-bold uppercase rounded disabled:opacity-20">Finish Build</button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
                                        <FaBoxOpen className="mx-auto text-3xl text-blue-400 mb-2" />
                                        <h3 className="text-blue-400 font-bold uppercase mb-4">Direct Packing</h3>
                                        <p className="text-xs text-brand-silver mb-6">Verify serial numbers match the items in the box before sealing.</p>
                                        <button 
                                            onClick={() => packAndShip(order.id)} 
                                            disabled={!allPartsReceived}
                                            className="w-full py-3 bg-blue-500 hover:bg-white hover:text-black text-white font-orbitron font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50"
                                        >
                                             {allPartsReceived ? "Confirm Packed & Ready" : "Waiting for Parts"}
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