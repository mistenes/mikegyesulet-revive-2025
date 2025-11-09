import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { NewsSection } from "@/components/NewsSection";
import { RegionsSection } from "@/components/RegionsSection";
import { About } from "@/components/About";
import { ClosingStatements } from "@/components/ClosingStatements";
import { Contact } from "@/components/Contact";
import { OfficeHours } from "@/components/OfficeHours";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      <Hero />
      <NewsSection />
      <RegionsSection />
      <About />
      <ClosingStatements />
      <Contact />
      <OfficeHours />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
