"use client";

import Link from "next/link";
import Image from "next/image";

export default function MobileFooter() {
  return (
    // Background explicitly set to #0b0b0b.
    // pb-[120px] ensures it scrolls completely above the fixed bottom navbar!
    <footer className="w-full bg-[#0b0b0b] pt-10 pb-[120px] px-[30px] border-t border-brand-purple/20">
      
      {/* Top Row: Logo & Socials */}
      <div className="flex justify-between items-center pb-6 border-b border-brand-purple/20">
        <div className="relative w-10 h-10">
          {/* Using the round RB logo to match the design */}
          <Image src="/icons/icon-dark.png" alt="Rig Builders" fill className="object-contain" />
        </div>
        <div className="flex gap-5">
          <a href="https://www.youtube.com/@RIGBUILDERS" target="_blank" rel="noopener noreferrer" className="relative w-6 h-6 hover:scale-110 transition-transform">
            <Image src="/icons/footer/youtube.png" alt="YouTube" fill className="object-contain" />
          </a>
          <a href="https://www.instagram.com/rig_builders/?hl=en" target="_blank" rel="noopener noreferrer" className="relative w-6 h-6 hover:scale-110 transition-transform">
            <Image src="/icons/footer/insta.png" alt="Instagram" fill className="object-contain" />
          </a>
        </div>
      </div>

      {/* Middle Row: The Slogan */}
      <div className="py-10 text-center border-b border-brand-purple/20">
        <h2 className="font-orbitron font-bold text-[28px] leading-[1.15] tracking-wide mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#B084FF] block">COMMISSIONED.</span>
          <span className="text-white block">NOT</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#B084FF] block">ASSEMBLED</span>
        </h2>
        <p className="font-saira text-white text-[12px] leading-relaxed max-w-[280px] mx-auto">
          India's premium custom PC brand for those who value engineering excellence and proof.
        </p>
      </div>

      {/* Links Grid: 3 Columns side-by-side */}
      <div className="py-8 grid grid-cols-3 gap-2 border-b border-brand-purple/20">
        
        {/* SERIES */}
        <div>
          <h4 className="font-orbitron text-white text-[11px] font-bold mb-4 tracking-wider uppercase">Series</h4>
          <ul className="space-y-3 font-saira text-white text-[9px]">
            <li><Link href="/ascend" className="hover:text-brand-purple transition-colors">Ascend Series</Link></li>
            <li><Link href="/workpro" className="hover:text-brand-purple transition-colors">WorkPro Series</Link></li>
            <li><Link href="/creator" className="hover:text-brand-purple transition-colors">Creator Series</Link></li>
            <li><Link href="/signature" className="hover:text-brand-purple transition-colors">Signature Series</Link></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div>
          <h4 className="font-orbitron text-white text-[11px] font-bold mb-4 tracking-wider uppercase">Support</h4>
          <ul className="space-y-3 font-saira text-white text-[9px]">
            <li><Link href="/dashboard" className="hover:text-brand-purple transition-colors">Track Order</Link></li>
            <li><Link href="/blog" className="hover:text-brand-purple transition-colors">Blog & Guides</Link></li>
            <li><Link href="/terms" className="hover:text-brand-purple transition-colors">Terms & Warranty</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-purple transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="font-orbitron text-white text-[11px] font-bold mb-4 tracking-wider uppercase">Contact</h4>
          <ul className="space-y-3 font-saira text-white text-[9px]">
            <li>Bathinda, Punjab, India</li>
            <li><a href="mailto:info@rigbuilders.in" className="hover:text-brand-purple transition-colors">info@rigbuilders.in</a></li>
            <li><a href="tel:+917707801014" className="hover:text-brand-purple transition-colors">+91 77078-01014</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="pt-6 pb-4 flex justify-between items-center">
         <p className="font-saira text-white text-[7px]">© {new Date().getFullYear()} Rig Builders. All Rights Reserved.</p>
         <p className="font-saira text-white text-[7px]">Designed For Performance</p>
      </div>
      
      {/* Final exact matching line from the image */}
      <div className="w-full h-[1px] bg-brand-purple/20 mt-1"></div>
      
    </footer>
  );
}