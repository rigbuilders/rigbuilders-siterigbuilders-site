import Link from "next/link";
import { ReactNode } from "react";
import { FaArrowRight } from "react-icons/fa";

interface Props {
    href: string; number: string; icon: ReactNode; title: string; 
    description: string; badge?: string; colorClass: string;
}

export default function SeriesCard({ href, number, icon, title, description, badge, colorClass }: Props) {
   return (
      // Height is exactly 210px to ensure 2.5 cards are visible on the 844px sandbox screen!
      <Link href={href} className={`block relative bg-[#1A1A1A] border border-white/5 hover:border-[#B084FF] rounded-3xl p-6 overflow-hidden h-[210px] shrink-0 active:scale-95 transition-all`}>
          
          {/* Background Watermark */}
          <span className={`absolute -bottom-4 -right-2 text-[8rem] font-bold opacity-5 font-orbitron select-none ${colorClass}`}>{number}</span>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
             <div className={`text-xl bg-black/60 p-3.5 rounded-full border border-white/10 ${colorClass}`}>{icon}</div>
             <div>
                <h2 className="font-orbitron text-2xl font-bold text-white tracking-wide">{title}</h2>
                {badge && <span className="inline-block mt-1 text-[9px] bg-[#B084FF]/20 text-[#B084FF] px-2 py-0.5 rounded uppercase font-bold tracking-widest border border-[#B084FF]/30">{badge}</span>}
             </div>
          </div>
          
          <p className="text-[#A0A0A0] text-xs leading-relaxed relative z-10 line-clamp-3 font-saira">{description}</p>
          
          <div className="absolute bottom-6 left-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B084FF]">
             <span>Deploy System</span> <FaArrowRight />
          </div>
      </Link>
   )
}