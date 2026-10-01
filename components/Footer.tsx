import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaYoutube, FaArrowRight, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from "react-icons/fa";

const SERIES = [
  { label: "Ascend Series", href: "/ascend" },
  { label: "Creator Series", href: "/creator" },
  { label: "WorkPro Series", href: "/workpro" },
  { label: "Signature Edition", href: "/signature" },
];

const SUPPORT = [
  { label: "Return Policy", href: "/returns" },
  { label: "Blogs & Guides", href: "/blog" },
  { label: "Terms & Warranty", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

function FootLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 text-sm text-rb-silver hover:text-rb-orange transition-colors">
      <span className="w-0 group-hover:w-3 h-[2px] bg-rb-orange rounded-full transition-all duration-300" />
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="relative bg-rb-black overflow-hidden">
      {/* animated top hairline */}
      <div className="h-[2px] w-full rb-bar-anim opacity-70" />
      {/* ambient ember */}
      <div className="rb-ember-glow" />

      {/* ── BRAND STRIP ── */}
      <div className="rb-shell relative z-10 pt-16 pb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8 border-b border-rb-line">
        <div className="max-w-md">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <span className="relative w-9 h-9 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-rb-orange/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image src="/icons/icon_only.svg" alt="Rig Builders — home" width={34} height={34} className="relative z-10" />
            </span>
            <span className="font-orbitron font-black tracking-[0.18em] text-base text-rb-white leading-none">
              RIG<span className="text-rb-orange">BUILDERS</span>
            </span>
          </Link>
          <p className="mt-5 font-saira text-rb-silver text-sm leading-relaxed">
            <span className="text-rb-white font-bold">Commissioned. Not assembled.</span> India&apos;s premium
            custom PC brand — built for those who value engineering, and proof.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="https://www.instagram.com/rig_builders/?hl=en" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
               className="w-10 h-10 rounded-lg border border-rb-line bg-rb-elevated flex items-center justify-center text-rb-silver hover:text-rb-orange hover:border-rb-orange/50 transition-colors">
              <FaInstagram />
            </a>
            <a href="https://www.youtube.com/@RIGBUILDERS" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
               className="w-10 h-10 rounded-lg border border-rb-line bg-rb-elevated flex items-center justify-center text-rb-silver hover:text-rb-orange hover:border-rb-orange/50 transition-colors">
              <FaYoutube />
            </a>
          </div>
        </div>

        <Link href="/configure" className="shrink-0">
          <button className="rb-cta rb-sheen px-7 py-3.5 text-xs uppercase tracking-[0.18em] flex items-center gap-2">
            Build Yours <FaArrowRight size={11} />
          </button>
        </Link>
      </div>

      {/* ── LINK COLUMNS ── */}
      <div className="rb-shell relative z-10 py-14 grid grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <h4 className="rb-kicker mb-5">Series</h4>
          <div className="space-y-3">
            {SERIES.map((s) => <FootLink key={s.href} {...s} />)}
          </div>
        </div>

        <div>
          <h4 className="rb-kicker mb-5">Support</h4>
          <div className="space-y-3">
            {SUPPORT.map((s) => <FootLink key={s.href} {...s} />)}
          </div>
        </div>

        <div>
          <h4 className="rb-kicker mb-5">Explore</h4>
          <div className="space-y-3">
            <FootLink href="/products" label="All Components" />
            <FootLink href="/desktops" label="Desktops" />
            <FootLink href="/accessories" label="Accessories" />
            <FootLink href="/configure" label="System Configurator" />
          </div>
        </div>

        <div>
          <h4 className="rb-kicker mb-5">Contact</h4>
          <ul className="space-y-3 text-sm text-rb-silver">
            <li className="flex items-start gap-3"><FaMapMarkerAlt className="text-rb-orange mt-0.5 shrink-0" /> Bathinda, Punjab, India</li>
            <li className="flex items-center gap-3"><FaEnvelope className="text-rb-orange shrink-0" /> <a href="mailto:info@rigbuilders.in" className="hover:text-rb-orange transition-colors">info@rigbuilders.in</a></li>
            <li className="flex items-center gap-3"><FaPhoneAlt className="text-rb-orange shrink-0" /> <a href="tel:+917707801014" className="hover:text-rb-orange transition-colors">+91 77078-01014</a></li>
          </ul>
        </div>
      </div>

      {/* ── GIANT WATERMARK ── */}
      <div className="relative z-0 select-none pointer-events-none overflow-hidden -mb-2 md:-mb-4">
        <div className="font-orbitron font-black text-center leading-none text-white/[0.035] text-[19vw] tracking-tighter whitespace-nowrap">
          RIG BUILDERS
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="rb-shell relative z-10 py-6 border-t border-rb-line flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-rb-silver/60 font-saira">
        <p>© {new Date().getFullYear()} Rig Builders. All Rights Reserved.</p>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-rb-orange transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-rb-orange transition-colors">Terms</Link>
          <span className="text-rb-orange/70 uppercase tracking-widest">Designed for Performance</span>
        </div>
      </div>
    </footer>
  );
}
