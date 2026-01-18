"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect, useRef } from "react";
import { 
  FaBold, FaImage, FaLink, FaHeading, FaCode, FaEye, FaPen, FaTrash, FaPlus, FaSave,
  FaThumbsUp, FaThumbsDown, FaCommentAlt, FaTimes, FaUser // <--- Added FaTimes, FaUser
} from "react-icons/fa";

export default function AdminBlogEditor() {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [posts, setPosts] = useState<any[]>([]); 
  const [editingId, setEditingId] = useState<string | null>(null); 
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "", 
    content: "",
    excerpt: "",
    image: "", 
    tags: "",
    // NEW: Stats containers
    likes: 0,
    dislikes: 0,
    commentsCount: 0
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch("/api/blog/manage");
    const data = await res.json();
    if (res.ok) setPosts(data);
  };



  const handleCreateNew = () => {
      setEditingId(null);
      setFormData({ 
          title: "", slug: "", content: "", excerpt: "", image: "", tags: "",
          likes: 0, dislikes: 0, commentsCount: 0 
      });
  };

  const handleDelete = async () => {
      if (!editingId || !confirm("Are you sure you want to delete this transmission?")) return;
      setLoading(true);
      await fetch(`/api/blog/manage?id=${editingId}`, { method: "DELETE" });
      fetchPosts();
      handleCreateNew();
      setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId ? "/api/blog/manage" : "/api/blog/create";
    const method = editingId ? "PUT" : "POST";
    // We filter out the stats so we don't accidentally overwrite them with 0
    const { likes, dislikes, commentsCount, ...payloadData } = formData;
    const payload = editingId ? { ...payloadData, id: editingId } : payloadData;

    const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
        alert(editingId ? "✅ Post Updated!" : "✅ Post Published!");
        fetchPosts(); 
        if (!editingId) handleCreateNew(); 
    } else {
        alert(`❌ ERROR: ${data.error}`);
    }
    setLoading(false);
  };

  // Helper: Insert HTML tags
  const insertTag = (startTag: string, endTag: string = "") => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + startTag + selectedText + endTag + text.substring(end);
    setFormData({ ...formData, content: newText });
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 0);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value;
      if (!editingId) {
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          setFormData({ ...formData, title, slug });
      } else {
          setFormData({ ...formData, title });
      }
  };

  // --- NEW: Comment Management Logic ---
  const [showComments, setShowComments] = useState(false);
  const [postComments, setPostComments] = useState<any[]>([]);

  // Fetch comments for a specific post
  const fetchComments = async (id: string) => {
      const res = await fetch(`/api/blog/interact?postId=${id}`);
      const data = await res.json();
      setPostComments(data);
  };

  // Delete comment handler
  const handleDeleteComment = async (commentId: string) => {
      if(!confirm("Delete this comment and all its replies?")) return;
      
      const res = await fetch(`/api/blog/interact?commentId=${commentId}`, { method: "DELETE" });
      if (res.ok) {
          if (editingId) fetchComments(editingId); // Refresh list
          setFormData(prev => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) })); // Update counter
      } else {
          alert("Failed to delete comment");
      }
  };

  const handleEditClick = (post: any) => {
    setEditingId(post.id);
    
    setFormData({
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "", 
        excerpt: post.excerpt || "",
        image: post.image || "",
        tags: post.tags || "",
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        commentsCount: post._count?.comments || 0
    });

    // NEW: Fetch comments and reset view
    fetchComments(post.id);
    setShowComments(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 max-w-[1920px] mx-auto w-full pt-20">
        
        {/* SIDEBAR: POST LIST */}
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 hidden lg:flex flex-col h-[calc(100vh-80px)] sticky top-20">
            <div className="p-4 border-b border-white/10">
                <button onClick={handleCreateNew} className="w-full py-3 bg-brand-purple text-white font-bold font-orbitron text-xs flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
                    <FaPlus /> NEW TRANSMISSION
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {posts.map(post => (
                    <button 
                        key={post.id} 
                        onClick={() => handleEditClick(post)}
                        className={`w-full text-left p-3 text-xs font-mono truncate border-l-2 transition-all flex justify-between items-center group ${editingId === post.id ? "border-brand-purple bg-white/5 text-white" : "border-transparent text-brand-silver hover:text-white"}`}
                    >
                        <span className="truncate flex-1">{post.title}</span>
                        {/* Tiny engagement indicator in list */}
                        <span className="text-[9px] opacity-40 group-hover:opacity-100 flex gap-1">
                            <FaThumbsUp size={8}/> {post.likes || 0}
                        </span>
                    </button>
                ))}
            </div>
        </aside>

        {/* MAIN EDITOR */}
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                {/* HEADER with LIVE TELEMETRY */}
                <div className="flex flex-col gap-6 mb-8 border-b border-white/10 pb-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-brand-purple font-bold tracking-[0.2em] text-xs uppercase block mb-2">
                                {editingId ? "EDITING MODE" : "NEW ENTRY"}
                            </span>
                            <h1 className="font-orbitron text-3xl md:text-4xl font-black text-white uppercase">
                                {editingId ? "UPDATE LOG" : "INITIATE LOG"}
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            {editingId && (
                                <button onClick={handleDelete} className="flex items-center gap-2 border border-red-500/50 text-red-500 px-4 py-2 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase">
                                    <FaTrash /> Delete
                                </button>
                            )}
                            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all text-xs font-bold uppercase">
                                {showPreview ? <><FaPen /> Edit</> : <><FaEye /> Preview</>}
                            </button>
                        </div>
                    </div>

        {/* NEW: ENGAGEMENT DASHBOARD */}
                    {editingId && (
                        <div className="flex flex-col gap-4 bg-white/5 border border-white/10 rounded-sm p-4">
                            {/* Stats Row */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 px-4 border-r border-white/10">
                                    <FaThumbsUp className="text-green-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold font-orbitron leading-none">{formData.likes}</span>
                                        <span className="text-[9px] uppercase tracking-widest text-brand-silver">Likes</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 border-r border-white/10">
                                    <FaThumbsDown className="text-red-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold font-orbitron leading-none">{formData.dislikes}</span>
                                        <span className="text-[9px] uppercase tracking-widest text-brand-silver">Dislikes</span>
                                    </div>
                                </div>
                                
                                {/* MANAGE COMMENTS TOGGLE */}
                                <button 
                                    onClick={() => setShowComments(!showComments)}
                                    className={`flex items-center gap-3 px-6 py-2 ml-auto transition-all uppercase text-xs font-bold tracking-widest border border-white/10 ${showComments ? 'bg-brand-purple text-white border-brand-purple' : 'hover:bg-white/10 text-brand-silver'}`}
                                >
                                    <FaCommentAlt />
                                    <span>{formData.commentsCount} Comments</span>
                                    <span className="ml-2 opacity-50">{showComments ? "▼" : "▶"}</span>
                                </button>
                            </div>

                            {/* COMMENT MANAGER PANEL (Expands when clicked) */}
                            {showComments && (
                                <div className="bg-[#0a0a0a] border-t border-white/10 pt-4 mt-2 animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-brand-silver text-[10px] uppercase font-bold mb-4 tracking-widest">Recent Discussions</h3>
                                    
                                    {postComments.length === 0 ? (
                                        <p className="text-white/20 text-xs italic p-4 text-center">No comments found on this post.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {postComments.map((comment) => (
                                                <div key={comment.id} className="bg-[#151515] border border-white/5 p-3 flex justify-between items-start group hover:border-brand-purple/30 transition-all">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FaUser className="text-brand-purple text-[10px]" />
                                                            <span className="text-white text-xs font-bold">{comment.author}</span>
                                                            <span className="text-white/30 text-[10px] mono">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-brand-silver text-xs font-light leading-relaxed">{comment.content}</p>
                                                        
                                                        {/* Replies Preview */}
                                                        {comment.replies && comment.replies.length > 0 && (
                                                            <div className="mt-2 pl-3 border-l border-white/10 space-y-1">
                                                                {comment.replies.map((r: any) => (
                                                                     <div key={r.id} className="text-[10px] text-white/40 flex justify-between items-center hover:text-white/60">
                                                                        <span className="truncate max-w-[300px]">↳ <b>{r.author}:</b> {r.content}</span>
                                                                        <button onClick={() => handleDeleteComment(r.id)} className="text-red-500 hover:text-red-400 px-2"><FaTimes size={10} /></button>
                                                                     </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-white/20 hover:text-red-500 hover:bg-red-500/10 p-2 rounded transition-all ml-4"
                                                        title="Delete Thread"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* EDITING FORM */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT SETTINGS */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#0a0a0a] p-6 border border-white/10 space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase text-brand-purple font-bold mb-2">Title</label>
                                <input type="text" className="w-full bg-[#151515] border border-white/10 p-3 text-white text-sm" value={formData.title} onChange={handleTitleChange} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-brand-silver font-bold mb-2">Slug</label>
                                <input type="text" className="w-full bg-[#151515] border border-white/10 p-2 text-brand-silver/50 text-xs font-mono" value={formData.slug} readOnly={!!editingId} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-brand-silver font-bold mb-2">Cover Image</label>
                                <input type="text" className="w-full bg-[#151515] border border-white/10 p-3 text-white text-sm" placeholder="/images/blog/..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-brand-silver font-bold mb-2">Tags</label>
                                <input type="text" className="w-full bg-[#151515] border border-white/10 p-3 text-white text-sm" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-brand-silver font-bold mb-2">Excerpt</label>
                                <textarea className="w-full bg-[#151515] border border-white/10 p-3 text-white text-sm h-24 resize-none" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} />
                            </div>
                        </div>
                        <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-white text-black font-bold font-orbitron uppercase hover:bg-brand-purple hover:text-white transition-all text-sm flex items-center justify-center gap-2">
                            {loading ? "Processing..." : <><FaSave /> {editingId ? "Update Post" : "Publish Post"}</>}
                        </button>
                    </div>

                    {/* RIGHT EDITOR */}
                    <div className="lg:col-span-2 flex flex-col h-[600px]">
                        {!showPreview && (
                            <div className="bg-[#1A1A1A] border border-white/10 border-b-0 p-2 flex gap-2 flex-wrap">
                                <button onClick={() => insertTag("<h2>", "</h2>")} className="p-2 hover:bg-brand-purple/20 text-xs font-bold flex gap-1"><FaHeading /> H2</button>
                                <button onClick={() => insertTag("<b>", "</b>")} className="p-2 hover:bg-brand-purple/20 text-xs font-bold flex gap-1"><FaBold /> B</button>
                                <div className="w-[1px] h-4 bg-white/10 mx-1 self-center"></div>
                                <button onClick={() => insertTag('<a href="#" class="text-brand-purple hover:underline">', '</a>')} className="p-2 hover:bg-brand-purple/20 text-brand-purple text-xs font-bold flex gap-1"><FaLink /> Link</button>
                                <button onClick={() => insertTag('<img src="/images/blog/NAME.jpg" class="w-full border border-white/10 my-8" />')} className="p-2 hover:bg-brand-purple/20 text-green-400 text-xs font-bold flex gap-1"><FaImage /> Img</button>
                            </div>
                        )}
                        <div className="flex-grow bg-[#0a0a0a] border border-white/10 relative overflow-hidden">
                            {showPreview ? (
                                <div className="prose prose-invert prose-lg max-w-none p-8 h-full overflow-y-auto font-saira prose-headings:font-orbitron prose-headings:text-white prose-a:text-brand-purple prose-img:rounded-none" dangerouslySetInnerHTML={{ __html: formData.content }} />
                            ) : (
                                <textarea ref={contentRef} className="w-full h-full bg-transparent p-6 text-white font-mono text-sm outline-none resize-none leading-relaxed" placeholder="HTML Content..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}