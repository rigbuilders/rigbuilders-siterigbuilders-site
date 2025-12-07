export default function CreatorSeries() {
  return (
    <section className="w-full bg-[#121212] py-20 px-6" id="creator">
      <div className="max-w-6xl mx-auto">

        {/* SECTION TITLE */}
        <h2 className="text-3xl font-semibold text-white text-center">
          Creator Series
        </h2>
        <p className="text-[#D0D0D0]/70 text-sm text-center mt-2">
          Rigs tuned for editors, streamers, designers and content creators.
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">

          {/* CARD 1 */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#4E2C8B]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-[#4E2C8B] to-[#265DAB] opacity-80"></div>
            <h3 className="text-white text-lg font-semibold mt-4">
              Creator Lite
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm mt-1">
              Perfect for YouTube editing, thumbnails and light motion graphics.
            </p>
            <button className="mt-4 px-4 py-2 bg-[#4E2C8B] text-white text-xs rounded-full uppercase tracking-wide">
              View Build
            </button>
          </div>

          {/* CARD 2 */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#4E2C8B]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-[#4E2C8B] to-[#A0A0A0] opacity-80"></div>
            <h3 className="text-white text-lg font-semibold mt-4">
              Creator Studio
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm mt-1">
              Tuned for Premiere Pro, After Effects, Photoshop and multitasking.
            </p>
            <button className="mt-4 px-4 py-2 bg-[#4E2C8B] text-white text-xs rounded-full uppercase tracking-wide">
              View Build
            </button>
          </div>

          {/* CARD 3 */}
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 hover:border-[#4E2C8B]/40 transition shadow-lg">
            <div className="w-full h-40 rounded-lg bg-gradient-to-br from-[#4E2C8B] to-[#8C2F39] opacity-80"></div>
            <h3 className="text-white text-lg font-semibold mt-4">
              Creator Max
            </h3>
            <p className="text-[#D0D0D0]/60 text-sm mt-1">
              For heavy timelines, 4K+ workflows, streaming and complex projects.
            </p>
            <button className="mt-4 px-4 py-2 bg-[#4E2C8B] text-white text-xs rounded-full uppercase tracking-wide">
              View Build
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
