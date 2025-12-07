import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function SignaturePage() {
  return (
    <main className="min-h-screen bg-brand-black text-white">
      <Navbar />
      
      {/* HERO: The Masterpiece */}
      <section className="pt-32 pb-20 px-6 border-b border-white/5 relative overflow-hidden">
        {/* Purple Glow for Signature Brand */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-brand-purple/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <p className="font-saira text-brand-purple uppercase tracking-[0.3em] mb-4">The Flagship Experience</p>
          <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6">
            SIGNATURE <span className="text-brand-purple">EDITION</span>
          </h1>
          <p className="font-saira text-brand-silver text-xl max-w-2xl mx-auto">
            A commissioned masterpiece. Custom cable themes, thermal certification, and signed by the builder.
          </p>
        </div>
      </section>

      {/* THE PACKAGE SECTION [cite: 105-108] */}
      <section className="py-20 px-6 bg-[#1A1A1A]">
        <div className="max-w-5xl mx-auto text-center">
           <h2 className="font-orbitron text-3xl mb-12">WHAT IS IN THE BOX?</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="p-6 border border-white/10 rounded-xl bg-brand-black">
                <h3 className="text-brand-purple font-bold mb-2">01. Thermal Report</h3>
                <p className="text-sm text-brand-silver">Every rig comes with a printed thermal stress-test certificate (Cinebench, 3DMark).</p>
              </div>
              <div className="p-6 border border-white/10 rounded-xl bg-brand-black">
                <h3 className="text-brand-purple font-bold mb-2">02. Builder's Signature</h3>
                <p className="text-sm text-brand-silver">Signed verification by the engineer who built and tuned your machine.</p>
              </div>
              <div className="p-6 border border-white/10 rounded-xl bg-brand-black">
                <h3 className="text-brand-purple font-bold mb-2">03. Custom Cables</h3>
                <p className="text-sm text-brand-silver">Hand-trained cables in Matte Black & Deep Purple color theme.</p>
              </div>
              <div className="p-6 border border-white/10 rounded-xl bg-brand-black">
                <h3 className="text-brand-purple font-bold mb-2">04. Build Log</h3>
                <p className="text-sm text-brand-silver">QR code linking to high-res photos of your specific build process.</p>
              </div>
           </div>
           
           <div className="mt-16">
             <Link href="/configure?mode=signature">
                <button className="px-10 py-4 bg-brand-purple text-white font-orbitron font-bold rounded-none border border-brand-purple tracking-widest hover:scale-105 transition-transform">
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