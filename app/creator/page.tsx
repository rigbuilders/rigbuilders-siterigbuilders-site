import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaPenNib, FaVideo, FaCube, FaArrowRight, FaStar } from "react-icons/fa";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Series | Built for Professionals", 
  description: "Pre-Builts Desktop series for creators, editors, and 3D artists — optimized for rendering, multitasking, and speed",
};


export default function CreatorPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* --- HERO HEADER --- */}
      <section className="pt-20 pb-20 px-6 border-b border-white/5 bg-[#1A1A1A] relative overflow-hidden">
        {/* Creator Ambient Glow (Blue/Cyan) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/10 blur-[150px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <Reveal>
            <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6 tracking-tighter">
              CREATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-cyan-400">SERIES</span>
            </h1>
            <p className="text-brand-silver text-lg max-w-2xl mx-auto font-saira tracking-wide">
              Designed for Streamers, Artists, and Editors. Optimized for the Adobe Suite and 3D Pipelines.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- CONTENT AREA (List Layout) --- */}
      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-16 relative z-10">
        
        {/* CREATOR 5 */}
        <Link href="/creator/5" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-brand-blue">
                    
                    {/* Background Number Watermark */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-brand-blue/[0.05] transition-colors duration-500">
                        05
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        {/* Icon: Pen Nib for Design/Photo */}
                        <div className="text-brand-blue text-2xl bg-brand-blue/10 p-4 rounded-full border border-brand-blue/20 group-hover:bg-brand-blue group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <FaPenNib />
                        </div>
                        {/* Title */}
                        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-brand-blue transition-colors">
                            CREATOR 5
                        </h2>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            Photo Editing & 1080p Video. The perfect canvas for Adobe Photoshop, Lightroom, and digital illustration.
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Open Studio</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

        {/* SEPARATOR */}
        <div className="w-full h-[1px] bg-white/5" />

        {/* CREATOR 7 (Best Seller) */}
        <Link href="/creator/7" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-cyan-400">
                    
                     {/* Background Number */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-cyan-400/[0.05] transition-colors duration-500">
                        07
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        {/* Icon: Video for Editing/Motion */}
                        <div className="text-cyan-400 text-2xl bg-cyan-400/10 p-4 rounded-full border border-cyan-400/20 group-hover:bg-cyan-400 group-hover:text-black group-hover:scale-110 transition-all duration-300">
                            <FaVideo />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                                CREATOR 7
                            </h2>
                            {/* Best Seller Badge */}
                            <span className="w-fit flex items-center gap-2 bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                <FaStar size={10} /> Best Seller
                            </span>
                        </div>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            4K Video Editing & Motion Graphics. Optimized timeline performance for After Effects and Premiere Pro.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Open Studio</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

        {/* SEPARATOR */}
        <div className="w-full h-[1px] bg-white/5" />

        {/* CREATOR 9 */}
        <Link href="/creator/9" className="group block">
            <Reveal>
                <div className="relative pl-0 md:pl-4 transition-all duration-500 hover:pl-8 border-l-2 border-transparent hover:border-brand-blue">
                    
                    {/* Background Number */}
                    <span className="absolute -top-6 -right-6 md:right-10 text-[6rem] md:text-[8rem] font-bold text-white/[0.03] font-orbitron select-none group-hover:text-brand-blue/[0.05] transition-colors duration-500">
                        09
                    </span>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                        {/* Icon: Cube for 3D/VFX */}
                        <div className="text-brand-blue text-2xl bg-brand-blue/10 p-4 rounded-full border border-brand-blue/20 group-hover:bg-brand-blue group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <FaCube />
                        </div>
                        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white group-hover:text-brand-blue transition-colors">
                            CREATOR 9
                        </h2>
                    </div>

                    <div className="pl-[80px] pr-4 relative z-10">
                        <p className="text-brand-silver leading-relaxed text-lg mb-6 max-w-2xl">
                            3D Rendering & Cinema 4D. Workstation-grade power for Blender, Maya, and heavy VFX simulation.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            <span>Open Studio</span>
                            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </Reveal>
        </Link>

      </div>

      <Footer />
    </main>
  );
}