// 1. IMPORT LINK AT THE TOP
import Link from "next/link"; 

const Hero = () => {
  return (
    <section className="relative h-screen w-full flex items-center justify-center bg-brand-black overflow-hidden">
      
      {/* Background Gradient & Effects... (Keep your existing background code here) */}
      <div className="absolute inset-0 'bg-gradient-to-b' from-brand-black via-brand-charcoal to-brand-black opacity-50"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        
        {/* Headlines... (Keep your existing text code here) */}
        <h2 className="font-saira text-brand-silver tracking-[0.2em] uppercase mb-4 text-sm md:text-base animate-pulse">
          Engineering the Ultimate Machine
        </h2>
        <h1 className="font-orbitron font-black text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight">
          COMMISSIONED.<br />
          <span className="text-transparent bg-clip-text 'bg-gradient-to-r' from-brand-purple to-brand-blue">
            NOT ASSEMBLED.
          </span>
        </h1>
        <p className="font-saira text-brand-silver text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
          India's premium custom PC brand. Engineered for performance, built with craftsmanship, backed by proof.
        </p>

        {/* CTA BUTTONS - THIS IS WHERE YOU ADD THE LINK */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          
          {/* 2. WRAP THE BUTTON WITH LINK */}
          <Link href="/configure"> 
            <button className="px-8 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white font-orbitron font-bold rounded-none border border-brand-purple tracking-wider transition-all transform hover:scale-105">
              CONFIGURE BUILD
            </button>
          </Link>
          
          {/* Link for the second button (Optional) */}
          <Link href="/signature">
            <button className="px-8 py-4 bg-transparent border border-white/20 hover:border-white text-white font-saira font-medium rounded-none tracking-wider transition-all">
              VIEW SIGNATURE EDITION
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default Hero;