"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FaStar } from "react-icons/fa";

export default function MobileGoogleReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5.0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/reviews');
        const data = await res.json();
        
        if (data.reviews) {
          setReviews(data.reviews);
          setRating(data.rating);
          setTotal(data.user_ratings_total);
        }
      } catch (error) {
        console.error("Error fetching reviews", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReviews();
  }, []);

  if (loading) return <div className="w-full h-[200px] flex items-center justify-center text-brand-silver font-saira text-sm">Loading reviews...</div>;
  if (!reviews.length) return null;

  return (
    <div className="w-full mt-8 mb-12">
      
      {/* HEADER */}
      <div className="px-[30px] mb-6 flex justify-between items-end w-full">
        <div>
          <h3 className="text-white font-saira font-bold text-[15px] border-b border-brand-purple/50 pb-1 inline-block">
            Google Verified Reviews
          </h3>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-white font-orbitron font-bold text-lg leading-none">{rating}</span>
             <div className="flex text-[#FFD700] text-sm"><FaStar/><FaStar/><FaStar/><FaStar/><FaStar/></div>
             <span className="text-brand-silver text-[10px] font-saira">({total} reviews)</span>
          </div>
        </div>
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1">
            <Image src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width={16} height={16} />
        </div>
      </div>

      {/* HORIZONTAL REVIEW CAROUSEL */}
      <div className="flex overflow-x-auto gap-4 px-[30px] scroll-pl-[30px] pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {reviews.map((review, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[280px] bg-[#050505] border border-white/10 rounded-2xl p-5 snap-start relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent" />
            
            {/* User Info */}
            <div className="flex items-center gap-3 mb-3">
                <img 
                    src={review.profile_photo_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                    alt={review.author_name} 
                    className="w-10 h-10 rounded-full border border-white/20 object-cover" 
                    referrerPolicy="no-referrer" /* FIX: This bypasses Google's image hotlinking block! */
                />
                <div>
                    <h4 className="text-white font-bold text-[12px] font-saira leading-tight">{review.author_name}</h4>
                    <span className="text-brand-silver text-[9px] font-saira">{review.relative_time_description}</span>
                </div>
            </div>

            {/* Stars */}
            <div className="flex text-[#FFD700] text-[10px] mb-3">
              {[...Array(review.rating)].map((_, i) => <FaStar key={i} />)}
            </div>

            {/* Review Text Formatting */}
            {review.text ? (
                <p className="text-brand-silver text-[11px] font-saira leading-relaxed line-clamp-4">
                   "{review.text}"
                </p>
            ) : (
                <p className="text-brand-silver/50 italic text-[11px] font-saira leading-relaxed">
                   Rated {review.rating} stars by user.
                </p>
            )}
          </div>
        ))}
        <div className="w-[14px] flex-shrink-0" />
      </div>

    </div>
  );
}