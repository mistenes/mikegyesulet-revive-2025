import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { regionsData } from "@/data/regions";
import { useRef } from "react";

export default function Regiok() {
  const { language, t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Flatten all organizations from all regions
  const allOrganizations = regionsData.flatMap(region => 
    region.organizations.map(org => ({
      ...org,
      regionName: language === 'hu' ? region.nameHu : region.nameEn,
      regionId: region.id
    }))
  );

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

      {/* Organizations Carousel */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {language === 'hu' ? 'Összes Tagszervezet' : 'All Member Organizations'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'hu' 
                ? 'Görgess végig a Kárpát-medence összes tagszervezetén' 
                : 'Browse through all member organizations across the Carpathian Basin'}
            </p>
          </div>

          <div className="relative group">
            {/* Left Arrow */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Scrollable Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {allOrganizations.map((org, index) => (
                <Card 
                  key={index}
                  className="min-w-[320px] max-w-[320px] flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50"
                  onClick={() => {
                    document.getElementById(org.regionId)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-2">
                          {org.regionName}
                        </div>
                        <h3 className="font-bold text-lg text-foreground line-clamp-2">
                          {language === 'hu' ? org.name : org.nameEn}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {language === 'hu' ? org.description : org.descriptionEn}
                    </p>
                    {org.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Right Arrow */}
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollRight}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
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
