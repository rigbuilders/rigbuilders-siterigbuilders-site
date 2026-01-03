"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaRupeeSign, FaChartLine, FaFileExcel, FaArrowDown, FaArrowUp } from "react-icons/fa";

export default function FinancePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, cost: 0, profit: 0, margin: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    // 1. FIX: Fetch from 'orders' table instead of 'orders_ops'
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        procurement_items ( cost_price, product_name )
      `)
      .neq('status', 'cancelled') // Exclude cancelled
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data: any[]) => {
    let totalRev = 0;
    let totalCost = 0;

    data.forEach(order => {
        // Revenue
        totalRev += Number(order.total_amount) || 0;
        
        // Cost (Sum of all items in that order from Procurement Phase)
        const orderCost = order.procurement_items?.reduce((sum: number, item: any) => sum + (Number(item.cost_price) || 0), 0) || 0;
        totalCost += orderCost;
    });

    const totalProfit = totalRev - totalCost;
    const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

    setStats({
        revenue: totalRev,
        cost: totalCost,
        profit: totalProfit,
        margin: margin
    });
  };

  // --- CA EXPORT FUNCTION ---
  const downloadReport = () => {
    // 1. Create CSV Header (Tally/Busy Compatible Format)
    const headers = [
        "Invoice Date",
        "Invoice No",
        "Order ID",
        "Customer Name",
        "Place of Supply (State)",
        "Taxable Value (Sale)",
        "IGST Charged",
        "CGST Charged",
        "SGST Charged",
        "Total Invoice Amount",
        "Total Purchase Cost (Incl. Tax)",
        "Est. Input GST (Paid)",
        "Gross Profit",
        "Payment Mode",
        "Source"
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

    // 2. Add Rows
    orders.forEach(order => {
        // A. Basic Data
        const date = new Date(order.created_at).toLocaleDateString("en-IN");
        const invNo = order.invoice_no || "PENDING";
        const orderId = order.display_id || "N/A";
        const customer = (order.full_name || "Guest").replace(/,/g, " "); // Remove commas for CSV safety
        
        // B. State Logic (Detect Punjab for SGST/CGST)
        // Checks the JSON state field OR looks for 'Punjab' in the address text
        const stateRaw = order.shipping_address?.state || order.address || "";
        const isPunjab = stateRaw.toLowerCase().includes("punjab");
        const placeOfSupply = isPunjab ? "Punjab" : "Inter-State";

        // C. Sales Tax Calculations (Output GST)
        const totalSale = Number(order.total_amount) || 0;
        const taxableSale = totalSale / 1.18;
        const totalTaxCharged = totalSale - taxableSale;

        let igst = 0, cgst = 0, sgst = 0;
        if (isPunjab) {
            cgst = totalTaxCharged / 2;
            sgst = totalTaxCharged / 2;
        } else {
            igst = totalTaxCharged;
        }

        // D. Purchase Tax Calculations (Input GST - Est. 18% of Cost)
        // Note: This assumes your parts are bought at 18% GST.
        const totalCost = order.procurement_items?.reduce((sum: number, item: any) => sum + (Number(item.cost_price) || 0), 0) || 0;
        const taxableCost = totalCost / 1.18;
        const inputGstPaid = totalCost - taxableCost;
        
        // E. Profit
        const profit = totalSale - totalCost;

        // F. Create Row String
        const row = [
            date,
            invNo,
            orderId,
            customer,
            placeOfSupply,
            taxableSale.toFixed(2),
            igst.toFixed(2),
            cgst.toFixed(2),
            sgst.toFixed(2),
            totalSale.toFixed(2),
            totalCost.toFixed(2),
            inputGstPaid.toFixed(2),
            profit.toFixed(2),
            order.payment_mode,
            order.source
        ].join(",");

        csvContent += row + "\n";
    });

    // 3. Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RigBuilders_Sales_Register_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Calculating Profits...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="font-orbitron text-3xl font-bold text-brand-purple">FINANCIAL OVERVIEW</h1>
                <p className="text-brand-silver text-sm">Real-time unit economics based on procurement data.</p>
            </div>
            <button 
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded font-bold uppercase flex items-center gap-2 transition-all"
            >
                <FaFileExcel /> Export for CA
            </button>
        </div>

        {/* --- STAT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                <div className="text-brand-silver text-xs font-bold uppercase mb-1">Total Revenue</div>
                <div className="text-2xl font-orbitron font-bold text-white">₹{stats.revenue.toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                <div className="text-brand-silver text-xs font-bold uppercase mb-1">Total Expenses (COGS)</div>
                <div className="text-2xl font-orbitron font-bold text-red-400">₹{stats.cost.toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-[#1A1A1A] p-6 rounded-xl border border-brand-purple/30 bg-brand-purple/5">
                <div className="text-brand-purple text-xs font-bold uppercase mb-1">Net Profit</div>
                <div className="text-2xl font-orbitron font-bold text-green-400">₹{stats.profit.toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                <div className="text-brand-silver text-xs font-bold uppercase mb-1">Profit Margin</div>
                <div className="text-2xl font-orbitron font-bold text-blue-400">{stats.margin.toFixed(1)}%</div>
            </div>
        </div>

        {/* --- ORDER LEDGER --- */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2"><FaChartLine /> Order Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-brand-silver uppercase text-xs">
                        <tr>
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Source</th>
                            <th className="p-4 text-right">Sale Price</th>
                            <th className="p-4 text-right">Cost Price</th>
                            <th className="p-4 text-right">Profit</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {orders.map(order => {
                            const cost = order.procurement_items?.reduce((sum: number, item: any) => sum + (Number(item.cost_price) || 0), 0) || 0;
                            const profit = (Number(order.total_amount) || 0) - cost;
                            const isProfitable = profit >= 0;

                            return (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                    {/* FIX: Use 'display_id' */}
                                    <td className="p-4 font-bold">{order.display_id}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] uppercase px-2 py-1 rounded font-bold ${order.source === 'amazon' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                            {order.source}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono">₹{order.total_amount?.toLocaleString("en-IN")}</td>
                                    <td className="p-4 text-right font-mono text-brand-silver">₹{cost.toLocaleString("en-IN")}</td>
                                    <td className={`p-4 text-right font-mono font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                                        {isProfitable ? '+' : ''}₹{profit.toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-[10px] uppercase text-brand-silver bg-white/5 px-2 py-1 rounded">
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}