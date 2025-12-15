import type React from "react";
import { useMemo, useRef } from "react";
import { TrendingUp, Users, Globe, Award } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSectionContent } from "@/hooks/useSectionContent";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";

const iconMap = [Users, Globe, TrendingUp, Award];

type ImpactStat = {
  value: string;
  label: string;
  description?: string;
};

type ImpactContent = {
  badge?: string;
  title?: string;
  description?: string;
  stats?: ImpactStat[];
};

export const ImpactStats = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const { language } = useLanguage();
  const adminPreview = isAdminPreview();
  const { content: sectionContent } = useSectionContent("impact_section");

  const content = useMemo<ImpactContent>(() => {
    const localized = (sectionContent?.[language] || sectionContent?.hu) as ImpactContent | undefined;
    const fallback = (defaultPageContent.impact_section?.[language] || defaultPageContent.impact_section?.hu) as
      | ImpactContent
      | undefined;

    return localized || fallback || {};
  }, [language, sectionContent]);

  const stats = useMemo<ImpactStat[]>(() => {
    const localized = (sectionContent?.[language]?.stats || sectionContent?.hu?.stats) as ImpactStat[] | undefined;
    const fallback = (defaultPageContent.impact_section?.[language]?.stats ||
      defaultPageContent.impact_section?.hu?.stats) as ImpactStat[] | undefined;

    return localized || fallback || [];
  }, [language, sectionContent]);

  const handleClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("impact_section", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (sectionContent?.isVisible === false && !adminPreview) return null;

  return (
    <section ref={sectionRef} className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-16">
          <div
            className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
          >
            <p
              className={`text-sm font-semibold text-primary uppercase tracking-wider mb-3 ${adminPreview ? "cursor-pointer" : ""}`}
              onClick={(event) => handleClick(event, "badge")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {content.badge}
            </p>
            <h2
              className={`text-4xl md:text-5xl font-bold text-foreground mb-4 ${adminPreview ? "cursor-pointer" : ""}`}
              style={{ fontFamily: "'Sora', sans-serif" }}
              onClick={(event) => handleClick(event, "title")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {content.title}
            </h2>
            <p
              className={`text-lg text-muted-foreground max-w-2xl mx-auto ${adminPreview ? "cursor-pointer" : ""}`}
              onClick={(event) => handleClick(event, "description")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {content.description}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = iconMap[index] || TrendingUp;
            return (
              <div
                key={index}
                className={`group transition-all duration-700 delay-${index * 100} ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="relative bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  {/* Icon */}
                  <div
                    className={`inline-flex p-4 bg-primary/10 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300 ${adminPreview ? "cursor-pointer" : ""
                      }`}
                    onClick={(event) => handleClick(event, "stats")}
                    role={adminPreview ? "button" : undefined}
                    tabIndex={adminPreview ? 0 : undefined}
                  >
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  {/* Value */}
                  <div className="mb-2">
                    <span
                      className={`text-5xl font-bold text-primary ${adminPreview ? "cursor-pointer" : ""}`}
                      style={{ fontFamily: "'Sora', sans-serif" }}
                      onClick={(event) => handleClick(event, "stats")}
                      role={adminPreview ? "button" : undefined}
                      tabIndex={adminPreview ? 0 : undefined}
                    >
                      {stat.value}
                    </span>
                  </div>

                  {/* Label */}
                  <h3
                    className={`text-xl font-bold text-foreground mb-2 ${adminPreview ? "cursor-pointer" : ""}`}
                    onClick={(event) => handleClick(event, "stats")}
                    role={adminPreview ? "button" : undefined}
                    tabIndex={adminPreview ? 0 : undefined}
                  >
                    {stat.label}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-sm text-muted-foreground ${adminPreview ? "cursor-pointer" : ""}`}
                    onClick={(event) => handleClick(event, "stats")}
                    role={adminPreview ? "button" : undefined}
                    tabIndex={adminPreview ? 0 : undefined}
                  >
                    {stat.description}
                  </p>

                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-primary opacity-5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
