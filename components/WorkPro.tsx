import Link from "next/link";

export default function WorkPro() {
  return (
    <section className="w-full bg-brand-black py-12 md:py-20 px-6" id="workpro">
      <div className="max-w-6xl mx-auto">

        {/* SECTION TITLE */}
        <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white text-center">
          WorkPro Series
        </h2>
        <p className="text-brand-silver/70 text-sm font-saira text-center mt-2 px-4">
          Extreme performance workstations designed for editing, 3D, rendering & productivity.
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mt-12">

          {/* CARD 1: Editor */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-blue/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-white text-lg font-orbitron font-bold">
              WorkPro Editor
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              Perfect for video editing, color grading, Premiere Pro, DaVinci Resolve.
            </p>
            
            <Link href="/workpro">
              <button className="mt-4 px-6 py-2 bg-brand-blue text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 2: Render X */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-blue/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-blue to-brand-silver opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-white text-lg font-orbitron font-bold">
              WorkPro Render X
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              Built for Blender, Maya, 3D modeling, CAD, and heavy rendering pipelines.
            </p>
            
            <Link href="/workpro">
              <button className="mt-4 px-6 py-2 bg-brand-blue text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 3: Creator */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-brand-blue/40 transition shadow-lg group">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-brand-blue to-brand-burgundy opacity-80 mb-4 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-white text-lg font-orbitron font-bold">
              WorkPro Creator
            </h3>
            <p className="text-brand-silver/60 text-sm font-saira mt-1">
              Balanced for creators who need editing + productivity + light gaming.
            </p>
            
            <Link href="/workpro">
              <button className="mt-4 px-6 py-2 bg-brand-blue text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}