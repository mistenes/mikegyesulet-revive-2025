import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { Hero } from "@/components/Hero";
import { ImpactStats } from "@/components/ImpactStats";
import { NewsSection } from "@/components/NewsSection";
import { RegionsSection } from "@/components/RegionsSection";
import { RegionsMap } from "@/components/RegionsMap";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { ClosingStatements } from "@/components/ClosingStatements";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { NewsletterSignup } from "@/components/NewsletterSignup";


const Index = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      <Hero />
      <ImpactStats />
      <NewsSection />
      <RegionsSection />
      <RegionsMap />
      <About />
      <Testimonials />
      <ClosingStatements />
      <Contact />
      {language === 'hu' && <NewsletterSignup />}
      <Footer />
    </div>
  );
};

export default Index;
