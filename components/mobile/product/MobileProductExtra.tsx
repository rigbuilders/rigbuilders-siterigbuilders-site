import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { FaStar } from "react-icons/fa";

export default function MobileProductExtra({ product, related, reviews, user, setReviews }: any) {
  const [newRev, setNewRev] = useState("");

  const submitReview = async (e: any) => {
      e.preventDefault();
      if (!user) return toast.error("Login Required", { description: "Please sign in to leave a review." });
      
      const { error } = await supabase.from('reviews').insert({ 
          product_id: product.id, user_id: user.id, user_name: user.user_metadata.full_name || "Verified Builder", rating: 5, comment: newRev 
      });
      
      if (!error) {
          setNewRev(""); toast.success("Review Posted");
          supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false }).then(res => { if (res.data) setReviews(res.data); });
      }
  };

  return (
    <div className="px-6 pb-12 pt-8 space-y-10 bg-[#050505]">
        
        {/* 7. DESCRIPTION */}
        <div>
            <h3 className="font-orbitron font-bold text-white text-sm uppercase tracking-widest mb-4">Description</h3>
            <p className="text-[#A0A0A0] text-xs leading-relaxed whitespace-pre-line font-saira">{product.description}</p>
        </div>

        {/* 8. RELATED GEAR */}
        {related.length > 0 && (
            <div>
                <h3 className="font-orbitron font-bold text-white text-sm uppercase tracking-widest mb-4">Related Gear</h3>
                <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden pb-4">
                    {related.map((r: any) => (
                        <Link href={`/m/product/${r.id}`} key={r.id} className="w-[140px] shrink-0 snap-start bg-[#1A1A1A] border border-white/5 p-3 rounded-xl active:scale-95 transition-transform">
                            <div className="h-20 flex items-center justify-center mb-2 bg-[#050505] rounded border border-white/5"><img src={r.image_url} className="max-h-full object-contain"/></div>
                            <h4 className="text-[10px] font-bold text-white truncate mb-1">{r.name}</h4>
                            <p className="text-[9px] text-[#B084FF] font-bold font-orbitron tracking-wider">₹{r.price.toLocaleString()}</p>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        {/* 9. REVIEWS */}
        <div>
            <h3 className="font-orbitron font-bold text-white text-sm uppercase tracking-widest mb-4">Reviews ({reviews.length})</h3>
            <form onSubmit={submitReview} className="mb-6 flex gap-2">
                <input value={newRev} onChange={e=>setNewRev(e.target.value)} required placeholder="Write a review..." className="flex-grow bg-[#1A1A1A] text-xs p-3 rounded-xl border border-white/10 text-white outline-none focus:border-[#B084FF]" />
                <button className="bg-[#4E2C8B] text-white px-4 text-xs font-bold rounded-xl uppercase active:scale-95 transition-transform">Post</button>
            </form>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
                {reviews.length === 0 ? <p className="text-[10px] text-center text-[#A0A0A0] py-4">No reviews yet.</p> : reviews.map((r: any) => (
                    <div key={r.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between mb-1">
                            <span className="text-[11px] font-bold text-white font-orbitron">{r.user_name}</span>
                            <span className="text-[8px] text-[#A0A0A0]">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-[#FFD700] text-[8px] mb-2"><FaStar/><FaStar/><FaStar/><FaStar/><FaStar/></div>
                        <p className="text-[10px] text-[#A0A0A0] leading-relaxed">{r.comment}</p>
                    </div>
                ))}
            </div>
        </div>

    </div>
  );
}