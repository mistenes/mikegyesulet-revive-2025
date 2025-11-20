import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import umbrellaImage from "@/assets/umbrella-person.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSectionContent, PAGE_CONTENT_EVENT } from "@/services/pageContentService";

type AboutContent = {
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  ctaBadge?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButton?: string;
};

export const About = () => {
  const { language } = useLanguage();
  const [content, setContent] = useState<AboutContent>({
    badge: "RÓLUNK",
    title: "KIK VAGYUNK MI?",
    subtitle: "Magyar fiatalok összefogása",
    description: "Kattints, hogy megtudd, kik alkotják a MIK-et, hogyan oszlik meg a munka, és ismerd meg szervezeti struktúránkat.",
    buttonText: "Magunkról",
    ctaBadge: "ALAPÍTÓ NYILATKOZAT",
    ctaTitle: "Célkitűzéseink",
    ctaDescription: "Alapítóink világosan leírták, miért kell a magyar fiataloknak közös egyeztető fórum.",
    ctaButton: "Megnyitás",
  });

  useEffect(() => {
    const loadContent = () => {
      const section = getSectionContent("about_section");
      setContent((section[language] || section.hu || content) as AboutContent);
    };

    loadContent();

    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionKey: string }>).detail;
      if (detail?.sectionKey === "about_section") {
        loadContent();
      }
    };

    window.addEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
    return () => window.removeEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
  }, [language]);

  return (
    <section id="rolunk" className="py-24 bg-background">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-in">
            {content.badge && (
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">{content.badge}</p>
            )}
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {content.title}
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {content.description}
            </p>

            <Button
              variant="outline"
              size="lg"
              className="group border-2 border-foreground hover:bg-foreground hover:text-background font-semibold px-8 py-6 text-base transition-all duration-300"
              asChild
            >
              <Link to="/rolunk">
                {content.buttonText}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Right Image */}
          <div className="relative animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={umbrellaImage}
                alt={content.title}
                className="w-full h-auto"
              />
            </div>

            {/* Overlay Card */}
            <div className="absolute bottom-8 right-8 bg-background/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-sm border border-border">
              {content.ctaBadge && (
                <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">{content.ctaBadge}</p>
              )}
              <h3 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                {content.ctaTitle}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {content.ctaDescription}
              </p>
              <Button
                variant="ghost"
                className="text-primary hover:text-primary-glow p-0 h-auto font-semibold group"
              >
                {content.ctaButton}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
