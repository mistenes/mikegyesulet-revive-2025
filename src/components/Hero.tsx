import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import mikTeam from "@/assets/mik-team.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSectionContent, PAGE_CONTENT_EVENT } from "@/services/pageContentService";
import { defaultPageContent } from "@/data/defaultPageContent";

type HeroContent = {
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
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
  const [content, setContent] = useState<HeroContent>({
    ...defaultPageContent.hero_content.hu,
  });
  const [stats, setStats] = useState<Array<{
    value: string;
    label: string;
  }>>(defaultPageContent.hero_stats.hu?.stats || []);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const heroContent = await getSectionContent("hero_content");
        const heroStats = await getSectionContent("hero_stats");

        if (!active) return;

        setContent(
          (heroContent[language] || heroContent.hu || defaultPageContent.hero_content.hu) as HeroContent,
        );
        setStats(
          (heroStats[language]?.stats || heroStats.hu?.stats || defaultPageContent.hero_stats.hu?.stats || []) as HeroStats["stats"],
        );
      } catch (error) {
        console.error("Failed to load hero content", error);
        if (!active) return;
        setContent(defaultPageContent.hero_content[language] || defaultPageContent.hero_content.hu);
        setStats(defaultPageContent.hero_stats[language]?.stats || defaultPageContent.hero_stats.hu?.stats || []);
      }
    };

    loadContent();

    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionKey: string }>).detail;
      if (!detail) return;
      if (["hero_content", "hero_stats"].includes(detail.sectionKey)) {
        loadContent();
      }
    };

    window.addEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
    return () => {
      active = false;
      window.removeEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
    };
  }, [language]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-3xl" style={{
              fontFamily: "'Sora', sans-serif",
            }}>
              {content.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              {content.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105 hover:shadow-xl" asChild>
                <a href={content.primaryButtonUrl} target="_blank" rel="noopener noreferrer">
                  {content.primaryButtonText}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="font-semibold px-8 py-6 text-base border-2 hover:bg-muted/50 transition-all duration-300" asChild>
                <Link to="/rolunk">
                  {content.secondaryButtonText}
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
              {stats.map((stat, index) => (
                <div key={index} className="animate-fade-in" style={{
                  animationDelay: `${0.2 + index * 0.1}s`,
                }}>
                  <div className="text-3xl font-bold text-primary" style={{
                    fontFamily: "'Sora', sans-serif",
                  }}>
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
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img
                src={content.imageUrl || mikTeam}
                alt="MIK Team"
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
