import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AscendPage() {
  return (
    <main className="min-h-screen bg-brand-black text-white font-saira">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-6 border-b border-white/5 bg-gradient-to-b from-brand-black to-brand-charcoal">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-7xl text-white mb-6">
            ASCEND <span className="text-brand-purple">SERIES</span>
          </h1>
          <p className="font-saira text-brand-silver text-base md:text-xl max-w-2xl mx-auto px-4">
            Precision-tuned for high FPS gaming. 1440p to 4K dominance.
            No bloatware. Just raw performance.
          </p>
        </div>
      </section>

      {/* MODELS GRID */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Model 1: ASCEND ONE */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-purple transition-all duration-300 group">
            {/* Visual Placeholder */}
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                ASCEND ONE
              </span>
            </div>
            
            <div className="p-6 md:p-8">
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
                <Link href="/configure">
                  <button className="bg-brand-purple text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Model 2: ASCEND PRO */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-purple transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/40 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                ASCEND PRO
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">ASCEND PRO</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">High refresh rate 1440p & Entry 4K Gaming.</p>
              
              <div className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Ryzen 7 7800X3D</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4080 Super</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">32GB DDR5</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹2,10,000</span>
                <Link href="/configure">
                  <button className="bg-brand-purple text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Model 3: ASCEND ULTRA */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-purple transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/60 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                ASCEND ULTRA
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">ASCEND ULTRA</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">Uncompromised 4K Ray Tracing Performance.</p>
              
              <div className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Intel i9 14900K</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4090</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">64GB DDR5</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹3,25,000</span>
                <Link href="/configure">
                  <button className="bg-brand-purple text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}