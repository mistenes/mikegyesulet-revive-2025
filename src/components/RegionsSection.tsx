import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSectionContent, PAGE_CONTENT_EVENT } from "@/services/pageContentService";

// Import region images
import erdelyImg from "@/assets/region-erdely.jpg";
import felvidekImg from "@/assets/region-felvidek.jpg";
import karpataljaImg from "@/assets/region-karpattalja.jpg";
import vajdasagImg from "@/assets/region-vajdasag.jpg";
import youthImg from "@/assets/region-youth-1.jpg";
import cultureImg from "@/assets/region-culture.jpg";

const scrollImages = [
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
  chips?: string[];
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
  const [content, setContent] = useState<RegionsContent>({
    eyebrow: "RÉGIÓK",
    title: "Ismerd meg partnereinket!",
    description: "A MIK tagszervezetei a Kárpát-medence minden régiójában képviselik a magyar ifjúság érdekeit.",
    buttonText: "Fedezd fel a régiókat",
    chips: ["Erdély", "Felvidék", "Kárpátalja", "Vajdaság", "Horvátország", "Szlovénia"],
  });

  useEffect(() => {
    const loadContent = () => {
      const section = getSectionContent("regions_section");
      setContent((section[language] || section.hu || content) as RegionsContent);
    };

    loadContent();

    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionKey: string }>).detail;
      if (detail?.sectionKey === "regions_section") {
        loadContent();
      }
    };

    window.addEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
    return () => window.removeEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
  }, [language]);

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
                  {[...scrollImages, ...scrollImages].map((image, i) => (
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
                  {[...scrollImages, ...scrollImages].map((image, i) => (
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                {content.eyebrow || "RÉGIÓK"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {content.title}
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {content.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              {(content.chips || []).map((region, i) => (
                <Button
                  key={i}
                  asChild={Boolean(regionAnchors[region])}
                  variant="outline"
                  className="rounded-full border-border bg-muted/50 hover:border-primary hover:bg-primary/5 text-sm font-medium text-foreground px-4 py-2 h-auto"
                >
                  {regionAnchors[region] ? (
                    <Link to={`/rolunk#${regionAnchors[region]}`}>{region}</Link>
                  ) : (
                    <span>{region}</span>
                  )}
                </Button>
              ))}
            </div>

            <Button
              size="lg"
              className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105 hover:shadow-xl mt-6"
              asChild
            >
              <Link to="/regiok">
                {content.buttonText || "Fedezd fel a régiókat"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
