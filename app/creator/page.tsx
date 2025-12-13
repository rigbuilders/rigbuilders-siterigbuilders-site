import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function CreatorPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-[#121212] to-[#1A1A1A] border-b border-white/5">
        <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6">
          CREATOR <span className="text-brand-purple">SERIES</span>
        </h1>
        <p className="text-brand-silver text-lg max-w-2xl mx-auto">
          Designed for Streamers, Artists, and Editors.
        </p>
      </section>

      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEVEL 5 */}
          <Link href="/creator/5" className="group">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple transition-all duration-300 h-full flex flex-col">
              <div className="h-64 bg-black/50 flex items-center justify-center font-orbitron text-9xl font-bold text-white/5 group-hover:text-brand-purple/20 transition-colors">5</div>
              <div className="p-8 text-center flex-grow">
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2">CREATOR 5</h3>
                <p className="text-brand-silver text-sm mb-6">Photo Editing & 1080p Video. Adobe Photoshop & Lightroom.</p>
                <span className="text-brand-purple font-bold text-xs tracking-widest uppercase border-b border-brand-purple pb-1">View Studio</span>
              </div>
            </div>
          </Link>

          {/* LEVEL 7 */}
          <Link href="/creator/7" className="group">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple transition-all duration-300 h-full flex flex-col relative">
              <div className="absolute top-0 right-0 bg-brand-purple text-white text-[10px] font-bold px-3 py-1 uppercase">Best Seller</div>
              <div className="h-64 bg-black/50 flex items-center justify-center font-orbitron text-9xl font-bold text-white/5 group-hover:text-brand-purple/20 transition-colors">7</div>
              <div className="p-8 text-center flex-grow">
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2">CREATOR 7</h3>
                <p className="text-brand-silver text-sm mb-6">4K Video Editing & Motion Graphics. After Effects & Premiere Pro.</p>
                <span className="text-brand-purple font-bold text-xs tracking-widest uppercase border-b border-brand-purple pb-1">View Studio</span>
              </div>
            </div>
          </Link>

          {/* LEVEL 9 */}
          <Link href="/creator/9" className="group">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple transition-all duration-300 h-full flex flex-col">
              <div className="h-64 bg-black/50 flex items-center justify-center font-orbitron text-9xl font-bold text-white/5 group-hover:text-brand-purple/20 transition-colors">9</div>
              <div className="p-8 text-center flex-grow">
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2">CREATOR 9</h3>
                <p className="text-brand-silver text-sm mb-6">3D Rendering & Cinema 4D. Blender, Maya, and heavy VFX.</p>
                <span className="text-brand-purple font-bold text-xs tracking-widest uppercase border-b border-brand-purple pb-1">View Studio</span>
              </div>
            </div>
          </Link>

        </div>
      </section>

      <Footer />
    </main>
  );
}