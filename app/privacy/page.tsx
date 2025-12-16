"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaShieldAlt, FaUserSecret, FaLock, FaCookie } from "react-icons/fa";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />

      {/* --- HERO HEADER --- */}
      <section className="pt-12 pb-12 px-6 border-b border-white/5 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-purple/5 blur-[150px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <Reveal>
            <h1 className="font-orbitron font-bold text-4xl md:text-5xl mb-4 tracking-tighter text-white">
              PRIVACY <span className="text-brand-purple">PROTOCOLS</span>
            </h1>
            <p className="text-brand-silver font-saira tracking-wide text-sm md:text-base">
        
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col gap-12">
        
        <Reveal>
            <div className="bg-[#1A1A1A] p-8 border-l-4 border-brand-purple rounded-r-lg">
                <p className="text-lg leading-relaxed text-white/90">
                    At Rig Builders, we treat your data with the same security standards as our hardware configurations. 
                    We collect only what is necessary to commission, build, and deliver your machine. 
                    We do not sell, trade, or leak your personal information to data brokers.
                </p>
            </div>
        </Reveal>

        {/* SECTION 1 */}
        <Section 
            icon={<FaUserSecret />}
            title="1. Data Extraction" 
            content="When you configure a rig or create an account, we collect specific identifiers required for fulfillment. This includes your Full Name, Shipping/Billing Address, Email Address (for order updates), and Phone Number (for secure delivery coordination). We do not store your raw payment details; these are handled securely by our payment processor (Razorpay)."
        />

        {/* SECTION 2 */}
        <Section 
            icon={<FaLock />}
            title="2. Security Infrastructure" 
            content="Your data is encrypted both in transit and at rest using industry-standard AES-256 encryption protocols. Our database (Supabase) utilizes Row Level Security (RLS) policies to ensure that your address book and order history are accessible only by you and our authorized admin personnel."
        />

        {/* SECTION 3 */}
        <Section 
            icon={<FaCookie />}
            title="3. Cookies & Local Storage" 
            content="We use essential cookies to maintain your session (keep you logged in) and preserve your cart state while you browse. We do not use invasive trackers. Analytics are used strictly to optimize site performance and load times."
        />

        {/* SECTION 4 */}
        <Section 
            icon={<FaShieldAlt />}
            title="4. Third-Party Deployment" 
            content="To fulfill your order, specific data must be shared with trusted partners: Razorpay (Payment Verification) and Logistics Partners (BlueDart/Delhivery for shipping). These partners are authorized to use your data solely for the purpose of completing the transaction."
        />

        <div className="border-t border-white/10 pt-10 mt-10 text-center">
            <p className="text-brand-silver text-sm mb-4">Questions regarding your data?</p>
            <a href="mailto:privacy@rigbuilders.in" className="text-brand-purple font-bold hover:text-white transition-colors">info@rigbuilders.in</a>
        </div>

      </div>
      <Footer />
    </div>
  );
}

// Helper Component for consistency
function Section({ icon, title, content }: any) {
    return (
        <Reveal>
            <div className="group">
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-brand-purple text-xl bg-brand-purple/10 p-3 rounded-full border border-brand-purple/20 group-hover:border-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-all">
                        {icon}
                    </div>
                    <h2 className="font-orbitron text-2xl font-bold text-white group-hover:text-brand-purple transition-colors">
                        {title}
                    </h2>
                </div>
                <div className="pl-[60px]">
                    <p className="text-brand-silver leading-relaxed text-sm md:text-base">
                        {content}
                    </p>
                </div>
            </div>
        </Reveal>
    );
}