import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

// FIX: 'params' is now a Promise in Next.js 15+
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 1. Await the params to get the slug
  const { slug } = await params;

  // 2. Fetch the specific post
  const post = await prisma.post.findUnique({
    where: { slug: slug },
  });

  // 3. If not found, show 404
  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      {/* ARTICLE HEADER */}
      <section className="pt-32 pb-12 px-6 bg-[#1A1A1A] border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 flex justify-center gap-2">
                {post.tags?.split(',').map((tag, i) => (
                    <span key={i} className="text-xs uppercase tracking-widest bg-[#4E2C8B] px-3 py-1 rounded-full">
                        {tag.trim()}
                    </span>
                ))}
            </div>
            <h1 className="font-orbitron font-black text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
                {post.title}
            </h1>
            <p className="text-[#A0A0A0] text-sm">
                By {post.author} • {new Date(post.createdAt).toLocaleDateString()}
            </p>
        </div>
      </section>

      {/* ARTICLE CONTENT */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        {post.image && (
            <img src={post.image} alt={post.title} className="w-full h-auto rounded-2xl mb-12 border border-white/10" />
        )}
        
        {/* Render HTML Content safely */}
        <div 
            className="prose prose-invert prose-lg max-w-none prose-headings:font-orbitron prose-headings:text-white prose-p:text-[#D0D0D0] prose-a:text-[#4E2C8B]"
            dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </article>

      <Footer />
    </main>
  );
}