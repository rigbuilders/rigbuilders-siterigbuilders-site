import NavbarNeo from "@/components/home/NavbarNeo";
import HeroCarousel from "@/components/home/HeroCarousel";
import HomeShowcase from "@/components/home/HomeShowcase";
import Footer from "@/components/Footer";

// NOTE: The previous homepage (old Navbar + Hero/BrandCarousel/CategoryGrid/…
// section stack) is intentionally no longer rendered here — it's been replaced
// by the new futuristic mono+orange homepage. Those components still exist in
// the codebase and are used by other routes; they're just "hidden" from the
// homepage per the redesign.
export default function Home() {
  return (
    <main className="bg-rb-black min-h-screen">
      <NavbarNeo overlay />
      <HeroCarousel />
      <HomeShowcase />
      <Footer />
    </main>
  );
}
