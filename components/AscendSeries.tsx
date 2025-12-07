import Link from "next/link"; 

export default function AscendSeries() {
  return (
    <section className="w-full bg-brand-black py-12 md:py-20 px-6" id="ascend">
      <div className="max-w-6xl mx-auto">

        {/* SECTION TITLE */}
        <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white text-center">
          Ascend Series
        </h2>
        <p className="text-brand-silver/70 text-sm font-saira text-center mt-2 px-4">
          Precision–built rigs engineered for elite gamers.
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mt-12">

          {/* CARD 1: Ascend One */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-purple/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Ascend One
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              RTX GPU · Ryzen CPU · Ultra gaming performance.
            </p>
            
            <Link href="/ascend">
              <button className="mt-4 px-6 py-2 bg-brand-purple text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 2: Ascend Pro */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-purple/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-purple to-brand-burgundy opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Ascend Pro
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              High FPS · Competitive esports optimization.
            </p>

            <Link href="/ascend">
              <button className="mt-4 px-6 py-2 bg-brand-purple text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 3: Ascend Creator */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-purple/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-purple to-brand-silver opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Ascend Creator
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              Gaming + streaming + editing workload balance.
            </p>

            <Link href="/ascend">
              <button className="mt-4 px-6 py-2 bg-brand-purple text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}