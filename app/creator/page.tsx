import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function CreatorPage() {
  return (
    <main className="min-h-screen bg-brand-black text-white">
      <Navbar />
      
      {/* HERO: Content Creation Focus */}
      <section className="pt-32 pb-20 px-6 border-b border-white/5 'bg-gradient-to-b' from-brand-black to-brand-charcoal">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6">
            CREATOR <span className="text-brand-blue">SERIES</span>
          </h1>
          <p className="font-saira text-brand-silver text-xl max-w-2xl mx-auto">
            Silent stability. NVMe priority. Tuned for Premiere Pro, After Effects, and Blender.
          </p>
        </div>
      </section>

      {/* MODELS GRID */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Model 1: Creator Studio */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-blue transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Blue Gradient for Creator Vibes */}
              <div className="absolute inset-0 'bg-gradient-to-tr' from-brand-blue/20 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-4xl font-bold group-hover:scale-110 transition-transform duration-500">
                STUDIO
              </span>
            </div>
            
            <div className="p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">CREATOR STUDIO</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">Optimized for 4K video editing and motion graphics.</p>
              
              <ul className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Core i7-14700K</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4070 Ti (Studio)</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">64GB DDR5</span>
                </li>
              </ul>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹1,85,000</span>
                {/* NOTICE: The link sends a 'mode' to the configurator */}
                <Link href="/configure?mode=creator">
                  <button className="bg-brand-blue text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Repeat this block for 'Creator Lite' and 'Creator Max' if needed */}

        </div>
      </section>
      <Footer />
    </main>
  );
}