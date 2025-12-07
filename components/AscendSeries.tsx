// 1. We import the Link tool from Next.js
import Link from "next/link"; 

export default function AscendSeries() {
  return (
    <section className="w-full bg-[#121212] py-20 px-6" id="ascend">
      <div className="max-w-6xl mx-auto">

        {/* SECTION TITLE */}
        <h2 className="text-3xl font-orbitron font-bold text-white text-center">
          Ascend Series
        </h2>
        <p className="text-[#D0D0D0]/70 text-sm font-saira text-center mt-2">
          Precision–built rigs engineered for elite gamers.
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">

          {/* CARD 1: Ascend One */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#4E2C8B]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg 'bg-gradient-to-br' from-[#4E2C8B] to-[#265DAB] opacity-80 mb-4"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Ascend One
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm font-saira mt-1">
              RTX GPU · Ryzen CPU · Ultra gaming performance.
            </p>
            
            {/* THIS IS THE LINK BUTTON */}
            <Link href="/ascend">
              <button className="mt-4 px-4 py-2 bg-[#4E2C8B] text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 2: Ascend Pro */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#4E2C8B]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg 'bg-gradient-to-br' from-[#4E2C8B] to-[#8C2F39] opacity-80 mb-4"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Ascend Pro
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm font-saira mt-1">
              High FPS · Competitive esports optimization.
            </p>

            {/* THIS IS THE LINK BUTTON */}
            <Link href="/ascend">
              <button className="mt-4 px-4 py-2 bg-[#4E2C8B] text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 3: Ascend Creator */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#4E2C8B]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg 'bg-gradient-to-br' from-[#4E2C8B] to-[#A0A0A0] opacity-80 mb-4"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Ascend Creator
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm font-saira mt-1">
              Gaming + streaming + editing workload balance.
            </p>

            {/* THIS IS THE LINK BUTTON */}
            <Link href="/ascend">
              <button className="mt-4 px-4 py-2 bg-[#4E2C8B] text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}