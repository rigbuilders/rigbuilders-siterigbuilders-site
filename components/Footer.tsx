import Link from "next/link";
import { FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa"; // You might need to install react-icons later, or just text for now

export default function Footer() {
  return (
    <footer className="bg-brand-black border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        {/* Brand Column */}
        <div className="space-y-6">
          <h3 className="font-orbitron font-bold text-2xl text-white tracking-wider">
            RIG BUILDERS
          </h3>
          <p className="font-saira text-brand-silver text-sm leading-relaxed max-w-xs">
            "Commissioned. Not Assembled." <br/>
            India’s premium custom PC brand for those who value engineering excellence and proof.
          </p>
          <div className="flex gap-4">
            {/* Social Placeholders */}
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-purple transition-colors cursor-pointer">IG</div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-purple transition-colors cursor-pointer">YT</div>
          </div>
        </div>

        {/* Series Links */}
        <div>
          <h4 className="font-orbitron text-white text-lg mb-6">SERIES</h4>
          <ul className="space-y-4 font-saira text-brand-silver text-sm">
            <li><Link href="/ascend" className="hover:text-brand-purple transition-colors">Ascend Series (Gaming)</Link></li>
            <li><Link href="/creator" className="hover:text-brand-blue transition-colors">Creator Series (Editing)</Link></li>
            <li><Link href="/workpro" className="hover:text-white transition-colors">WorkPro (Station)</Link></li>
            <li><Link href="/signature" className="hover:text-brand-burgundy transition-colors">Signature Edition</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-orbitron text-white text-lg mb-6">SUPPORT</h4>
          <ul className="space-y-4 font-saira text-brand-silver text-sm">
            <li><Link href="#" className="hover:text-white transition-colors">Track Order</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Warranty Policy</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Submit Ticket</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Contact/Legal */}
        <div>
          <h4 className="font-orbitron text-white text-lg mb-6">CONTACT</h4>
          <ul className="space-y-4 font-saira text-brand-silver text-sm">
            <li>New Delhi, India</li>
            <li>support@rigbuilders.in</li>
            <li>+91 99999 XXXXX</li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-brand-silver/50 font-saira">
        <p>© 2025 Rig Builders. All Rights Reserved.</p>
        <p>Designed for Performance.</p>
      </div>
    </footer>
  );
}