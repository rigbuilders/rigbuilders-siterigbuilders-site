import Link from "next/link";

export default function SignatureEdition() {
  return (
    <section className="w-full bg-brand-black py-20 px-6 border-t border-white/5" id="signature">
      <div className="max-w-6xl mx-auto text-center">
        
        {/* HEADER */}
        <span className="font-saira text-brand-purple tracking-[0.2em] uppercase text-sm font-bold">
          Signature Edition
        </span>
        <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-white mt-4 mb-6">
          Commissioned. Not Assembled.
        </h2>
        <p className="text-brand-silver/70 text-base md:text-lg font-saira max-w-3xl mx-auto leading-relaxed">
          Our most premium rigs — hand-built, thermally tuned, cable-certified and delivered with complete stress-test proof.
        </p>

        {/* FEATURE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          
          {/* Feature 1 */}
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-brand-purple/50 transition duration-300">
            <span className="text-brand-silver/40 text-xs font-bold tracking-widest uppercase mb-4 block">
              01 · Proof Culture
            </span>
            <h3 className="text-white text-xl font-orbitron font-bold mb-3">
              Stress-Tested & Documented
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
              Cinebench, 3DMark, and thermal logs are captured and stored for every build.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-brand-purple/50 transition duration-300">
            <span className="text-brand-silver/40 text-xs font-bold tracking-widest uppercase mb-4 block">
              02 · Visual Identity
            </span>
            <h3 className="text-white text-xl font-orbitron font-bold mb-3">
              Signature Cable & Lighting
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
              Matte black + deep purple cable theme, tuned RGB profile.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-brand-purple/50 transition duration-300">
            <span className="text-brand-silver/40 text-xs font-bold tracking-widest uppercase mb-4 block">
              03 · Ownership
            </span>
            <h3 className="text-white text-xl font-orbitron font-bold mb-3">
              Named Build & QR Log
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira leading-relaxed">
              Every Signature rig gets a unique Build ID and QR code linked to your name.
            </p>
          </div>

        </div>

        {/* CTA BUTTON */}
        <div className="mt-16">
          <Link href="/signature">
            <button className="px-10 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white font-orbitron font-bold rounded-full tracking-wider transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(78,44,139,0.4)]">
              EXPLORE SIGNATURE EDITION
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
}