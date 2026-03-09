"use client";

import Image from "next/image";
import Link from "next/link";
import { FaTimes, FaUser, FaShoppingCart, FaWrench } from "react-icons/fa";

export default function MobileMenuDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-4 z-[100] bg-[#090909]/95 backdrop-blur-2xl border border-brand-purple/20 rounded-3xl p-6 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative h-10 w-10">
          <Image src="/icons/icon-dark.png" alt="Logo" fill className="object-contain" />
        </div>
        <button onClick={onClose} className="text-white text-2xl active:scale-90"><FaTimes /></button>
      </div>

      {/* THREE TOP BOXES (Based on original Navbar Actions) */}
      <div className="grid grid-cols-3 gap-4 mb-10">
         <ActionBox icon={<FaUser/>} label="Account" href="/signin" onClick={onClose} />
         <ActionBox icon={<FaShoppingCart/>} label="Cart" href="/cart" onClick={onClose} />
         <ActionBox icon={<FaWrench/>} label="Build" href="/configure" onClick={onClose} />
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar font-saira">
         {/* MAIN MENU */}
         <div className="mb-8">
            <h3 className="text-brand-silver text-xs border-b border-brand-purple/30 pb-2 mb-4">Main Menu</h3>
            <ul className="space-y-4 text-white text-lg">
                <li><Link href="/products/cpu" onClick={onClose}>Processors</Link></li>
                <li><Link href="/products/gpu" onClick={onClose}>Graphics Cards</Link></li>
                <li><Link href="/products/monitor" onClick={onClose}>Monitors</Link></li>
            </ul>
         </div>

         {/* DESKTOPS */}
         <div>
            <h3 className="text-brand-silver text-xs border-b border-brand-purple/30 pb-2 mb-4">Desktops</h3>
            <ul className="space-y-4 text-white text-lg">
                <li><Link href="/ascend" onClick={onClose}>Ascend Series</Link></li>
                <li><Link href="/workpro" onClick={onClose}>WorkPro Series</Link></li>
                <li><Link href="/creator" onClick={onClose}>Creator Series</Link></li>
                <li><Link href="/signature" onClick={onClose}>Signature Series</Link></li>
            </ul>
         </div>
      </div>
    </div>
  );
}

function ActionBox({ icon, label, href, onClick }: any) {
  return (
    <Link href={href} onClick={onClick} className="aspect-square bg-white/5 border border-brand-purple/20 rounded-xl flex flex-col items-center justify-center text-brand-purple hover:bg-brand-purple/10 transition-colors">
        <div className="text-xl mb-2">{icon}</div>
        <span className="text-[10px] text-white uppercase">{label}</span>
    </Link>
  );
}