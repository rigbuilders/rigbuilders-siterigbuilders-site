import Link from "next/link";
import { FaFileInvoice, FaArrowRight } from "react-icons/fa";

export default function DashboardOrders({ orders }: { orders: any[] }) {
  // Only show the 2 most recent orders to match the design
  const displayOrders = orders.slice(0, 2);

  return (
    <div className="border border-[#4E2C8B] rounded-[32px] p-6 mb-6 bg-[#050505]">
       
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
          <h2 className="font-saira text-2xl text-white">Your <span className="text-[#B084FF] font-saira-medium">Orders</span></h2>
          <Link href="/m/orders" className="flex items-center gap-2 border border-[#4E2C8B] rounded-full px-3 py-1 text-[10px] text-white uppercase tracking-wider hover:bg-[#1A1A1A] transition-colors">
             View All <FaArrowRight />
          </Link>
       </div>

       {/* Order Cards */}
       {displayOrders.length === 0 ? (
           <p className="text-[#A0A0A0] text-sm text-center py-4 font-saira">No active orders found.</p>
       ) : (
           <div className="space-y-4">
             {displayOrders.map((o: any) => (
                <div key={o.id} className="bg-[#1A1A1A] rounded-2xl p-4 flex gap-4 relative">
                   
                   {/* Fallback box since we don't have individual images per order right now */}
                   <div className="w-20 h-20 bg-black rounded-lg border border-white/10 shrink-0 flex items-center justify-center">
                       <img src="/mobile/home/desktops/1.jpg" alt="PC" className="w-full h-full object-cover rounded-lg opacity-80" />
                   </div>
                   
                   <div className="flex-grow py-1">
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="font-saira font-bold text-white text-sm">{o.itemsList?.[0]?.product_name || "Custom Rig Build"}</h3>
                         {/* Status Dot */}
                         <div className="flex items-center gap-1 bg-[#050505] px-2 py-0.5 rounded-full border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                            <span className="text-[7px] text-white uppercase tracking-widest">{o.status.replace('_', ' ')}</span>
                         </div>
                      </div>
                      
                      <p className="font-saira text-[9px] text-white tracking-wider mb-0.5">Order ID: <span className="text-[#A0A0A0]">{o.display_id}</span></p>
                      <p className="font-saira text-[9px] text-white tracking-wider">Placed on: <span className="text-[#A0A0A0]">{new Date(o.created_at).toLocaleDateString()}</span></p>

                      <div className="flex justify-end mt-2">
                         <button className="flex items-center gap-2 border border-white/20 rounded bg-[#121212] px-2 py-1 text-[8px] text-white uppercase hover:border-[#B084FF] transition-colors">
                            <FaFileInvoice /> {['delivered','completed'].includes(o.status.toLowerCase()) ? "Download Invoice" : "Track Order"}
                         </button>
                      </div>
                   </div>
                </div>
             ))}
           </div>
       )}
    </div>
  );
}