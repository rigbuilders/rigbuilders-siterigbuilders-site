import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AscendPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-[#121212] to-[#1A1A1A] border-b border-white/5">
        <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6">
          ASCEND <span className="text-brand-purple">SERIES</span>
        </h1>
        <p className="text-brand-silver text-lg max-w-2xl mx-auto">
          Precision-tuned for competitive gaming. Choose your performance level.
        </p>
      </section>

      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEVEL 5 */}
          <Link href="/ascend/5" className="group">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple transition-all duration-300 h-full flex flex-col">
              <div className="h-64 bg-black/50 flex items-center justify-center font-orbitron text-9xl font-bold text-white/5 group-hover:text-brand-purple/20 transition-colors">5</div>
              <div className="p-8 text-center flex-grow">
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2">ASCEND LEVEL 5</h3>
                <p className="text-brand-silver text-sm mb-6">1080p Competitive Dominance. High FPS in E-Sports titles.</p>
                <span className="text-brand-purple font-bold text-xs tracking-widest uppercase border-b border-brand-purple pb-1">View Builds</span>
              </div>
            </div>
          </Link>

          {/* LEVEL 7 */}
          <Link href="/ascend/7" className="group">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple transition-all duration-300 h-full flex flex-col relative">
              <div className="absolute top-0 right-0 bg-brand-purple text-white text-[10px] font-bold px-3 py-1 uppercase">Best Seller</div>
              <div className="h-64 bg-black/50 flex items-center justify-center font-orbitron text-9xl font-bold text-white/5 group-hover:text-brand-purple/20 transition-colors">7</div>
              <div className="p-8 text-center flex-grow">
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2">ASCEND LEVEL 7</h3>
                <p className="text-brand-silver text-sm mb-6">1440p Sweet Spot. The perfect balance of power and value.</p>
                <span className="text-brand-purple font-bold text-xs tracking-widest uppercase border-b border-brand-purple pb-1">View Builds</span>
              </div>
            </div>
          </Link>

          {/* LEVEL 9 */}
          <Link href="/ascend/9" className="group">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple transition-all duration-300 h-full flex flex-col">
              <div className="h-64 bg-black/50 flex items-center justify-center font-orbitron text-9xl font-bold text-white/5 group-hover:text-brand-purple/20 transition-colors">9</div>
              <div className="p-8 text-center flex-grow">
                <h3 className="font-orbitron text-2xl font-bold text-white mb-2">ASCEND LEVEL 9</h3>
                <p className="text-brand-silver text-sm mb-6">4K Ultra Performance. No compromises. Pure power.</p>
                <span className="text-brand-purple font-bold text-xs tracking-widest uppercase border-b border-brand-purple pb-1">View Builds</span>
              </div>
            </div>
          </Link>

        </div>
      </section>

      <Footer />
    </main>
  );
}