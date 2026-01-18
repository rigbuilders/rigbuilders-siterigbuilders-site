import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { FaArrowRight, FaCalendarAlt } from "react-icons/fa";
import { Reveal } from "@/components/ui/MotionWrappers"; // Assuming you have this from previous steps

const prisma = new PrismaClient();

export default async function HomeBlogSection() {
  // 1. Fetch latest 3 published posts
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // If no posts, don't render anything (keeps homepage clean)
  if (posts.length === 0) return null;

  return (
    <section className="w-full bg-[#121212] border-t border-white/5 py-24 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-[30px]">
        
        {/* SECTION HEADER */}
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-6">
            <div>
              <span className="text-brand-purple font-bold tracking-[0.2em] text-xs uppercase block mb-3">
                System Updates
              </span>
              <h2 className="font-orbitron text-3xl md:text-5xl font-black text-white uppercase">
                BLOGS <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-white">SECTION</span>
              </h2>
            </div>
            
            <Link href="/blog" className="hidden md:flex items-center gap-3 text-brand-silver hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
              View All Blogs
              <FaArrowRight className="group-hover:translate-x-1 transition-transform text-brand-purple" />
            </Link>
          </div>
        </Reveal>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <Reveal key={post.id} delay={index * 0.1}>
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <article className="bg-[#0b0b0b] border border-white/5 h-full flex flex-col transition-all duration-500 hover:border-brand-purple/50 hover:-translate-y-2 relative overflow-hidden">
                  
                  {/* Image Container */}
                  <div className="relative h-60 w-full overflow-hidden bg-[#151515]">
                    {post.image ? (
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10 font-orbitron text-2xl uppercase font-bold">
                        No Visual
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
                    
                    {/* Date Badge */}
                    <div className="absolute top-0 right-0 bg-[#121212] border-l border-b border-white/10 px-3 py-2 flex items-center gap-2">
                      <FaCalendarAlt className="text-brand-purple text-[10px]" />
                      <span className="font-mono text-[10px] text-brand-silver">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col relative">
                    {/* Decorative Line */}
                    <div className="w-8 h-[2px] bg-brand-purple mb-4 group-hover:w-full transition-all duration-500" />

                    <h3 className="font-orbitron font-bold text-xl text-white mb-3 leading-tight group-hover:text-brand-purple transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-brand-silver text-sm font-light leading-relaxed line-clamp-3 mb-6 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-auto border-t border-white/5 pt-4 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-white/50 group-hover:text-white transition-colors">
                      <span>Read Article</span>
                      <span className="text-brand-purple opacity-0 group-hover:opacity-100 transition-opacity">►</span>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Mobile Button (Visible only on small screens) */}
        <div className="mt-12 text-center md:hidden">
            <Link href="/blog" className="inline-flex items-center gap-2 border border-white/20 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              View Archive
            </Link>
        </div>

      </div>
    </section>
  );
}