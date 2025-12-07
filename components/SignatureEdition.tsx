// 1. Activate Link tool
import Link from "next/link";

export default function SignatureEdition() {
  return (
    <section
      className="w-full bg-[#121212] py-20 px-6 border-t border-white/5"
      id="signature"
    >
      <div className="max-w-6xl mx-auto">

        {/* TITLE */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-[#4E2C8B] font-saira font-bold">
            Signature Edition
          </p>
          <h2 className="mt-3 text-3xl font-orbitron font-bold text-white">
            Commissioned. Not Assembled.
          </h2>
          <p className="mt-3 text-sm text-[#D0D0D0]/75 font-saira">
            Our most premium rigs — hand–built, thermally tuned, cable–certified
            and delivered with complete stress–test proof.
          </p>
        </div>

        {/* FEATURE ROW */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5 shadow-lg">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A0A0A0] font-bold">
              01 · Proof Culture
            </p>
            <h3 className="mt-3 text-lg font-bold text-white font-orbitron">
              Stress–Tested & Documented
            </h3>
            <p className="mt-2 text-sm text-[#D0D0D0]/70 font-saira">
              Cinebench, 3DMark, and thermal logs are captured and stored for every build.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#4E2C8B]/40 shadow-lg">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A0A0A0] font-bold">
              02 · Visual Identity
            </p>
            <h3 className="mt-3 text-lg font-bold text-white font-orbitron">
              Signature Cable & Lighting
            </h3>
            <p className="mt-2 text-sm text-[#D0D0D0]/70 font-saira">
              Matte black + deep purple cable theme, tuned RGB profile.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5 shadow-lg">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A0A0A0] font-bold">
              03 · Ownership
            </p>
            <h3 className="mt-3 text-lg font-bold text-white font-orbitron">
              Named Build & QR Log
            </h3>
            <p className="mt-2 text-sm text-[#D0D0D0]/70 font-saira">
              Every Signature rig gets a unique Build ID and QR code linked to your name.
            </p>
          </div>
        </div>

        {/* CTA BUTTON - LINKED! */}
        <div className="mt-12 flex justify-center">
          <Link href="/signature">
            <button className="px-8 py-3 rounded-full bg-[#4E2C8B] text-white text-xs font-bold font-orbitron uppercase tracking-[0.25em] hover:opacity-90 hover:scale-105 transition-all">
              Explore Signature Edition
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}