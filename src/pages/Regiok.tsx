import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

      {/* Regions Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl space-y-32">
          {regionsData.map((region, index) => (
            <div
              key={region.id}
              id={region.id}
              className="scroll-mt-24 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="relative h-[300px] lg:h-[400px] overflow-hidden">
                    <img 
                      src={region.image} 
                      alt={language === 'hu' ? region.nameHu : region.nameEn}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                  
                  <CardContent className="p-8 lg:p-12 space-y-6">
                    <h2 
                      className="text-3xl lg:text-4xl font-bold text-foreground"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {language === 'hu' ? region.nameHu : region.nameEn}
                    </h2>
                    
                    {region.organizations.length > 0 ? (
                      <div className="space-y-8">
                        {region.organizations.map((org, orgIndex) => (
                          <div key={orgIndex} className="space-y-3 border-l-4 border-primary pl-6">
                            <h3 className="text-xl font-semibold text-foreground">
                              {language === 'hu' ? org.name : org.nameEn}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        {t('regions.coming-soon')}
                      </p>
                    )}
                  </CardContent>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
