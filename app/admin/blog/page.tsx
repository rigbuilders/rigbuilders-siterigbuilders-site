"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";

export default function AdminBlogEditor() {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    image: "", 
    tags: "",
    password: "" // Security field
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/blog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
        alert("✅ Blog Post Published Successfully!");
        // Reset form
        setFormData({ ...formData, title: "", content: "", excerpt: "" });
    } else {
        alert(`❌ Error: ${data.error}`);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-orbitron text-3xl font-bold mb-8 text-[#4E2C8B]">Admin Blog Editor</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#1A1A1A] p-8 rounded-xl border border-white/5 shadow-2xl">
            
            {/* Title */}
            <div>
                <label className="block text-xs uppercase text-[#A0A0A0] mb-2">Post Title</label>
                <input 
                    type="text" 
                    required
                    className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white text-xl font-bold focus:border-[#4E2C8B] outline-none"
                    placeholder="e.g. 5 Reasons You Need a Custom PC"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
            </div>

            {/* Image URL */}
            <div>
                <label className="block text-xs uppercase text-[#A0A0A0] mb-2">Cover Image URL</label>
                <input 
                    type="text" 
                    className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                />
            </div>

            {/* Excerpt */}
            <div>
                <label className="block text-xs uppercase text-[#A0A0A0] mb-2">SEO Excerpt (Meta Description)</label>
                <textarea 
                    className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white h-20 focus:border-[#4E2C8B] outline-none"
                    placeholder="Short summary for Google results..."
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                />
            </div>

            {/* Content Body */}
            <div>
                <label className="block text-xs uppercase text-[#A0A0A0] mb-2">Content (HTML Supported)</label>
                <textarea 
                    required
                    className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white h-96 font-mono text-sm focus:border-[#4E2C8B] outline-none"
                    placeholder="<p>Start writing your article here...</p>"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
            </div>

            {/* Tags */}
            <div>
                <label className="block text-xs uppercase text-[#A0A0A0] mb-2">Tags (Comma Separated)</label>
                <input 
                    type="text" 
                    className="w-full bg-[#121212] border border-white/10 rounded p-3 text-white focus:border-[#4E2C8B] outline-none"
                    placeholder="Gaming, Nvidia, Guide"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
            </div>

            {/* Security Check */}
            <div>
                <label className="block text-xs uppercase text-red-400 mb-2">Admin Password</label>
                <input 
                    type="password" 
                    required
                    className="w-full bg-[#121212] border border-red-500/30 rounded p-3 text-white focus:border-red-500 outline-none"
                    placeholder="Enter admin password to publish"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
            </div>

            <button disabled={loading} className="w-full py-4 bg-[#4E2C8B] text-white font-bold rounded hover:bg-white hover:text-black transition-colors">
                {loading ? "Publishing..." : "PUBLISH POST"}
            </button>

        </form>
      </div>
    </main>
  );
}