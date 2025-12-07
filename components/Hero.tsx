import Link from "next/link"; 

const Hero = () => {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center bg-brand-black overflow-hidden py-20">
      
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 'bg-gradient-to-b' from-brand-black via-brand-charcoal to-brand-black opacity-50"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        
        {/* Headlines */}
        <h2 className="font-saira text-brand-silver tracking-[0.2em] uppercase mb-4 text-xs md:text-base animate-pulse">
          Engineering the Ultimate Machine
        </h2>
        <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight">
          COMMISSIONED.<br />
          <span className="text-transparent bg-clip-text 'bg-gradient-to-r' from-brand-purple to-brand-blue">
            NOT ASSEMBLED.
          </span>
        </h1>
        <p className="font-saira text-brand-silver text-base md:text-xl max-w-2xl mx-auto mb-10 font-light px-4">
          India's premium custom PC brand. Engineered for performance, built with craftsmanship, backed by proof.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center w-full max-w-md mx-auto md:max-w-none">
          
          <Link href="/configure" className="w-full sm:w-auto"> 
            <button className="w-full sm:w-auto px-8 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white font-orbitron font-bold rounded-none border border-brand-purple tracking-wider transition-all transform hover:scale-105">
              CONFIGURE BUILD
            </button>
          </Link>
          
          <Link href="/signature" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 hover:border-white text-white font-saira font-medium rounded-none tracking-wider transition-all">
              VIEW SIGNATURE EDITION
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default Hero;