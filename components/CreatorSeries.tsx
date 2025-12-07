import Link from "next/link";

export default function CreatorSeries() {
  return (
    <section className="w-full bg-brand-black py-12 md:py-20 px-6" id="creator">
      <div className="max-w-6xl mx-auto">

        {/* SECTION TITLE */}
        <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white text-center">
          Creator Series
        </h2>
        <p className="text-brand-silver/70 text-sm font-saira text-center mt-2 px-4">
          Rigs tuned for editors, streamers, designers and content creators.
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mt-12">

          {/* CARD 1: Creator Lite */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-purple/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Creator Lite
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              Perfect for YouTube editing, thumbnails and light motion graphics.
            </p>
            
            <Link href="/creator">
              <button className="mt-4 px-6 py-2 bg-brand-purple text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 2: Creator Studio */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-purple/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-purple to-brand-silver opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Creator Studio
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              Tuned for Premiere Pro, After Effects, Photoshop and multitasking.
            </p>
            
            <Link href="/creator">
              <button className="mt-4 px-6 py-2 bg-brand-purple text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 3: Creator Max */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-purple/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-purple to-brand-burgundy opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-white text-lg font-orbitron font-bold">
              Creator Max
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              For heavy timelines, 4K+ workflows, streaming and complex projects.
            </p>
            
            <Link href="/creator">
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