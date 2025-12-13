import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
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
      <AscendSeries />
      <WorkPro />
      <CreatorSeries />
      <SignatureEdition />
      <Footer />
    </main>
  );
}