import type React from "react";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSectionContent } from "@/hooks/useSectionContent";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";

// Import region images
import erdelyImg from "@/assets/region-erdely.jpg";
import felvidekImg from "@/assets/region-felvidek.jpg";
import karpataljaImg from "@/assets/region-karpattalja.jpg";
import vajdasagImg from "@/assets/region-vajdasag.jpg";
import youthImg from "@/assets/region-youth-1.jpg";
import cultureImg from "@/assets/region-culture.jpg";

const defaultScrollImages = [
  { src: erdelyImg, alt: "Erdély" },
  { src: felvidekImg, alt: "Felvidék" },
  { src: karpataljaImg, alt: "Kárpátalja" },
  { src: vajdasagImg, alt: "Vajdaság" },
  { src: youthImg, alt: "Magyar Ifjúság" },
  { src: cultureImg, alt: "Magyar Kultúra" },
];

type RegionsContent = {
  eyebrow?: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonUrl?: string;
  chips?: string[];
  scrollImages?: ScrollImage[];
};

type ScrollImage = {
  imageUrl?: string;
  alt?: string;
};

const regionAnchors: Record<string, string> = {
  "Erdély": "erdely",
  "Felvidék": "felvidek",
  "Kárpátalja": "karpatalja",
  "Vajdaság": "vajdasag",
  "Horvátország": "horvatorszag",
  "Szlovénia": "szlovenia",
};

export const RegionsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const { language } = useLanguage();
  const { content: regionsSection, isLoading } = useSectionContent("regions_section");
  const adminPreview = isAdminPreview();

  const content = useMemo<RegionsContent | null>(() => {
    if (!regionsSection) return null;
    return (regionsSection[language] || regionsSection.hu || null) as RegionsContent | null;
  }, [language, regionsSection]);

  const handleAdminFocus = (event: React.MouseEvent<HTMLElement>, fieldKey: keyof RegionsContent) => {
    if (notifyAdminFocus("regions_section", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const scrollingImages = useMemo(() => {
    const customImages = (content?.scrollImages as ScrollImage[] | undefined)
      ?.filter((image) => Boolean(image?.imageUrl))
      .map((image, index) => ({
        src: image.imageUrl as string,
        alt: image.alt || `Régió kép ${index + 1}`,
      }));

    if (customImages && customImages.length > 0) {
      return customImages;
    }

    return defaultScrollImages;
  }, [content?.scrollImages]);

  return (
    <section ref={sectionRef} className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Scrolling Images */}
          <div
            className={`relative h-[600px] transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Column 1 - Scrolling Up */}
              <div className="relative overflow-hidden rounded-3xl">
                <div className="animate-scroll-up">
                  {/* Duplicate images for seamless loop */}
                  {[...scrollingImages, ...scrollingImages].map((image, i) => (
                    <div key={i} className="mb-4">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-[280px] object-cover rounded-2xl shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2 - Scrolling Down */}
              <div className="relative overflow-hidden rounded-3xl mt-12">
                <div className="animate-scroll-down">
                  {/* Duplicate images for seamless loop */}
                  {[...scrollingImages, ...scrollingImages].map((image, i) => (
                    <div key={i} className="mb-4">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-[280px] object-cover rounded-2xl shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className={`space-y-6 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <>
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 ${adminPreview ? "cursor-pointer" : ""}`}
                    onClick={(event) => handleAdminFocus(event, "eyebrow")}
                    role={adminPreview ? "button" : undefined}
                    tabIndex={adminPreview ? 0 : undefined}
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                      {content?.eyebrow || "RÉGIÓK"}
                    </span>
                  </div>
                  <h2
                    className={`text-4xl md:text-5xl font-bold text-foreground leading-tight ${adminPreview ? "cursor-pointer" : ""}`}
                    style={{ fontFamily: "'Sora', sans-serif" }}
                    onClick={(event) => handleAdminFocus(event, "title")}
                    role={adminPreview ? "button" : undefined}
                    tabIndex={adminPreview ? 0 : undefined}
                  >
                    {content?.title}
                  </h2>

                  <p
                    className={`text-lg text-muted-foreground leading-relaxed ${adminPreview ? "cursor-pointer" : ""}`}
                    onClick={(event) => handleAdminFocus(event, "description")}
                    role={adminPreview ? "button" : undefined}
                    tabIndex={adminPreview ? 0 : undefined}
                  >
                    {content?.description}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-4">
                    {(content?.chips || []).map((region, i) => (
                      <Button
                        key={i}
                        asChild={Boolean(regionAnchors[region])}
                        variant="outline"
                        className="rounded-full border-border bg-muted/50 hover:border-primary hover:bg-primary/5 text-sm font-medium text-foreground px-4 py-2 h-auto"
                        onClick={(event) => handleAdminFocus(event, "chips")}
                      >
                        {regionAnchors[region] ? (
                          <Link to={`/regiok#${regionAnchors[region]}`}>{region}</Link>
                        ) : (
                          <span>{region}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </>
              )}

              {isLoading ? (
                <Skeleton className="h-12 w-48 mt-2" />
              ) : (
                <Button
                  size="lg"
                  className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105 hover:shadow-xl mt-6"
                  asChild
                >
                  {content?.buttonUrl?.startsWith("http") ? (
                    <a
                      href={content.buttonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                      onClick={(event) => handleAdminFocus(event, "buttonText")}
                    >
                      {content?.buttonText || "Fedezd fel a régiókat"}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <Link
                      to={content?.buttonUrl || "/regiok"}
                      className="inline-flex items-center"
                      onClick={(event) => handleAdminFocus(event, "buttonText")}
                    >
                      {content?.buttonText || "Fedezd fel a régiókat"}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </Button>
              )}
          </div>
        </div>
      </div>
    </section>
  );
};
