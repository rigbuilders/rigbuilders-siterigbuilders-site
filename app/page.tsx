import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BrandCarousel from "@/components/BrandCarousel";
import WhyChooseUs from "@/components/WhyChooseUs";
import HowWeCommission from "@/components/HowWeCommission";
import CategoryGrid from "@/components/CategoryGrid";
import AscendSeries from "@/components/AscendSeries";
import WorkPro from "@/components/WorkPro";
import CreatorSeries from "@/components/CreatorSeries";
import SignatureEdition from "@/components/SignatureEdition"; // If you have it
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-[#121212] min-h-screen">
      <Navbar />
      <Hero />
      <WhyChooseUs />
      <HowWeCommission />
      <BrandCarousel />
      <CategoryGrid />
      <AscendSeries />
      <WorkPro />
      <CreatorSeries />
      <SignatureEdition />
      <Footer />
    </main>
  );
}