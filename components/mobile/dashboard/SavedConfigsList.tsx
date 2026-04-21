import { FaTrash, FaMicrochip } from "react-icons/fa";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function SavedConfigsList({ configs, setConfigs }: any) {
  if (!configs.length) return <div className="text-center py-10 text-[#A0A0A0] text-sm font-saira">No saved builds.</div>;

  const del = async (id: string) => {
     if(!confirm("Delete this config?")) return;
     await supabase.from('saved_configurations').delete().eq('id', id);
     setConfigs((p:any) => p.filter((c:any) => c.id !== id));
  };

  return (
    <div className="px-6 space-y-4 pb-10">
      {configs.map((c: any, i: number) => (
        <div key={c.id} className="bg-transparent border border-[#4E2C8B] rounded-xl p-4 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-[#B084FF]"><FaMicrochip size={14}/></div>
              <div>
                 <h3 className="font-orbitron font-bold text-white text-xs">Build 00{i + 1}</h3>
                 <p className="font-orbitron font-bold text-[#B084FF] text-[10px]">₹{Number(c.total_price).toLocaleString()}</p>
              </div>
           </div>
           <div className="flex gap-4 items-center">
              <Link href={`/build/${c.id}`} className="text-[10px] uppercase font-bold text-white hover:text-[#B084FF] tracking-wider">View</Link>
              <button onClick={() => del(c.id)} className="text-[#A0A0A0] hover:text-red-500 active:scale-90"><FaTrash size={12}/></button>
           </div>
        </div>
      ))}
    </div>
  );
}