"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Reveal } from "@/components/ui/MotionWrappers";
import { FaArrowRight, FaMicrochip, FaMemory, FaHdd, FaBolt } from "react-icons/fa";

export default function SignaturePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignature = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("series", "signature")
        .order("price", { ascending: false });
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchSignature();
  }, []);

  const getSpec = (specs: any, keys: string[]) => {
    if (!specs) return "TBD";
    for (const key of keys) {
      if (specs[key]) return specs[key];
      if (specs[key.toLowerCase()]) return specs[key.toLowerCase()];
    }
    return "TBD";
  };

  return (
    <main className="min-h-screen bg-rb-black text-white font-saira flex flex-col">
      <NavbarNeo />

      {/* HERO: THE MASTERPIECE */}
      <section className="relative overflow-hidden bg-rb-black border-b border-rb-line py-20 lg:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[700px] pointer-events-none"
             style={{ background: "radial-gradient(ellipse at top, rgba(255,90,31,0.16), transparent 60%)" }} />
        <div className="rb-dots absolute inset-0 opacity-20 pointer-events-none" />

        <div className="rb-shell text-center relative z-10">
          <Reveal>
            <span className="rb-kicker">The flagship experience</span>
            <h1 className="mt-4 font-orbitron font-black uppercase text-5xl md:text-8xl text-rb-white tracking-tight">
              Signature <span className="rb-text-ember">Edition</span>
            </h1>
            <p className="mt-6 text-rb-silver text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Commissioned masterpieces. Hand-signed by the builder, custom cable themes, and thermal certification.
              These are not just computers — they are statement pieces.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SIGNATURE SHOWCASE */}
      <div className="flex flex-col flex-grow">
        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-rb-orange animate-pulse">
            <div className="text-xl font-orbitron mb-2 tracking-widest uppercase">Loading archives</div>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center border-b border-rb-line">
            <p className="text-rb-silver">No Signature commissions available currently.</p>
          </div>
        ) : (
          products.map((product, index) => {
            const isEven = index % 2 === 0;
            return (
              <section key={product.id} className="min-h-[90vh] flex items-center border-b border-rb-line relative overflow-hidden group">
                <div className={`absolute top-0 w-1/2 h-full pointer-events-none ${isEven ? "right-0" : "left-0"}`}
                     style={{ background: `radial-gradient(circle at ${isEven ? "80%" : "20%"} 50%, rgba(255,90,31,0.07), transparent 60%)` }} />

                <div className="w-full max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center">
                  {/* CONTENT SIDE */}
                  <div className={`order-2 ${isEven ? "lg:order-1" : "lg:order-2"} px-6 md:px-12 lg:px-24 py-16 lg:py-20 relative z-10`}>
                    <Reveal>
                      <div className="relative">
                        <span className="text-[6rem] md:text-[10rem] font-black font-orbitron text-white/[0.03] absolute -top-16 -left-8 select-none pointer-events-none">
                          0{index + 1}
                        </span>

                        <span className="rb-kicker text-rb-orange">Signature Collection</span>
                        <h2 className="mt-3 font-orbitron text-4xl md:text-6xl font-black uppercase text-rb-white mb-6 leading-tight">
                          {product.name}
                        </h2>
                        <p className="text-rb-silver text-lg leading-relaxed mb-10 max-w-xl">
                          {product.description || "A pinnacle of engineering. Designed for those who demand the absolute limit of performance and aesthetics."}
                        </p>

                        {/* SPECS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12 border-t border-b border-rb-line py-10">
                          <SpecItem icon={<FaMicrochip />} label="Processor" value={getSpec(product.specs, ["Processor", "CPU", "recipe_cpu"])} />
                          <SpecItem icon={<FaBolt />} label="Graphics" value={getSpec(product.specs, ["Graphics Card", "GPU", "Graphics", "recipe_gpu"])} />
                          <SpecItem icon={<FaMemory />} label="Memory" value={getSpec(product.specs, ["Memory", "RAM", "recipe_ram"])} />
                          <SpecItem icon={<FaHdd />} label="Storage" value={getSpec(product.specs, ["Storage", "SSD", "recipe_storage"])} />
                        </div>

                        {/* PRICE & ACTION */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                          <div>
                            <span className="block text-xs text-rb-silver uppercase tracking-widest mb-1">Commission Price</span>
                            <span className="font-saira text-4xl font-bold text-rb-white">₹{Number(product.price || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <Link href={`/product/${product.id}`}>
                            <button className="rb-cta rb-sheen px-8 py-4 rounded-lg font-orbitron font-bold text-sm uppercase tracking-widest flex items-center gap-3">
                              Inspect Build <FaArrowRight />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </Reveal>
                  </div>

                  {/* IMAGE SIDE */}
                  <div className={`relative h-[60vh] lg:h-[90vh] w-full order-1 ${isEven ? "lg:order-2" : "lg:order-1"} overflow-hidden`}>
                    <Reveal delay={0.2} className="h-full w-full">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-rb-orange/20 blur-[150px] rounded-full" />
                      {product.image_url ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] scale-90 group-hover:scale-100 transition-transform duration-[1.5s] ease-out"
                            priority={index === 0}
                          />
                          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-rb-black to-transparent pointer-events-none" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-orbitron text-white/10 text-4xl uppercase">Confidential</span>
                        </div>
                      )}
                    </Reveal>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* PACKAGE INCLUSIONS */}
      <section className="py-24 px-6 bg-rb-surface border-t border-rb-line">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="font-orbitron text-3xl md:text-4xl mb-16 text-rb-white font-black uppercase text-center">
              Signature <span className="rb-text-ember">Privileges</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: "01", title: "Thermal Certification", desc: "Every rig comes with a printed thermal stress-test certificate (Cinebench, 3DMark) proving stability." },
              { id: "02", title: "Builder's Signature", desc: "Signed verification card by the specific engineer who built, tuned, and cable-managed your machine." },
              { id: "03", title: "Bespoke Cabling", desc: "Hand-trained cables in our signature matte-black & molten-orange theme. Zero loose wires." },
              { id: "04", title: "Digital Build Log", desc: "A personal QR code linking to high-res photos of your specific build process, from parts to final testing." },
            ].map((feature, i) => (
              <Reveal key={feature.id} delay={i * 0.1}>
                <div className="rb-surface-card !bg-rb-black p-8 h-full group">
                  <span className="block rb-text-ember font-orbitron font-black text-xl mb-4 opacity-60 group-hover:opacity-100 transition-opacity">{feature.id}</span>
                  <h3 className="text-rb-white font-orbitron font-bold mb-3 text-lg">{feature.title}</h3>
                  <p className="text-sm text-rb-silver leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-rb-orange text-xl mt-1 shrink-0">{icon}</span>
      <div>
        <span className="block text-[10px] uppercase text-rb-silver tracking-wider mb-1">{label}</span>
        <span className="text-rb-white font-bold text-sm md:text-base leading-tight block">{value}</span>
      </div>
    </div>
  );
}
