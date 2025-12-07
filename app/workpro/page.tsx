import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function WorkProPage() {
  return (
    <main className="min-h-screen bg-brand-black text-white">
      <Navbar />
      
      {/* HERO: Professional/Industrial Focus */}
      <section className="pt-32 pb-20 px-6 border-b border-white/5 'bg-gradient-to-b' from-brand-black to-brand-charcoal">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6">
            WORKPRO <span className="text-white">SERIES</span>
          </h1>
          <p className="font-saira text-brand-silver text-xl max-w-2xl mx-auto">
            Engineering simulations. Data Science. Multi-monitor setups.
            Reliability for CAD, SolidWorks, and MATLAB.
          </p>
        </div>
      </section>

      {/* MODELS GRID */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Model 1: WorkPro Render X */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-white transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Silver/Industrial Gradient */}
              <div className="absolute inset-0 'bg-gradient-to-tr' from-brand-silver/20 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-4xl font-bold group-hover:scale-110 transition-transform duration-500">
                RENDER X
              </span>
            </div>
            
            <div className="p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">WORKPRO RENDER X</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">Built for Blender, Maya, and heavy rendering pipelines.</p>
              
              <ul className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Threadripper / Ryzen 9</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">Dual RTX 4090 / A6000</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">128GB ECC Memory</span>
                </li>
              </ul>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹2,50,000+</span>
                {/* Link sets mode to 'workpro' */}
                <Link href="/configure?mode=workpro">
                  <button className="bg-brand-silver text-black px-6 py-2 rounded-full font-saira font-bold hover:bg-white transition-colors">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Add more cards for 'WorkPro Editor' or 'Data Science' here */}

        </div>
      </section>
      <Footer />
    </main>
  );
}