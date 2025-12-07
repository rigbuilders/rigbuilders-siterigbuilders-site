import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AscendSeries from "../components/AscendSeries";
import WorkPro from "../components/WorkPro";
import CreatorSeries from "../components/CreatorSeries";
import SignatureEdition from "../components/SignatureEdition";
import CheckoutButton from "@/components/CheckoutButton";


export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <AscendSeries />
      <WorkPro />
      <CreatorSeries />
      <SignatureEdition />
      <CheckoutButton amount={45000} />
    </>
  );
}
