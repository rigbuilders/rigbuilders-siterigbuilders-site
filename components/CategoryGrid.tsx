import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { getAssets } from "@/lib/categories.server";
import { Reveal } from "@/components/ui/MotionWrappers";

// The curated bento layout (which categories are featured + their span/position)
// stays in code — it's editorial design. Only the IMAGES are DB-editable, pulled
// from site_assets by tag with the current path as fallback.
const FEATURED = [
  { title: "GRAPHICS CARDS", id: "gpu", tag: "home-featured-gpu", fallback: "/images/Products/gpu.jpg", span: "md:col-span-2", position: "object-center" },
  { title: "PROCESSORS", id: "cpu", tag: "home-featured-cpu", fallback: "/images/Products/cpu.jpg", span: "md:col-span-1", position: "object-center" },
  { title: "STORAGE", id: "storage", tag: "home-featured-storage", fallback: "/images/Products/nvme.jpg", span: "md:col-span-1", position: "object-center" },
  { title: "DISPLAYS", id: "monitor", tag: "home-featured-monitor", fallback: "/images/Accessories/monitor.jpg", span: "md:col-span-2", position: "center" },
];

export default async function CategoryGrid() {
  const assetMap = await getAssets(FEATURED.map((f) => f.tag));
  const categories = FEATURED.map((f) => ({ ...f, image: assetMap[f.tag] || f.fallback }));

  return (
    <section className="bg-rb-surface py-16 relative z-10 border-t border-rb-line">
      {/* Container aligned to Navbar: 30px padding at 1440px */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-[30px]">

        {/* Section Header */}
        <Reveal>
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="rb-kicker block mb-2">Hardware</span>
              <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-rb-white uppercase">
                Shop By <span className="text-rb-orange">Category</span>
              </h2>
            </div>
            <Link href="/products/" className="hidden md:flex items-center gap-2 text-rb-silver hover:text-rb-orange transition-colors text-sm uppercase tracking-widest">
              View All <FaArrowRight />
            </Link>
          </div>
        </Reveal>

        {/* Cinematic Bento Grid */}
        <Reveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[800px]">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/products/${cat.id}`}
              className={`group relative overflow-hidden rounded-sm border border-rb-line bg-rb-black ${cat.span} h-[300px] md:h-auto`}
            >
              {/* Background Image with Zoom Effect */}
              <div 
                className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                style={{ 
                  backgroundImage: `url('${cat.image}')`,
                  backgroundPosition: cat.position 
                }}
              />
              
              {/* Cinematic Overlay (Dark gradient from bottom) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col items-start">
                <div className="overflow-hidden">
                  <h3 className="font-orbitron font-bold text-2xl md:text-4xl text-white uppercase translate-y-0 transition-transform duration-300">
                    {cat.title}
                  </h3>
                </div>
                
                {/* Animated Line & Link */}
                <div className="flex items-center gap-3 mt-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75">
                  <div className="h-[2px] w-12 rb-bar-anim rounded-full" />
                  <span className="text-xs font-bold text-rb-orange uppercase tracking-widest">
                    Explore
                  </span>
                </div>
              </div>

              {/* Hover Border Glow */}
              <div className="absolute inset-0 border border-white/0 group-hover:border-rb-orange/60 transition-colors duration-300 pointer-events-none" />
            </Link>
          ))}
        </div>
        </Reveal>

      </div>
    </section>
  );
}