// 1. We actuvate the Link tool here
import Link from "next/link";

export default function WorkPro() {
  return (
    <section className="w-full bg-[#121212] py-20 px-6" id="workpro">
      <div className="max-w-6xl mx-auto">

        {/* SECTION TITLE */}
        <h2 className="text-3xl font-orbitron font-bold text-white text-center">
          WorkPro Series
        </h2>
        <p className="text-[#D0D0D0]/70 text-sm font-saira text-center mt-2">
          Extreme performance workstations designed for editing, 3D, rendering & productivity.
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">

          {/* CARD 1: Editor */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#265DAB]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg 'bg-gradient-to-br' from-[#265DAB] to-[#4E2C8B] opacity-80 mb-4"></div>
            <h3 className="text-white text-lg font-orbitron font-bold">
              WorkPro Editor
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm font-saira mt-1">
              Perfect for video editing, color grading, Premiere Pro, DaVinci Resolve.
            </p>
            
            {/* THE LINK BUTTON */}
            <Link href="/workpro">
              <button className="mt-4 px-4 py-2 bg-[#265DAB] text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 2: Render X */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#265DAB]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg 'bg-gradient-to-br' from-[#265DAB] to-[#A0A0A0] opacity-80 mb-4"></div>
            <h3 className="text-white text-lg font-orbitron font-bold">
              WorkPro Render X
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm font-saira mt-1">
              Built for Blender, Maya, 3D modeling, CAD, and heavy rendering pipelines.
            </p>
            
            {/* THE LINK BUTTON */}
            <Link href="/workpro">
              <button className="mt-4 px-4 py-2 bg-[#265DAB] text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

          {/* CARD 3: Creator */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#265DAB]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg 'bg-gradient-to-br' from-[#265DAB] to-[#8C2F39] opacity-80 mb-4"></div>
            <h3 className="text-white text-lg font-orbitron font-bold">
              WorkPro Creator
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm font-saira mt-1">
              Balanced for creators who need editing + productivity + light gaming.
            </p>
            
            {/* THE LINK BUTTON */}
            <Link href="/workpro">
              <button className="mt-4 px-4 py-2 bg-[#265DAB] text-white text-xs rounded-full uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                View Build
              </button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}