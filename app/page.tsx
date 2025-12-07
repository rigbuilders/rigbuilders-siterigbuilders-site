import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AscendSeries from "../components/AscendSeries";
import WorkPro from "../components/WorkPro";
import CreatorSeries from "../components/CreatorSeries";
import SignatureEdition from "../components/SignatureEdition";
import Footer from "../components/Footer"; 

export default function Home() {
  return (
    <main className="bg-brand-black min-h-screen flex flex-col">
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