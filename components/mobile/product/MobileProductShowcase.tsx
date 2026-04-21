export default function MobileProductShowcase({ product }: { product: any }) {
  const images = (product.gallery_urls?.length ? product.gallery_urls : [product.image_url, product.image_url])
    .filter((url: string) => url && url.length > 0);

  // Hide section completely if there are no images to show
  if (images.length === 0) return null;

  return (
    <div className="px-6 py-10 border-b border-white/5 bg-[#050505]">
        <div className="text-center mb-8">
            <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-wider">Product <span className="text-brand-purple">Showcase</span></h2>
        </div>
        
        <div className="space-y-4">
            {/* Large Hero Image */}
            <div className="w-full h-[300px] relative rounded-2xl overflow-hidden border border-white/5 bg-[#1A1A1A] flex items-center justify-center">
                <img src={product.image_url} alt="Main Showcase" className="w-full h-full object-cover opacity-90" />
            </div>
            
            {/* Split Image Grid */}
            <div className="grid grid-cols-2 gap-4 h-[180px]">
                {images.slice(0, 2).map((img: string, i: number) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden border border-white/5 bg-[#1A1A1A] flex items-center justify-center">
                        <img src={img} alt={`Showcase ${i}`} className="w-full h-full object-cover opacity-80" />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}