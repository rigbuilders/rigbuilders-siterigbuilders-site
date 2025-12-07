export const dynamic = "force-dynamic";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This is a Server Component (fetches data on the server)
export default async function BlogFeedPage() {
  // 1. Fetch all published posts
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      {/* HEADER */}
      <section className="pt-32 pb-12 px-6 text-center 'bg-gradient-to-b' from-[#121212] to-[#1A1A1A]">
        <h1 className="font-orbitron font-black text-5xl mb-4 text-white">
          RIG <span className="text-[#4E2C8B]">INSIGHTS</span>
        </h1>
        <p className="text-[#A0A0A0] max-w-2xl mx-auto">
          Deep dives into hardware, performance guides, and the engineering behind Rig Builders.
        </p>
      </section>

      {/* POSTS GRID */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {posts.length === 0 ? (
            <div className="col-span-3 text-center py-20 text-[#A0A0A0]">
              <p>No articles published yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                <div className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-white/5 hover:border-[#4E2C8B] transition-all h-full flex flex-col">
                  
                  {/* Image Placeholder or Actual Image */}
                  <div className="h-48 bg-[#121212] relative">
                    {post.image ? (
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#4E2C8B]/10 text-[#4E2C8B]">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-2">
                       {post.tags && (
                         <span className="text-[10px] uppercase tracking-wider bg-[#4E2C8B]/20 text-[#4E2C8B] px-2 py-1 rounded">
                           {post.tags.split(',')[0]}
                         </span>
                       )}
                    </div>
                    <h2 className="font-orbitron font-bold text-xl mb-3 group-hover:text-[#4E2C8B] transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-[#A0A0A0] line-clamp-3 mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="text-xs text-[#A0A0A0]/50 mt-auto pt-4 border-t border-white/5 flex justify-between">
                       <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                       <span>Read Article →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}

        </div>
      </section>

      <Footer />
    </main>
  );
}