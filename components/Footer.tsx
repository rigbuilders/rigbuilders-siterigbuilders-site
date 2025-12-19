import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-brand-black border-t border-white/5 pt-16 pb-8 md:pt-20 md:pb-10">
      {/* 1. Changed 'text-center md:text-left' to 'text-left' to align everything left globally */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16 text-left">
        
        {/* BRAND COLUMN */}
        {/* 2. Changed 'items-center md:items-start' to 'items-start' */}
        <div className="space-y-6 flex flex-col items-start">
          {/* Logo */}
          <div className="relative w-48 h-12">
            <Image 
                src="/icons/navbar/logo.png" 
                alt="Rig Builders" 
                fill 
                className="object-contain object-left" // Added object-left to ensure image stays left
            />
          </div>
          
          {/* 3. Removed 'mx-auto' so text doesn't center itself */}
          <p className="font-saira text-brand-silver text-sm leading-relaxed max-w-xs">
            "Commissioned. Not Assembled." <br/>
            India’s premium custom PC brand for those who value engineering excellence and proof.
          </p>
          
          {/* Social Media */}
          {/* 4. Changed 'justify-center' to 'justify-start' */}
          <div className="flex gap-4 justify-start">
            <a href="https://www.instagram.com/rig_builders/?hl=en" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <Image src="/icons/footer/insta.png" alt="Instagram" width={32} height={32} />
            </a>
            <a href="https://www.youtube.com/@RIGBUILDERS" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <Image src="/icons/footer/youtube.png" alt="YouTube" width={32} height={32} />
            </a>
          </div>
        </div>

        {/* SERIES LINKS (Unchanged) */}
        <div>
          <h4 className="font-orbitron text-white text-lg mb-6">SERIES</h4>
          <ul className="space-y-4 font-saira text-brand-silver text-sm">
            <li><Link href="/ascend" className="hover:text-brand-purple transition-colors">Ascend Series (Gaming)</Link></li>
            <li><Link href="/creator" className="hover:text-brand-blue transition-colors">Creator Series (Editing)</Link></li>
            <li><Link href="/workpro" className="hover:text-white transition-colors">WorkPro (Station)</Link></li>
            <li><Link href="/signature" className="hover:text-brand-burgundy transition-colors">Signature Edition</Link></li>
          </ul>
        </div>

        {/* SUPPORT & LEGAL (Unchanged) */}
        <div>
          <h4 className="font-orbitron text-white text-lg mb-6">SUPPORT</h4>
          <ul className="space-y-4 font-saira text-brand-silver text-sm">
            <li><Link href="/dashboard" className="hover:text-white transition-colors">Track Order</Link></li>
            <li><Link href="/blog" className="hover:text-white transition-colors">Blogs & Guides</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Warranty</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* CONTACT (Unchanged) */}
        <div>
          <h4 className="font-orbitron text-white text-lg mb-6">CONTACT</h4>
          <ul className="space-y-4 font-saira text-brand-silver text-sm">
            <li>Bathinda, Punjab, India</li>
            <li>info@rigbuilders.in</li>
            <li>+91 77078-01014</li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-brand-silver/50 font-saira gap-4 md:gap-0">
        <p>© 2025 Rig Builders. All Rights Reserved.</p>
        <p>Designed for Performance.</p>
      </div>
    </footer>
  );
}