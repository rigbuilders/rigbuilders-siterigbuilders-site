import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function SignaturePage() {
  return (
    <main className="min-h-screen bg-brand-black text-white font-saira">
      <Navbar />
      
      {/* HERO: The Masterpiece */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-6 border-b border-white/5 relative overflow-hidden bg-brand-black">
        {/* Purple Glow for Signature Brand */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-brand-purple/10 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <p className="font-saira text-brand-purple uppercase tracking-[0.3em] mb-4 text-xs md:text-sm font-bold">The Flagship Experience</p>
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-7xl text-white mb-6">
            SIGNATURE <span className="text-brand-purple">EDITION</span>
          </h1>
          <p className="font-saira text-brand-silver text-base md:text-xl max-w-2xl mx-auto px-4 leading-relaxed">
            A commissioned masterpiece. Custom cable themes, thermal certification, and signed by the builder.
          </p>
        </div>
      </section>

      {/* THE PACKAGE SECTION */}
      <section className="py-12 md:py-20 px-6 bg-brand-black">
        <div className="max-w-5xl mx-auto text-center">
           <h2 className="font-orbitron text-2xl md:text-3xl mb-12 text-white font-bold">WHAT IS IN THE BOX?</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
              {/* Feature 1 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">01. Thermal Report</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">Every rig comes with a printed thermal stress-test certificate (Cinebench, 3DMark) proving stability before it ships.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">02. Builder's Signature</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">Signed verification card by the specific engineer who built, tuned, and cable-managed your machine.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">03. Custom Cables</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">Hand-trained cables in our signature Matte Black & Deep Purple color theme. No loose wires.</p>
              </div>
              
              {/* Feature 4 */}
              <div className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:border-brand-purple/50 transition-colors duration-300">
                <h3 className="text-brand-purple font-orbitron font-bold mb-3 text-lg">04. Build Log</h3>
                <p className="text-sm text-brand-silver/70 leading-relaxed">A personal QR code linking to high-res photos of your specific build process, from parts to final testing.</p>
              </div>
           </div>
           
           <div className="mt-16">
             <Link href="/configure?mode=signature">
                <button className="px-10 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white font-orbitron font-bold rounded-full tracking-widest transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(78,44,139,0.4)]">
                  COMMISSION THIS BUILD
                </button>
             </Link>
           </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}