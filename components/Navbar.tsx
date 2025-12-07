import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-[#121212] border-b border-[#1A1A1A] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      
      {/* 1. BRAND LOGO (Left) */}
      <Link href="/" className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full 'bg-gradient-to-br' from-[#4E2C8B] to-[#265DAB] flex items-center justify-center text-white font-bold shadow-md font-orbitron">
          rb
        </div>
        <span className="text-sm uppercase tracking-wide text-[#D0D0D0] font-saira font-bold">
          Rig Builders
        </span>
      </Link>

      {/* 2. NAVIGATION MENU (Center/Right) */}
      <div className="flex items-center gap-6 text-sm font-saira font-medium">
        
        {/* Desktop Links */}
        <div className="hidden md:flex gap-6">
            <Link href="/ascend" className="text-[#D0D0D0]/70 hover:text-[#4E2C8B] transition-colors">
              ASCEND
            </Link>
            <Link href="/creator" className="text-[#D0D0D0]/70 hover:text-[#265DAB] transition-colors">
              CREATOR
            </Link>
            <Link href="/workpro" className="text-[#D0D0D0]/70 hover:text-white transition-colors">
              WORKPRO
            </Link>
            <Link href="/signature" className="text-[#D0D0D0]/70 hover:text-[#4E2C8B] transition-colors">
              SIGNATURE
            </Link>
        </div>

        {/* Vertical Divider */}
        <div className="h-4 w-px bg-white/10 hidden md:block"></div>

        {/* LOGIN BUTTON (This connects to the Sign In Page) */}
        <Link href="/signin" className="text-white hover:text-[#4E2C8B] transition-colors font-bold hidden md:block">
          LOGIN
        </Link>

        {/* COMMISSION BUTTON (This connects to the Configurator) */}
        <Link href="/configure">
          <button className="px-4 py-2 rounded-full bg-[#4E2C8B] text-white text-xs uppercase tracking-wide font-bold hover:bg-white hover:text-black transition-colors shadow-[0_0_15px_rgba(78,44,139,0.4)]">
            Commission a Rig
          </button>
        </Link>
        
      </div>
    </nav>
  );
}