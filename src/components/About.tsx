import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import umbrellaImage from "@/assets/umbrella-person.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSectionContent } from "@/hooks/useSectionContent";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocalizedPath } from "@/lib/localePaths";

type AboutContent = {
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonUrl?: string;
  ctaBadge?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButton?: string;
  ctaButtonUrl?: string;
  imageUrl?: string;
};

export const About = () => {
  const { language } = useLanguage();
  const { content: aboutSection, isLoading } = useSectionContent("about_section");

  const content = useMemo<AboutContent | null>(() => {
    if (!aboutSection) return null;
    return (aboutSection[language] || aboutSection.hu || null) as AboutContent | null;
  }, [aboutSection, language]);

  return (
    <section id="rolunk" className="py-24 bg-background">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-in">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <>
                {content?.badge && (
                  <p className="text-sm font-semibold text-foreground uppercase tracking-wider">{content.badge}</p>
                )}
                <h2
                  className="text-4xl md:text-5xl font-bold text-foreground leading-tight"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {content?.title}
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  {content?.description}
                </p>
              </>
            )}

            {isLoading ? (
              <Skeleton className="h-12 w-44" />
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="group border-2 border-foreground hover:bg-foreground hover:text-background font-semibold px-8 py-6 text-base transition-all duration-300"
                asChild
              >
                {content?.buttonUrl?.startsWith("http") ? (
                  <a
                    href={content.buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    {content?.buttonText}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <Link
                    to={getLocalizedPath(content?.buttonUrl || "/rolunk", language)}
                    className="inline-flex items-center"
                  >
                    {content?.buttonText}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </Button>
            )}
          </div>

          {/* Right Image */}
          <div className="relative animate-slide-in" style={{ animationDelay: "0.2s" }}>
            {isLoading ? (
              <Skeleton className="rounded-3xl h-[440px] w-full" />
            ) : (
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={content?.imageUrl || umbrellaImage}
                  alt={content?.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Overlay Card */}
            <div className="absolute bottom-8 right-8 bg-background/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-sm border border-border">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-10 w-28" />
                </div>
              ) : (
                <>
                  {content?.ctaBadge && (
                    <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">{content.ctaBadge}</p>
                  )}
                  <h3 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {content?.ctaTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {content?.ctaDescription}
                  </p>
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary-glow p-0 h-auto font-semibold group"
                    asChild
                  >
                    {content?.ctaButtonUrl?.startsWith("http") ? (
                      <a href={content.ctaButtonUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                        {content?.ctaButton}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ) : (
                      <Link to={content?.ctaButtonUrl || "#"} className="inline-flex items-center">
                        {content?.ctaButton}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
