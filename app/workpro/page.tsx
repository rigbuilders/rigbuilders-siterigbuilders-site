import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function WorkProPage() {
  return (
    <main className="min-h-screen bg-brand-black text-white font-saira">
      <Navbar />
      
      {/* HERO: Professional/Industrial Focus */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-6 border-b border-white/5 bg-gradient-to-b from-brand-black to-brand-charcoal">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-7xl text-white mb-6">
            WORKPRO <span className="text-brand-blue">SERIES</span>
          </h1>
          <p className="font-saira text-brand-silver text-base md:text-xl max-w-2xl mx-auto px-4">
            Engineering simulations. Data Science. Multi-monitor setups.
            Reliability for CAD, SolidWorks, and MATLAB.
          </p>
        </div>
      </section>

      {/* MODELS GRID */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Model 1: WorkPro Editor */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-blue transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Blue/Industrial Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/20 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                EDITOR
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">WORKPRO EDITOR</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">Perfect for 4K video editing, color grading, and Premiere Pro.</p>
              
              <ul className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Intel Core i7 14700K</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4070 Super</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">64GB DDR5</span>
                </li>
              </ul>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹1,85,000</span>
                <Link href="/configure?mode=workpro">
                  <button className="bg-brand-blue text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Model 2: WorkPro Render X */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-blue transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Blue/Industrial Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/30 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                RENDER X
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">RENDER X</h3>
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
                <span className="font-saira text-white font-bold text-lg">₹3,50,000+</span>
                <Link href="/configure?mode=workpro">
                  <button className="bg-brand-blue text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
                    CONFIGURE
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Model 3: WorkPro Creator */}
          <div className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5 hover:border-brand-blue transition-all duration-300 group">
            <div className="h-64 bg-black relative flex items-center justify-center overflow-hidden">
               {/* Blue/Industrial Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/20 to-transparent opacity-50"></div>
              <span className="font-orbitron text-brand-silver/20 text-3xl font-bold group-hover:scale-110 transition-transform duration-500">
                CREATOR
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              <h3 className="font-orbitron text-2xl text-white mb-2">WORKPRO CREATOR</h3>
              <p className="font-saira text-brand-silver text-sm mb-6">Balanced for editing + productivity + light gaming.</p>
              
              <ul className="space-y-3 mb-8 font-saira text-sm text-brand-silver/80">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>CPU</span> <span className="text-white">Ryzen 7 7700X</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>GPU</span> <span className="text-white">RTX 4060 Ti 16GB</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>RAM</span> <span className="text-white">32GB DDR5</span>
                </li>
              </ul>

              <div className="flex justify-between items-center">
                <span className="font-saira text-white font-bold text-lg">₹1,25,000</span>
                <Link href="/configure?mode=workpro">
                  <button className="bg-brand-blue text-white px-6 py-2 rounded-full font-saira font-semibold hover:bg-white hover:text-black transition-colors text-sm">
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