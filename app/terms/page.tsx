import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaGavel, FaUndo, FaTools, FaBan, FaShippingFast } from "react-icons/fa";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & Warranty Policy", 
  description: "Read our official warranty terms, replacement policies, and service agreements.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />

      {/* --- HERO HEADER --- */}
      <section className="pt-[50px] pb-12 px-6 border-b border-white/5 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/5 blur-[150px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <Reveal>
            <h1 className="font-orbitron font-bold text-4xl md:text-5xl mb-4 tracking-tighter text-white">
              TERMS & <span className="text-brand-purple">CONDITIONS</span>
            </h1>
            <p className="text-brand-silver font-saira tracking-wide text-sm md:text-base">
              Usage Policy, Returns, and Warranty Contracts
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col gap-16">
        
        {/* 1. GENERAL */}
        <TermSection icon={<FaGavel />} title="1. Build Commission Agreement">
            <p className="mb-4">
                By placing an order with Rig Builders, you are commissioning a custom service. 
                Unlike off-the-shelf electronics, your machine is hand-assembled to your specific configuration. 
                Once the status of your order moves to <strong>"Procurement"</strong> or <strong>"Assembly"</strong>, the components are allocated specifically to you.
            </p>
        </TermSection>

        {/* 2. CANCELLATION & RETURNS (CRITICAL SECTION) */}
        <TermSection icon={<FaBan />} title="2. Cancellations & Returns">
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-lg mb-4">
                <h4 className="font-bold text-red-400 mb-2 font-orbitron text-sm uppercase">Strict Return Policy</h4>
                <p className="text-sm text-brand-silver">
                    Due to the custom nature of our products, <strong>we do not accept returns or refunds for "Change of Mind"</strong> once the PC has been built or shipped.
                </p>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-brand-silver text-sm">
                <li><strong>Pre-Build Cancellation:</strong> You may cancel your order for a full refund within 24 hours of placement, provided the status is still "Payment Received".</li>
                <li><strong>Mid-Build Cancellation:</strong> If you cancel after "Procurement" has begun but before shipping, a <strong>15% restocking fee</strong> will be deducted to cover component allocation costs.</li>
                <li><strong>Dead on Arrival (DOA):</strong> If your system arrives damaged or non-functional, you must notify us within <strong>48 hours</strong> of delivery. We will arrange a free pickup, replace the defective component, and ship it back to you at no cost.</li>
            </ul>
        </TermSection>

        {/* 3. WARRANTY */}
        <TermSection icon={<FaTools />} title="3. Warranty Protocol">
            <p className="mb-4">
                Every Rig Builders PC comes with a <strong>3-Year Service Warranty</strong> in addition to the individual manufacturer warranties of the components.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-brand-silver text-sm">
                <li><strong>Scope:</strong> Covers diagnosis, labor, and component replacement facilitation.</li>
                <li><strong>Voiding Warranty:</strong> Overclocking beyond safe limits, physical damage, liquid damage, or unauthorized modifications to the internal hardware (like swapping the PSU or Motherboard) may void your service warranty.</li>
                <li><strong>Shipping Costs:</strong> During the first 30 days, we cover two-way shipping for repairs. After 30 days, the customer bears the cost of shipping the system to our service center.</li>
            </ul>
        </TermSection>

        {/* 4. SHIPPING */}
        <TermSection icon={<FaShippingFast />} title="4. Shipping & Liability">
            <p>
                We use premium courier partners and insured shipping. However, Rig Builders is not liable for delays caused by logistics partners or Force Majeure events. 
                Customers are advised to record an <strong>Unboxing Video</strong> to claim insurance in case of transit damage. Without video proof of unboxing, physical damage claims may be rejected.
            </p>
        </TermSection>

        {/* 5. PAYMENTS */}
        <TermSection icon={<FaUndo />} title="5. Payment & Pricing">
            <p>
                Prices listed are inclusive of GST. In the rare event of a pricing error on the website, Rig Builders reserves the right to cancel the order and issue a full refund. Payment gateway charges (if any) are non-refundable in case of customer-initiated cancellations.
            </p>
        </TermSection>

      </div>
      <Footer />
    </div>
  );
}

// Helper Component
function TermSection({ icon, title, children }: any) {
    return (
        <Reveal>
            <div className="relative pl-8 border-l border-white/10 hover:border-brand-purple transition-colors duration-300">
                <div className="absolute -left-3 top-0 bg-[#121212] p-1 text-brand-purple text-xl">
                    {icon}
                </div>
                <h3 className="font-orbitron text-2xl font-bold text-white mb-4 pl-4">
                    {title}
                </h3>
                <div className="pl-4 text-brand-silver leading-relaxed">
                    {children}
                </div>
            </div>
        </Reveal>
    );
}