import { useRouter } from "next/navigation";
import { FaArrowLeft, FaRegUser } from "react-icons/fa";

export default function DashboardHeader({ user }: { user: any }) {
  const router = useRouter();
  
  return (
    <div className="mb-6">
       {/* Top Navigation */}
       <div className="flex items-center justify-between mb-8 px-2">
          <button onClick={() => router.back()} className="text-white text-xl p-2 active:scale-90 transition-transform">
            <FaArrowLeft />
          </button>
          <div className="text-center flex-grow -ml-8">
             <p className="font-orbitron font-bold text-white tracking-widest text-xs mb-1">USER</p>
             <h1 className="font-orbitron font-bold text-[#B084FF] text-2xl tracking-wide">DASHBOARD</h1>
          </div>
       </div>

       {/* User Info Card */}
       <div className="border border-[#4E2C8B] rounded-[32px] p-6 flex items-center gap-6 bg-[#050505]">
          <div className="text-white text-6xl">
             <FaRegUser strokeWidth={1} />
          </div>
          <div className="flex-grow">
             <h2 className="font-saira text-2xl text-white mb-2">{user?.user_metadata?.full_name || "Guest User"}</h2>
             <div className="w-full h-[1px] bg-[#4E2C8B] mb-3"></div>
             <p className="font-saira text-[#A0A0A0] text-sm mb-1">{user?.email}</p>
             <p className="font-saira text-[#A0A0A0] text-sm">{user?.user_metadata?.phone || "No phone added"}</p>
          </div>
       </div>
    </div>
  );
}