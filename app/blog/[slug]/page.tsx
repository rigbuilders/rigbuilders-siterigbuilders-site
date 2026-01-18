import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/MotionWrappers";
import BlogInteractions from "@/components/BlogInteractions";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// ENHANCED SEO METADATA GENERATOR
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  // Fetch strictly what we need for SEO
  const post = await prisma.post.findUnique({
    where: { slug: slug },
    select: { title: true, excerpt: true, image: true, createdAt: true, tags: true }
  });

  if (!post) return { title: "Article Not Found | Rig Builders" };

  // Convert tags string "GPU, Nvidia, Review" -> Array ["GPU", "Nvidia", "Review"]
  const keywordsList = post.tags ? post.tags.split(',').map(tag => tag.trim()) : [];

  return {
    title: post.title,
    description: post.excerpt,
    
    // 1. KEYWORDS (Generated from your tags)
    keywords: keywordsList, 

    // 2. CANONICAL URL (Prevents duplicate content issues)
    alternates: {
      canonical: `https://www.rigbuilders.in/blog/${slug}`,
    },

    // 3. AUTHOR & ROBOTS
    authors: [{ name: "Rig Builders Team" }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },

    // 4. SOCIAL MEDIA CARDS
    openGraph: {
      title: post.title,
      description: post.excerpt || "Read this transmission on Rig Builders.",
      url: `https://www.rigbuilders.in/blog/${slug}`,
      siteName: "Rig Builders India",
      images: [
        {
          url: post.image || "/images/og-blog.jpg", // Fallback image
          width: 1200,
          height: 630,
        },
      ],
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      tags: keywordsList,
    },
    
    // 5. TWITTER CARD (Specific for X/Twitter)
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: [post.image || "/images/og-blog.jpg"],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const post = await prisma.post.findUnique({
    where: { slug: slug },
  });

  if (!post) notFound();

  // NOTE: Server-side 'currentUser' check removed. 
  // The <BlogInteractions> component now handles login checks via Local Storage on the client side.

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      {/* --- CINEMATIC HERO SECTION --- */}
      <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden border-b border-white/10">
        {/* Background Image */}
        {post.image ? (
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${post.image})` }}
            />
        ) : (
            <div className="absolute inset-0 bg-[#1A1A1A]" />
        )}
        
        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-black/60" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end pb-12">
            <div className="max-w-[1440px] mx-auto px-[30px] w-full">
                <Reveal>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-brand-silver text-xs uppercase tracking-widest font-bold">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    
                    <h1 className="font-orbitron font-black text-4xl md:text-6xl lg:text-7xl leading-none mb-6 text-white drop-shadow-2xl uppercase max-w-4xl">
                        {post.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 border-t border-white/20 pt-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-brand-silver uppercase tracking-widest">Author</span>
                            <span className="text-xs font-bold text-white uppercase">{post.author || "Rig Builders Team"}</span>
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
      </div>

{/* --- ARTICLE CONTENT --- */}
      {/* Added 'py-16' (vertical padding) so it doesn't stick to the top/bottom */}
      <article className="w-full relative z-10 py-16">
        <Reveal delay={0.2}>
            <div 
                // ADDED: Container constraints to fix left/right sticking
                className="max-w-[1440px] mx-auto px-[30px] 
                prose prose-invert prose-lg md:prose-xl max-w-none 
                prose-headings:font-orbitron prose-headings:font-bold prose-headings:text-white prose-headings:uppercase
                prose-p:text-brand-silver prose-p:leading-loose prose-p:font-light
                prose-a:text-brand-purple prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-bold
                prose-img:rounded-none prose-img:border prose-img:border-white/10
                prose-blockquote:border-l-brand-purple prose-blockquote:text-white prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic"
                dangerouslySetInnerHTML={{ __html: post.content }} 
            />
        </Reveal>
      </article>

      {/* --- NEW: LIKE, DISLIKE & COMMENTS --- */}
      <div className="relative z-10">
        <Reveal>
          {/* UPDATED: Removed 'currentUser' prop. Auth is now handled inside this component. */}
          <BlogInteractions 
              postId={post.id} 
              initialLikes={post.likes} 
              initialDislikes={post.dislikes}
          />
        </Reveal>
      </div>

      {/* FOOTER NAV / CTA */}
      <div className="border-t border-white/5 bg-[#0a0a0a] py-20 text-center">
         <Reveal>
             <h3 className="font-orbitron text-2xl text-white mb-6">READY TO BUILD?</h3>
             <a href="/configure" className="inline-block border border-white px-8 py-4 text-xs font-bold font-orbitron uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                 Configure Your Rig
             </a>
         </Reveal>
      </div>        

      <Footer />
    </main>
  );
}