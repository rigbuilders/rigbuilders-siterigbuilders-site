"use client";
import { useState, useEffect } from "react";
import { FaThumbsUp, FaThumbsDown, FaPaperPlane, FaUserCircle, FaReply, FaCommentDots, FaLock } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js"; // Ensure you have this installed

// --- CONFIGURATION ---
// ⚠️ If you don't have env vars set up yet, the component will fallback to LocalStorage checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface InteractionProps {
    postId: string;
    initialLikes: number;
    initialDislikes: number;
}

export default function BlogInteractions({ postId, initialLikes, initialDislikes }: InteractionProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [dislikes, setDislikes] = useState(initialDislikes);
    const [comments, setComments] = useState<any[]>([]);
    
    // Auth State
    const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Inputs
    const [newComment, setNewComment] = useState("");
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    useEffect(() => {
        // 1. FETCH COMMENTS
        fetch(`/api/blog/interact?postId=${postId}`)
            .then(res => res.json())
            .then(data => setComments(data));

        // 2. ROBUST AUTH CHECKING
        const checkUser = async () => {
            console.log("🔍 Checking Auth Status...");
            let foundUser = null;

            // STRATEGY A: Check Supabase SDK (Most Reliable)
            if (supabaseUrl && supabaseKey) {
                try {
                    const supabase = createClient(supabaseUrl, supabaseKey);
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        console.log("✅ Supabase Session Found!");
                        foundUser = {
                            id: session.user.id,
                            // Try to get name from metadata, fallback to email, then 'Builder'
                            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Builder"
                        };
                    }
                } catch (e) {
                    console.error("Supabase Client Check Failed", e);
                }
            }

            // STRATEGY B: Check LocalStorage manually (Fallback)
            if (!foundUser) {
                console.log("⚠️ No SDK Session. Scanning LocalStorage...");
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    // Supabase keys usually start with 'sb-' and end with '-auth-token'
                    if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
                        try {
                            const raw = localStorage.getItem(key);
                            const parsed = JSON.parse(raw || "{}");
                            if (parsed.user) {
                                console.log("✅ Found Token in LocalStorage:", key);
                                foundUser = {
                                    id: parsed.user.id,
                                    name: parsed.user.user_metadata?.full_name || parsed.user.email?.split('@')[0] || "Builder"
                                };
                                break;
                            }
                        } catch (e) {
                            continue; // Skip invalid JSON
                        }
                    }
                }
            }

            // STRATEGY C: Check Generic 'user' keys (Your custom login logic)
            if (!foundUser) {
                 const simpleUser = localStorage.getItem("user") || localStorage.getItem("userId");
                 if (simpleUser) {
                    // Quick check if it's a JSON string or just an ID
                    if (simpleUser.startsWith("{")) {
                         const parsed = JSON.parse(simpleUser);
                         foundUser = { id: parsed.id || "unknown", name: parsed.name || "Builder" };
                    } else {
                         foundUser = { id: simpleUser, name: localStorage.getItem("userName") || "Builder" };
                    }
                 }
            }

            if (foundUser) {
                setCurrentUser(foundUser);
            } else {
                console.log("❌ No logged in user found via any method.");
            }
            setIsCheckingAuth(false);
        };

        checkUser();
    }, [postId]);

    const handlePostVote = async (type: "LIKE" | "DISLIKE") => {
        if (!currentUser) return alert("Please login to vote.");
        if(type === "LIKE") setLikes(likes + 1);
        else setDislikes(dislikes + 1);
        await fetch("/api/blog/interact", { method: "POST", body: JSON.stringify({ type, postId }) });
    };

    const handleComment = async (parentId: string | null = null, content: string) => {
        if (!currentUser) return; 
        if (!content.trim()) return;

        const tempComment = { 
            id: Date.now().toString(), 
            content: content, 
            author: currentUser.name, 
            createdAt: new Date(), 
            likes: 0, dislikes: 0, replies: [] 
        };

        if (parentId) {
            setComments(comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), tempComment] } : c));
            setActiveReplyId(null);
            setReplyContent("");
        } else {
            setComments([tempComment, ...comments]);
            setNewComment("");
        }

        await fetch("/api/blog/interact", {
            method: "POST",
            body: JSON.stringify({ 
                type: "COMMENT", 
                postId, 
                commentId: parentId, 
                comment: content, 
                author: currentUser.name 
            })
        });
    };

    const CommentItem = ({ c, isReply = false }: { c: any, isReply?: boolean }) => (
        <div className={`p-4 ${isReply ? 'ml-12 border-l-2 border-white/10 mt-2 bg-white/5' : 'bg-[#121212] border border-white/5 mb-4'}`}>
            <div className="flex items-start gap-4">
                <div className="pt-1"><FaUserCircle className="text-3xl text-brand-silver" /></div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-white font-bold font-orbitron text-sm tracking-wider block">{c.author}</span>
                            <span className="text-brand-silver text-[10px] uppercase">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <p className="text-brand-silver font-light text-sm leading-relaxed mb-4">{c.content}</p>
                    {/* Actions */}
                    {currentUser && (
                        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-brand-silver/60">
                             {!isReply && (
                                <button onClick={() => setActiveReplyId(activeReplyId === c.id ? null : c.id)} className="flex items-center gap-2 hover:text-brand-purple transition-colors">
                                    <FaReply /> Reply
                                </button>
                            )}
                        </div>
                    )}
                    {/* Reply Box */}
                    {activeReplyId === c.id && (
                        <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
                             <input className="flex-1 bg-black/30 border border-white/10 p-2 text-white text-xs outline-none focus:border-brand-purple"
                                placeholder={`Reply...`} value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
                            <button onClick={() => handleComment(c.id, replyContent)} className="bg-brand-purple px-4 text-white text-xs font-bold">SEND</button>
                        </div>
                    )}
                </div>
            </div>
            {c.replies && c.replies.length > 0 && (<div className="mt-2">{c.replies.map((reply: any) => <CommentItem key={reply.id} c={reply} isReply={true} />)}</div>)}
        </div>
    );

    if (isCheckingAuth) return null; // Avoid flickering

    

    return (
        <div className="max-w-[1440px] mx-auto px-[30px] py-12 border-t border-white/10">
            {/* VOTES */}
            <div className="flex gap-4 mb-12">
                <button onClick={() => handlePostVote("LIKE")} className={`flex items-center gap-2 border border-white/20 px-6 py-3 transition-all text-white font-orbitron uppercase text-sm ${currentUser ? 'hover:bg-green-500/20 hover:border-green-500' : 'opacity-50'}`}>
                    <FaThumbsUp /> Like <span className="text-brand-silver ml-2">{likes}</span>
                </button>
                <button onClick={() => handlePostVote("DISLIKE")} className={`flex items-center gap-2 border border-white/20 px-6 py-3 transition-all text-white font-orbitron uppercase text-sm ${currentUser ? 'hover:bg-red-500/20 hover:border-red-500' : 'opacity-50'}`}>
                    <FaThumbsDown /> Dislike <span className="text-brand-silver ml-2">{dislikes}</span>
                </button>
            </div>

            <h3 className="font-orbitron text-2xl text-white mb-6">COMMENTS ({comments.length})</h3>
            
            {/* AUTH CHECK UI */}
            {currentUser ? (
                // LOGGED IN
                <div className="bg-[#121212] border border-white/10 p-6 mb-8">
                    <p className="text-xs text-brand-purple uppercase font-bold mb-4 tracking-widest">
                        Posting as: <span className="text-white">{currentUser.name}</span>
                    </p>
                    <div className="flex gap-4">
                        <textarea 
                            className="flex-1 bg-[#1A1A1A] border border-white/10 p-4 text-white text-sm outline-none focus:border-brand-purple resize-none h-24 placeholder:text-white/20"
                            placeholder="Share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button onClick={() => handleComment(null, newComment)} className="bg-brand-purple px-8 text-white font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center">
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            ) : (
                // GUEST
                <div className="bg-[#121212] border border-white/10 p-8 mb-8 text-center flex flex-col items-center justify-center gap-4">
                    <FaLock className="text-brand-silver text-2xl" />
                    <h4 className="text-white font-orbitron text-lg uppercase">Join the Discussion</h4>
                    <p className="text-brand-silver text-sm font-light max-w-md">
                        Login to share your thoughts and interact with others.
                    </p>
                    <Link href="/signin" className="px-8 py-3 border border-white/20 text-white font-bold font-orbitron uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all">
                        Login / Register
                    </Link>
                </div>
            )}

            <div className="space-y-2">
                {comments.map((c: any) => <CommentItem key={c.id} c={c} />)}
            </div>
        </div>
    );
}