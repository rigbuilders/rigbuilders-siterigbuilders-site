import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { StaggerGrid, StaggerItem, Reveal } from "@/components/ui/MotionWrappers"; // Ensure this path is correct
import { FaArrowRight } from "react-icons/fa";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: "Rig Insights | Hardware Guides & Performance Deep Dives",
  description: "Expert advice on custom PC building, hardware benchmarks, and thermal engineering.",
  openGraph: {
    images: ["/images/og-blog.jpg"],
  }
};

export default async function BlogFeedPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira relative overflow-hidden">
      {/* Background FX */}
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] pointer-events-none z-0" />

      <Navbar />
      
      {/* HERO HEADER */}
      <section className="relative pt-20 pb-20 px-6 text-center border-b border-white/5 z-10">
        <Reveal>
            <span className="text-brand-purple font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                Engineering Logs
            </span>
            <h1 className="font-orbitron font-black text-6xl md:text-8xl mb-6 text-white uppercase tracking-tighter">
              RIG <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4E2C8B] to-[#924dbf]">INSIGHTS</span>
            </h1>
            <p className="text-brand-silver max-w-2xl mx-auto text-lg font-light leading-relaxed">
              Deep dives into hardware architecture, thermal performance, and the craftsmanship behind the build.
            </p>
        </Reveal>
      </section>

      {/* POSTS GRID */}
      <section className="max-w-[1600px] mx-auto px-6 py-20 relative z-10">
        {posts.length === 0 ? (
            <div className="text-center py-20 text-brand-silver border border-dashed border-white/10">
              <p className="font-orbitron">BLOGS COMING SOON</p>
            </div>
        ) : (
            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {posts.map((post) => (
                <StaggerItem key={post.id} className="h-full">
                  <Link href={`/blog/${post.slug}`} className="group block h-full">
                    <article className="bg-[#0a0a0a] border border-white/10 hover:border-brand-purple/50 transition-all duration-500 h-full flex flex-col relative overflow-hidden">
                      
                      {/* Image Container - Huge & Sharp */}
                      <div className="relative h-[400px] w-full overflow-hidden border-b border-white/5">
                        {post.image ? (
                          <img 
                            src={post.image} 
                            alt={post.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#151515] text-white/20 font-orbitron text-xl">
                            NO VISUAL
                          </div>
                        )}
                        
                        {/* Overlay Gradient on Image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
                        
                        {/* Floating Date Badge */}
                        <div className="absolute top-0 right-0 bg-[#121212] border-l border-b border-white/10 px-4 py-2">
                            <span className="font-orbitron text-xs font-bold text-brand-silver">
                                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8 flex-1 flex flex-col relative">
                        <div className="mb-4">
                           {post.tags && (
                             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-purple">
                               {post.tags.split(',')[0]}
                             </span>
                           )}
                        </div>
                        
                        <h2 className="font-orbitron font-bold text-3xl mb-4 leading-tight text-white group-hover:text-brand-purple transition-colors">
                          {post.title}
                        </h2>
                        
                        <p className="text-brand-silver/70 text-sm leading-loose line-clamp-3 mb-8 flex-1 font-light">
                          {post.excerpt}
                        </p>
                        
                        <div className="mt-auto flex items-center gap-3 text-white text-xs font-bold uppercase tracking-widest group-hover:gap-5 transition-all duration-300">
                           <span>Read Transmission</span>
                           <FaArrowRight className="text-brand-purple" />
                        </div>
                      </div>
                    </article>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGrid>
        )}
      </section>

      <Footer />
    </main>
  );
}