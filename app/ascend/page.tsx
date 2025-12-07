import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AscendPage() {
  return (
    <main className="min-h-screen bg-brand-black text-white">
      <Navbar />
      
      {/* HERO SECTION: High FPS Focus [cite: 55] */}
      <section className="pt-32 pb-20 px-6 border-b border-white/5 'bg-gradient-to-b' from-brand-black to-brand-charcoal">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6">
            ASCEND <span className="text-brand-purple">SERIES</span>
          </h1>
          <p className="font-saira text-brand-silver text-xl max-w-2xl mx-auto">
            Precision-tuned for high FPS gaming. 1440p to 4K dominance.
            No bloatware. Just raw performance.
          </p>
        </div>
      </section>

      {/* MODELS GRID */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Model 1: ASCEND ONE */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-purple transition-all duration-300 group">
            {/* Visual Placeholder */}
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 'bg-gradient-to-tr' from-brand-purple/20 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-4xl font-bold group-hover:scale-110 transition-transform duration-500">
                ASCEND ONE
              </span>
            </div>
            
            <div className="p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">ASCEND ONE</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">The 1440p Sweet Spot. Optimized for competitive esports.</p>
              
              {/* Specs */}
              <div className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Ryzen 5 7600X</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4070 Super</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">32GB DDR5</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹1,45,000</span>
                <button className="bg-brand-purple text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors">
                  CONFIGURE
                </button>
              </div>
            </div>
          </div>
          
          {/* You can duplicate the block above for Ascend Pro and Ascend Ultra */}

        </div>
      </section>

      <Footer />
    </main>
  );
}