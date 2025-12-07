import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function CreatorPage() {
  return (
    <main className="min-h-screen bg-brand-black text-white font-saira">
      <Navbar />
      
      {/* HERO: Content Creation Focus */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-6 border-b border-white/5 bg-gradient-to-b from-brand-black to-brand-charcoal">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-7xl text-white mb-6">
            CREATOR <span className="text-brand-purple">SERIES</span>
          </h1>
          <p className="font-saira text-brand-silver text-base md:text-xl max-w-2xl mx-auto px-4">
            Silent stability. NVMe priority. Tuned for Premiere Pro, After Effects, and Blender.
          </p>
        </div>
      </section>

      {/* MODELS GRID */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Model 1: Creator Lite */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-purple transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Purple Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                LITE
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">CREATOR LITE</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">Perfect for YouTube editing, thumbnails and light motion graphics.</p>
              
              <ul className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Intel Core i5 13600K</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4060 8GB</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">32GB DDR5</span>
                </li>
              </ul>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹1,10,000</span>
                <Link href="/configure?mode=creator">
                  <button className="bg-brand-purple text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Model 2: Creator Studio */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-purple transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Purple Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/30 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                STUDIO
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">CREATOR STUDIO</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">Optimized for 4K video editing and After Effects.</p>
              
              <ul className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Core i7-14700K</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4070 Ti Super</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">64GB DDR5</span>
                </li>
              </ul>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹1,85,000</span>
                <Link href="/configure?mode=creator">
                  <button className="bg-brand-purple text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Model 3: Creator Max */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-purple transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Purple Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/40 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                MAX
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">CREATOR MAX</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">For heavy timelines, 4K+ workflows, and complex projects.</p>
              
              <ul className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Core i9-14900K</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4080 Super</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">96GB DDR5</span>
                </li>
              </ul>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹2,65,000</span>
                <Link href="/configure?mode=creator">
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