"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import MotionWrapper from "@/components/mobile/MotionWrapper";
import DashboardHeader from "@/components/mobile/dashboard/DashboardHeader";
import DashboardQuickLinks from "@/components/mobile/dashboard/DashboardQuickLinks";
import DashboardOrders from "@/components/mobile/dashboard/DashboardOrders";
import { FaSignOutAlt } from "react-icons/fa";

export default function MobileDashboard() {
  const { user, orders, loading, handleSignOut } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
        <div className="relative w-[390px] h-[844px] bg-[#121212] rounded-[40px] border-[8px] border-[#222] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#B084FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-10">
      <div className="relative w-[390px] h-[844px] bg-[#121212] overflow-hidden rounded-[40px] border-[8px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform-gpu flex flex-col font-saira">
        
        <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-[#121212] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#B084FF] [&::-webkit-scrollbar-thumb]:rounded-l-full pr-0">
          
          <MotionWrapper className="px-6 py-10 flex flex-col min-h-full">
            
            <DashboardHeader user={user} />
            <DashboardQuickLinks />
            <DashboardOrders orders={orders} />
            
            {/* The Sign Out Button */}
            <div className="flex justify-end mt-auto pt-4">
               <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-3 border border-[#4E2C8B] rounded-xl px-4 py-2 text-white font-saira text-sm hover:bg-[#1A1A1A] transition-colors active:scale-95"
               >
                  Sign Out <FaSignOutAlt className="text-[#B084FF]" />
               </button>
            </div>

          </MotionWrapper>
        </div>
      </div>
    </div>
  );
}