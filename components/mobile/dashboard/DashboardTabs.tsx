import { FaSignOutAlt, FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";

export default function DashboardTabs({ activeTab, setActiveTab, handleSignOut }: any) {
  return (
    <div className="flex overflow-x-auto gap-2 px-6 pb-2 mb-6 scroll-pl-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
       <button onClick={() => setActiveTab("orders")} className={`flex-shrink-0 snap-start px-4 py-2 rounded-lg font-bold text-xs transition-colors border ${activeTab === "orders" ? "bg-[#4E2C8B] text-white border-[#B084FF]" : "bg-[#1A1A1A] text-[#A0A0A0] border-white/5 hover:text-white"}`}>
          My Orders
       </button>
       <button onClick={() => setActiveTab("saved")} className={`flex-shrink-0 snap-start px-4 py-2 rounded-lg font-bold text-xs transition-colors border ${activeTab === "saved" ? "bg-[#4E2C8B] text-white border-[#B084FF]" : "bg-[#1A1A1A] text-[#A0A0A0] border-white/5 hover:text-white"}`}>
          Saved Configs
       </button>
       <Link href="/account/addresses" className="flex-shrink-0 snap-start px-4 py-2 rounded-lg font-bold text-xs bg-[#1A1A1A] text-[#A0A0A0] border border-white/5 hover:text-white flex items-center gap-2">
          <FaMapMarkerAlt /> Address
       </Link>
       <button onClick={handleSignOut} className="flex-shrink-0 snap-start px-4 py-2 rounded-lg font-bold text-xs bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
          <FaSignOutAlt /> Sign Out
       </button>
       <div className="w-2 flex-shrink-0" />
    </div>
  );
}