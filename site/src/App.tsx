import { Feathers } from "@/components/Feathers";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Faq } from "@/sections/Faq";
import { Gallery } from "@/sections/Gallery";
import { Hero } from "@/sections/Hero";
import { Join } from "@/sections/Join";
import { Showcase } from "@/sections/Showcase";

/** The landing page, top to bottom: the pitch and downloads, the app beside its changelog, the gallery, the call to join, the FAQ. */
export function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Feathers />
      <Nav />
      <main id="main">
        <Hero />
        <Showcase />
        <Gallery />
        <Join />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
