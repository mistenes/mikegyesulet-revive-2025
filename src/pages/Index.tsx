import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ImpactStats } from "@/components/ImpactStats";
import { NewsSection } from "@/components/NewsSection";
import { RegionsSection } from "@/components/RegionsSection";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { ClosingStatements } from "@/components/ClosingStatements";
import { Contact } from "@/components/Contact";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      <Hero />
      <ImpactStats />
      <NewsSection />
      <RegionsSection />
      <About />
      <Testimonials />
      <ClosingStatements />
      <Contact />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
