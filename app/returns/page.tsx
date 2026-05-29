import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Metadata } from "next";
import Link from "next/link";

// SEO Metadata for Google Search Console
export const metadata: Metadata = {
  title: "Returns & Shipping Policy | Rig Builders",
  description: "Rig Builders shipping policy (5-7 days across India) and our official returns and exchange protocols for defective components.",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />
      
      {/* Page Content */}
      <div className="flex-grow pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
        
        <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white mb-2">
                Returns & <span className="text-[#E6C700]">Shipping</span>
            </h1>
            <p className="text-brand-silver">Official fulfillment and RMA guidelines for Rig Builders.</p>
        </div>
        
        <div className="space-y-8 text-brand-silver">
          
          {/* 1. SHIPPING POLICY */}
          <section className="bg-[#1A1A1A] p-8 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#E6C700]"></div>
            <h2 className="font-orbitron text-2xl font-bold text-white mb-4 uppercase">Shipping Policy</h2>
            <p className="leading-relaxed mb-4">
              We currently fulfill and ship orders exclusively within <strong>India</strong>. Our logistics team ensures your premium PC components and custom pre-built systems are securely packaged with industrial-grade protection before dispatch.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Delivery Timeframes:</strong> Standard shipping takes between <strong>5 to 7 business days</strong> depending on your regional pin code.</li>
              <li><strong>Order Processing:</strong> Processing begins immediately upon payment confirmation. Custom PC builds may require additional assembly and stress-testing time prior to the 5-7 day shipping window.</li>
            </ul>
          </section>

          {/* 2. RETURNS POLICY (DEFECTIVE ONLY) */}
          <section className="bg-[#1A1A1A] p-8 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <h2 className="font-orbitron text-2xl font-bold text-white mb-4 uppercase">Returns Policy</h2>
            <p className="leading-relaxed mb-6">
              Due to the sensitive, high-value, and easily compromised nature of custom PC hardware, we maintain a strict returns protocol to ensure inventory integrity for all our customers.
            </p>
            
            {/* --- MANDATORY UNBOXING WARNING --- */}
            <div className="bg-[#E6C700]/10 border border-[#E6C700]/30 p-6 rounded-lg mb-6 shadow-[0_0_15px_rgba(230,199,0,0.05)]">
              <strong className="text-[#E6C700] block mb-2 uppercase font-orbitron text-lg tracking-wider flex items-center gap-2">
                ⚠️ Mandatory Unboxing Video
              </strong>
              <p className="text-sm text-white/90 leading-relaxed">
                An uncut, unedited unboxing video is <strong>strictly required</strong> to claim any transit damage, missing items, or out-of-the-box defects. The video must clearly show the shipping label, the sealed package from all sides before opening, and the condition of the internal components upon extraction. <strong>Claims submitted without valid unboxing footage will be automatically rejected.</strong>
              </p>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-4 text-white">
              <strong className="text-red-400 block mb-1 uppercase font-orbitron text-sm">Condition for Returns:</strong>
              <p className="text-sm">We <strong>only accept returns for defective products</strong>. If you receive a component or system that is dead on arrival (DOA) or suffers from a manufacturing defect out of the box (verified by your unboxing video), you are eligible for an RMA (Return Merchandise Authorization).</p>
            </div>
            
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>We do not accept returns for "buyer's remorse," opened seals on working items, or physical damage caused by improper user installation (e.g., bent CPU pins).</li>
              <li>Incompatibility issues (e.g., buying an Intel motherboard for an AMD processor) are not eligible for returns. Please ensure compatibility before purchasing.</li>
            </ul>
          </section>

          {/* 3. EXCHANGES */}
          <section className="bg-[#1A1A1A] p-8 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple"></div>
            <h2 className="font-orbitron text-2xl font-bold text-white mb-4 uppercase">Exchanges</h2>
            <p className="leading-relaxed mb-4">
              We gladly <strong>accept exchanges</strong> for eligible defective items. 
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>If your product is proven defective by our technicians, we will facilitate a direct exchange for a working replacement of the exact same model.</li>
              <li>Exchanges are subject to inventory availability. If the exact item is currently out of stock, we will offer an equivalent replacement or process a refund.</li>
            </ul>
          </section>

          {/* 4. RMA PROCESS */}
          <section className="bg-[#1A1A1A] p-8 rounded-xl border border-white/5 relative overflow-hidden">
            <h2 className="font-orbitron text-2xl font-bold text-white mb-4 uppercase">Initiating a Request</h2>
            <p className="leading-relaxed mb-4">
              To request a return or exchange for a defective item, please contact our support team within 48 hours of delivery. 
            </p>
            <ol className="list-decimal pl-5 space-y-3 text-sm">
              <li>Navigate to our <Link href="/support" className="text-[#E6C700] hover:underline font-bold">Support Portal</Link> or email our help desk.</li>
              <li>Provide your Order ID, a detailed description of the defect, and attach your <strong>mandatory unboxing video</strong> along with clear photographic evidence.</li>
              <li>Once your claim is approved, we will provide you with an RMA number and instructions for securely shipping the component back to our facility.</li>
            </ol>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}