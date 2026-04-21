import { FaTrash } from "react-icons/fa";

export default function OrdersList({ orders, handleDeleteOrder }: any) {
  if (!orders.length) return <div className="text-center py-10 text-[#A0A0A0] text-sm font-saira">No active orders found.</div>;
  
  const getProgress = (s: string) => {
    const st = (s||"").toLowerCase();
    if (st.includes("delivered") || st.includes("completed")) return "100%";
    if (st.includes("shipped")) return "75%";
    if (st.includes("build") || st.includes("assembly")) return "50%";
    return "25%";
  };

  return (
    <div className="px-6 space-y-4 pb-10">
      {orders.map((o: any) => (
        <div key={o.id} className="bg-transparent border border-[#4E2C8B] rounded-xl p-4 relative overflow-hidden transition-colors">
           <div className="flex justify-between items-start mb-3">
              <div>
                 <h3 className="font-orbitron font-bold text-white text-xs">{o.display_id}</h3>
                 <p className="text-[9px] text-[#A0A0A0] font-saira">{new Date(o.created_at).toLocaleDateString()} • {o.itemsList?.length || 1} Items</p>
              </div>
              <div className="text-right flex flex-col items-end">
                 <p className="font-orbitron font-bold text-sm text-[#B084FF]">₹{Number(o.total_amount||0).toLocaleString()}</p>
                 {['pending','processing'].includes(o.status) && (
                    <button onClick={() => handleDeleteOrder(o.id, o.source)} className="text-[#A0A0A0] hover:text-red-500 mt-2 active:scale-90"><FaTrash size={12}/></button>
                 )}
              </div>
           </div>
           
           <div className="flex justify-between items-center mb-1.5 mt-2">
              <span className="text-[9px] uppercase font-bold text-[#A0A0A0] tracking-widest">{o.status.replace('_',' ')}</span>
           </div>
           <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#B084FF]" style={{ width: getProgress(o.status) }} />
           </div>
        </div>
      ))}
    </div>
  );
}