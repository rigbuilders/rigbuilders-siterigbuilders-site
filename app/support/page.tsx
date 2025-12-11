"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SupportPage() {
  return (
    <div className="bg-[#121212] min-h-screen text-white font-saira flex flex-col">
      <Navbar />
      
      <div className="flex-grow pt-32 pb-12 px-[80px] 2xl:px-[100px]">
        <div className="max-w-4xl mx-auto text-center mb-16">
           <h1 className="font-orbitron text-4xl font-bold mb-4">HOW CAN WE HELP?</h1>
           <p className="text-brand-silver">Our specialized team is here to assist with your rig.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
           {/* Card 1 */}
           <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-xl hover:border-brand-purple/50 transition-colors text-center">
              <h3 className="font-orbitron text-xl font-bold mb-4">Technical Support</h3>
              <p className="text-brand-silver text-sm mb-6">Facing issues with your build? Raise a ticket with our engineering team.</p>
              <button className="border border-white text-white px-6 py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-all">
                 Raise Ticket
              </button>
           </div>

           {/* Card 2 */}
           <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-xl hover:border-brand-purple/50 transition-colors text-center">
              <h3 className="font-orbitron text-xl font-bold mb-4">Sales Inquiry</h3>
              <p className="text-brand-silver text-sm mb-6">Need help configuring your dream PC? Talk to an expert.</p>
              <button className="border border-white text-white px-6 py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-all">
                 Contact Sales
              </button>
           </div>

           {/* Card 3 */}
           <div className="bg-[#1A1A1A] p-8 border border-white/5 rounded-xl hover:border-brand-purple/50 transition-colors text-center">
              <h3 className="font-orbitron text-xl font-bold mb-4">Warranty Claim</h3>
              <p className="text-brand-silver text-sm mb-6">Process a warranty claim for your components or desktop.</p>
              <button className="border border-white text-white px-6 py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-all">
                 Claim Warranty
              </button>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}