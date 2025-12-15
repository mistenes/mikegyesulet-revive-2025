import type React from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import mikTeam from "@/assets/mik-team.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useSectionContent } from "@/hooks/useSectionContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";
import { getLocalizedPath } from "@/lib/localePaths";

type HeroContent = {
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonUrl?: string;
  secondaryButtonText: string;
  secondaryButtonUrl?: string;
  imageUrl?: string;
};

type HeroStats = {
  stats: Array<{
    value: string;
    label: string;
  }>;
};

export const Hero = () => {
  const { language } = useLanguage();
  const {
    content: heroSection,
    isLoading: heroLoading,
  } = useSectionContent("hero_content");
  const {
    content: statsSection,
    isLoading: statsLoading,
  } = useSectionContent("hero_stats");
  const adminPreview = isAdminPreview();

  const handleHeroClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("hero_content", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const resolveUrl = (url?: string, fallback: string = "#") => {
    const candidate = url?.trim() || fallback;

    if (candidate === "#") return candidate;
    if (
      candidate.startsWith("http") ||
      candidate.startsWith("mailto:") ||
      candidate.startsWith("#")
    ) {
      return candidate;
    }

    const normalized = candidate.startsWith("/") ? candidate : `/${candidate}`;
    return getLocalizedPath(normalized, language);
  };

  const handleStatsClick = (event: React.MouseEvent<HTMLElement>) => {
    if (notifyAdminFocus("hero_stats", "stats")) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const content = useMemo<HeroContent | null>(() => {
    if (!heroSection) return null;
    return (heroSection[language] || heroSection.hu || null) as HeroContent | null;
  }, [heroSection, language]);

  const stats = useMemo<HeroStats["stats"]>(() => {
    if (!statsSection) return [];
    return (
      (statsSection[language]?.stats || statsSection.hu?.stats || []) as HeroStats["stats"]
    ).filter(Boolean);
  }, [language, statsSection]);

  const primaryButtonUrl = resolveUrl(content?.primaryButtonUrl, "#");
  const secondaryButtonUrl = resolveUrl(content?.secondaryButtonUrl, "/rolunk");
  const isSecondaryExternal =
    secondaryButtonUrl.startsWith("http") ||
    secondaryButtonUrl.startsWith("mailto:") ||
    secondaryButtonUrl.startsWith("#");

  const loading = heroLoading || statsLoading;

  if (!loading && !content) {
    return null;
  }

  return (
    <section className="relative min-h-screen flex items-center pt-32 sm:pt-28 md:pt-24 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{
          animationDelay: "2s",
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-in">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ) : (
              <>
                <h1
                  className={`text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-3xl ${adminPreview ? "cursor-pointer" : ""}`}
                  style={{
                    fontFamily: "'Sora', sans-serif",
                  }}
                  onClick={(event) => handleHeroClick(event, "title")}
                  role={adminPreview ? "button" : undefined}
                  tabIndex={adminPreview ? 0 : undefined}
                >
                  {content?.title}
                </h1>

                <p
                  className={`text-xl text-muted-foreground leading-relaxed max-w-xl ${adminPreview ? "cursor-pointer" : ""}`}
                  onClick={(event) => handleHeroClick(event, "description")}
                  role={adminPreview ? "button" : undefined}
                  tabIndex={adminPreview ? 0 : undefined}
                >
                  {content?.description}
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {loading ? (
                <>
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 w-36" />
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    asChild
                    onClick={(event) => handleHeroClick(event, "primaryButtonText")}
                  >
                    <a
                      href={primaryButtonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content?.primaryButtonText}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold px-8 py-6 text-base border-2 hover:bg-muted/50 transition-all duration-300"
                    asChild
                    onClick={(event) => handleHeroClick(event, "secondaryButtonText")}
                  >
                    {isSecondaryExternal ? (
                      <a
                        href={secondaryButtonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {content?.secondaryButtonText}
                      </a>
                    ) : (
                      <Link to={secondaryButtonUrl}>
                        {content?.secondaryButtonText}
                      </Link>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
              {loading
                ? [0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))
                : stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`animate-fade-in ${adminPreview ? "cursor-pointer" : ""}`}
                    style={{
                      animationDelay: `${0.2 + index * 0.1}s`,
                    }}
                    onClick={handleStatsClick}
                    role={adminPreview ? "button" : undefined}
                    tabIndex={adminPreview ? 0 : undefined}
                  >
                    <div
                      className="text-3xl font-bold text-primary"
                      style={{
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-slide-in-right lg:animate-slide-in" style={{
            animationDelay: "0.3s",
          }}>
            {loading ? (
              <Skeleton className="w-full h-[420px] rounded-3xl" />
            ) : (
              <div
                className={`relative rounded-3xl overflow-hidden shadow-2xl group ${adminPreview ? "cursor-pointer" : ""}`}
                onClick={(event) => handleHeroClick(event, "imageUrl")}
                role={adminPreview ? "button" : undefined}
                tabIndex={adminPreview ? 0 : undefined}
              >
                <img
                  src={content?.imageUrl || mikTeam}
                  alt="MIK Team"
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
