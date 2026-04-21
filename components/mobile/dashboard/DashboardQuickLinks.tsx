import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaRegMap } from "react-icons/fa";

export default function DashboardQuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
       
       {/* Saved Configs Card */}
       <Link href="/m/saved" className="border border-[#4E2C8B] rounded-[32px] p-6 flex flex-col justify-between h-[160px] bg-[#050505] active:scale-95 transition-transform">
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#4E2C8B] flex items-center justify-center shadow-[0_0_15px_rgba(78,44,139,0.3)]">
              <Image src="/icons/navbar/products/Desktops.png" alt="Desktop" width={28} height={28} />
          </div>
          <div className="flex justify-between items-end">
             <p className="font-saira text-white leading-tight ">
                Saved <br/> <span className="font-saira text-brand-purple text-xl">Configs</span>
             </p>
             <FaArrowRight className="text-white text-sm" />
          </div>
       </Link>

       {/* Address Book Card */}
       <Link href="/m/account/addresses" className="border border-[#4E2C8B] rounded-[32px] p-6 flex flex-col justify-between h-[160px] bg-[#050505] active:scale-95 transition-transform">
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#4E2C8B] flex items-center justify-center shadow-[0_0_15px_rgba(78,44,139,0.3)]">
              <FaRegMap className="text-white text-2xl" />
          </div>
          <div className="flex justify-between items-end">
             <p className="font-saira text-white leading-tight">
                Address <br/> <span className="font-saira text-brand-purple text-xl">Book</span>
             </p>
             <FaArrowRight className="text-white text-sm" />
          </div>
       </Link>

    </div>
  );
}