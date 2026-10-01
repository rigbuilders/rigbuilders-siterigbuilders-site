import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaPhoneAlt, FaEnvelope, FaClock, FaHeadset, FaVideo, FaShieldAlt, FaWhatsapp, FaClipboardCheck } from "react-icons/fa";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Center",
  description: "Get help with your Rig Builders system. Access drivers, warranty claims, and technical support FAQs.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-rb-black text-white font-saira flex flex-col">
      <Navbar />

      {/* --- DIRECT CHANNELS --- */}
      <section className="rb-shell pt-10 lg:pt-14 pb-14">
        <Reveal>
          <span className="rb-kicker flex items-center gap-3">
            <span className="w-2 h-2 bg-rb-success rounded-full animate-pulse" /> Live status: Online
          </span>
          <h1 className="mt-3 font-orbitron text-4xl md:text-6xl font-black uppercase text-rb-white tracking-tight leading-none">
            Support <span className="rb-text-ember">Hotline</span>
          </h1>
          <p className="mt-4 text-rb-silver max-w-xl">
            Reach our technical staff directly — remote diagnostics, warranty, and hardware help, all handled for you.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Reveal delay={0.05}>
            <div className="rb-surface-card p-7 h-full group">
              <div className="w-14 h-14 bg-rb-orange/10 border border-rb-orange/25 rounded-xl flex items-center justify-center text-2xl text-rb-orange group-hover:bg-rb-orange group-hover:text-rb-orange-ink transition-all mb-5">
                <FaPhoneAlt />
              </div>
              <h3 className="font-orbitron text-lg font-bold text-rb-white mb-1">Priority Line</h3>
              <p className="text-rb-silver text-sm mb-3">Direct access to technical staff.</p>
              <a href="tel:+917707801014" className="text-2xl font-bold text-rb-white hover:text-rb-orange transition-colors tracking-tight">+91 77078-01014</a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rb-surface-card p-7 h-full group">
              <div className="w-14 h-14 bg-rb-orange/10 border border-rb-orange/25 rounded-xl flex items-center justify-center text-2xl text-rb-orange-deep group-hover:bg-rb-orange-deep group-hover:text-rb-orange-ink transition-all mb-5">
                <FaEnvelope />
              </div>
              <h3 className="font-orbitron text-lg font-bold text-rb-white mb-1">Digital Desk</h3>
              <p className="text-rb-silver text-sm mb-3">For logs, invoices, and tickets.</p>
              <a href="mailto:info@rigbuilders.in" className="text-xl font-bold text-rb-white hover:text-rb-orange-deep transition-colors tracking-tight break-all">info@rigbuilders.in</a>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rb-surface-card p-7 h-full group">
              <div className="w-14 h-14 bg-white/5 border border-rb-line rounded-xl flex items-center justify-center text-2xl text-rb-white mb-5">
                <FaClock />
              </div>
              <h3 className="font-orbitron text-lg font-bold text-rb-white mb-1">Operations Window</h3>
              <p className="text-rb-silver text-sm mb-3">Mon – Sat</p>
              <p className="text-2xl font-bold text-rb-white tracking-tight">09:00 AM — 07:00 PM</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <a href="https://wa.me/917707801014?text=Hi" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-rb-success/10 border border-rb-success/30 text-rb-success font-orbitron font-bold text-sm uppercase tracking-widest hover:bg-rb-success hover:text-black transition-all flex items-center justify-center gap-3 rounded-lg">
            <FaWhatsapp size={20} /> WhatsApp
          </a>
          <a href="mailto:info@rigbuilders.in?subject=Diagnostics%20Request%20-%20[Order%20ID]" className="rb-cta px-8 py-4 rounded-lg font-orbitron font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3">
            <FaClipboardCheck size={20} /> Support Assistance
          </a>
        </div>
      </section>

      {/* --- SERVICE PROTOCOLS --- */}
      <section className="rb-shell py-14 border-t border-rb-line">
        <Reveal>
          <h2 className="font-orbitron text-3xl md:text-4xl mb-12 text-rb-white font-black uppercase text-center">
            Service <span className="rb-text-ember">Protocols</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: <FaVideo />, title: "Remote Ops", body: <>Software issue? We don't need the PC back. We use <strong>AnyDesk &amp; Google Meet</strong> to remotely diagnose driver conflicts and optimize BIOS settings while you watch.</> },
            { icon: <FaShieldAlt />, title: "Double Coverage", body: <><strong>3-Year Service Warranty</strong> (labor &amp; diagnostics) + <strong>Manufacturer Warranty</strong> (up to 5–10 years on parts). We handle the RMA logistics for you.</> },
            { icon: <FaHeadset />, title: "Hardware Failure", body: <>In the rare event of a hardware failure, we arrange a pickup, replace the dead component, stress-test the system again, and ship it back. Zero stress.</> },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="rb-surface-card p-8 h-full group">
                <div className="w-12 h-12 bg-rb-orange/10 rounded-full flex items-center justify-center text-rb-orange text-2xl mb-6 group-hover:scale-110 transition-transform">
                  {p.icon}
                </div>
                <h3 className="text-rb-white font-orbitron font-bold mb-3 text-xl">{p.title}</h3>
                <p className="text-sm text-rb-silver leading-relaxed">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
