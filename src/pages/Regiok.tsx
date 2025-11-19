import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { regionsData } from "@/data/regions";

export default function Regiok() {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-fade-in">
            <p className="text-sm font-semibold text-primary tracking-wider uppercase">
              {t('regions.hero.eyebrow')}
            </p>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {t('regions.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('regions.hero.subtitle')}
            </p>
          </div>

          {/* Region Quick Links */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {regionsData.map((region) => (
              <Button
                key={region.id}
                variant="outline"
                size="sm"
                className="hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => {
                  document.getElementById(region.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {language === 'hu' ? region.nameHu : region.nameEn}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Regions List */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl space-y-16">
          {regionsData.map((region, index) => (
            <div
              key={region.id}
              id={region.id}
              className="scroll-mt-24 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Region Header with Image */}
              <div className="sticky top-20 z-10 h-[200px] md:h-[250px] rounded-t-lg overflow-hidden mb-8 shadow-lg">
                <img 
                  src={region.image} 
                  alt={language === 'hu' ? region.nameHu : region.nameEn}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h2 
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {language === 'hu' ? region.nameHu : region.nameEn}
                  </h2>
                </div>
              </div>
              
              {/* Organizations List */}
              {region.organizations.length > 0 ? (
                <div className="space-y-6">
                  {region.organizations.map((org, orgIndex) => (
                    <Card key={orgIndex} className="p-6 hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary">
                      <h3 className="text-2xl font-semibold text-foreground mb-3">
                        {language === 'hu' ? org.name : org.nameEn}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {language === 'hu' ? org.description : org.descriptionEn}
                      </p>
                      {org.email && (
                        <a 
                          href={`mailto:${org.email}`}
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-medium">{org.email}</span>
                        </a>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6">
                  <p className="text-muted-foreground italic">
                    {t('regions.coming-soon')}
                  </p>
                </Card>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
