import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useSectionContent } from "@/hooks/useSectionContent";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";
import { regionsData } from "@/data/regions";
import { getPublicRegions, REGIONS_EVENT } from "@/services/regionsService";
import type { Region } from "@/types/region";

function sortRegions(items: Region[]): Region[] {
  return [...items].sort((a, b) => a.nameHu.localeCompare(b.nameHu, "hu", { sensitivity: "base" }));
}

export default function Regiok() {
  const { language, t } = useLanguage();
  const location = useLocation();
  const { content: regionsIntroContent } = useSectionContent("regions_intro");
  const adminPreview = isAdminPreview();
  const [regions, setRegions] = useState<Region[]>(() => sortRegions(regionsData));

  const handleEditableClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("regions_intro", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const heroContent = useMemo(() => {
    const fallback = defaultPageContent.regions_intro;
    const localized = (regionsIntroContent?.[language] || regionsIntroContent?.hu || fallback?.[language] || fallback?.hu || {}) as {
      eyebrow?: string;
      title?: string;
      description?: string;
    };

    return {
      eyebrow: localized.eyebrow || t("regions.hero.eyebrow"),
      title: localized.title || t("regions.hero.title"),
      subtitle: localized.description || t("regions.hero.subtitle"),
    };
  }, [language, regionsIntroContent, t]);

  useEffect(() => {
    if (!location.hash) return;

    const anchor = location.hash.replace('#', '');
    const target = document.getElementById(anchor);
    if (target) {
      // Delay ensures layout is ready before scrolling
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [location.hash]);

  useEffect(() => {
    let active = true;

    const loadRegions = async () => {
      try {
        const items = await getPublicRegions();
        if (!active) return;
        setRegions(sortRegions(items));
      } catch (error) {
        console.error("Failed to load regions", error);
      }
    };

    loadRegions();

    const handleUpdate = () => loadRegions();
    window.addEventListener(REGIONS_EVENT, handleUpdate as EventListener);

    return () => {
      active = false;
      window.removeEventListener(REGIONS_EVENT, handleUpdate as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-fade-in">
            <p
              className={`text-sm font-semibold text-primary tracking-wider uppercase ${adminPreview ? "cursor-pointer" : ""}`}
              onClick={(event) => handleEditableClick(event, "eyebrow")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {heroContent.eyebrow}
            </p>
            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight ${adminPreview ? "cursor-pointer" : ""}`}
              style={{ fontFamily: "'Sora', sans-serif" }}
              onClick={(event) => handleEditableClick(event, "title")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {heroContent.title}
            </h1>
            <p
              className={`text-xl text-muted-foreground max-w-3xl mx-auto ${adminPreview ? "cursor-pointer" : ""}`}
              onClick={(event) => handleEditableClick(event, "description")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {heroContent.subtitle}
            </p>
          </div>

          {/* Region Quick Links */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {regions.map((region) => (
              <Button
                key={region.id}
                variant="outline"
                size="sm"
                className="hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => {
                  document.getElementById(region.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {language === 'hu' ? region.nameHu : region.nameEn || region.nameHu}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Regions List */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl space-y-16">
          {regions.map((region, index) => (
            <div
              key={region.id}
              id={region.id}
              className="scroll-mt-24 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Region Header with Image */}
              <div className="sticky top-20 z-10 h-[200px] md:h-[250px] rounded-t-lg overflow-hidden mb-8 shadow-lg">
                <img
                  src={region.imageUrl}
                  alt={language === 'hu' ? region.nameHu : region.nameEn || region.nameHu}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h2 
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {language === 'hu' ? region.nameHu : region.nameEn || region.nameHu}
                  </h2>
                </div>
              </div>
              
              {/* Organizations List */}
              {region.organizations.length > 0 ? (
                <div className="space-y-6">
                  {region.organizations.map((org, orgIndex) => (
                    <Card
                      key={org.id || orgIndex}
                      className="p-6 hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary"
                    >
                      <div className="flex items-start gap-4">
                        {org.logoUrl && (
                          <img
                            src={org.logoUrl}
                            alt={language === 'hu' ? org.name : org.nameEn || org.name}
                            className="h-14 w-14 rounded-full object-cover border"
                          />
                        )}
                        <div className="flex-1 space-y-3">
                          <h3 className="text-2xl font-semibold text-foreground mb-3">
                            {language === 'hu' ? org.name : org.nameEn || org.name}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed mb-4">
                            {language === 'hu' ? org.description : org.descriptionEn || org.description}
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
                      </div>
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
