import type React from "react";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import workspaceImage from "@/assets/workspace.jpg";
import { useSectionContent } from "@/hooks/useSectionContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";
import { getLocalizedPath } from "@/lib/localePaths";

type ClosingContent = {
  badge?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
};

export const ClosingStatements = () => {
  const { language } = useLanguage();
  const adminPreview = isAdminPreview();
  const { content: sectionContent } = useSectionContent("closing_section");

  const content = useMemo<ClosingContent>(() => {
    const localized = (sectionContent?.[language] || sectionContent?.hu) as ClosingContent | undefined;
    const fallback = (defaultPageContent.closing_section?.[language] || defaultPageContent.closing_section?.hu) as
      | ClosingContent
      | undefined;

    return localized || fallback || {};
  }, [language, sectionContent]);

  const handleClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("closing_section", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (sectionContent?.isVisible === false && !adminPreview) return null;

  return (
    <section id="dokumentumok" className="py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative animate-slide-in order-2 lg:order-1">
            <Card className="rounded-3xl overflow-hidden shadow-2xl border-0">
              <img
                src={content.imageUrl || workspaceImage}
                alt={content.title || "Zárónyilatkozatok"}
                className={`w-full h-auto ${adminPreview ? "cursor-pointer" : ""}`}
                onClick={(event) => handleClick(event, "imageUrl")}
                role={adminPreview ? "button" : undefined}
                tabIndex={adminPreview ? 0 : undefined}
              />
            </Card>
          </div>

          {/* Content */}
          <div className="space-y-6 animate-slide-in order-1 lg:order-2" style={{ animationDelay: "0.2s" }}>
            <p
              className={`text-sm font-semibold text-foreground uppercase tracking-wider ${adminPreview ? "cursor-pointer" : ""}`}
              onClick={(event) => handleClick(event, "badge")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {content.badge}
            </p>
            <h2
              className={`text-4xl md:text-5xl font-bold text-foreground leading-tight ${adminPreview ? "cursor-pointer" : ""}`}
              style={{ fontFamily: "'Sora', sans-serif" }}
              onClick={(event) => handleClick(event, "title")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {content.title}
            </h2>

            <p
              className={`text-lg text-muted-foreground leading-relaxed ${adminPreview ? "cursor-pointer" : ""}`}
              onClick={(event) => handleClick(event, "description")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {content.description}
            </p>

            <Button
              size="lg"
              variant="outline"
              className="group border-2 border-foreground hover:bg-foreground hover:text-background font-semibold px-8 py-6 text-base transition-all duration-300"
              onClick={(event) => handleClick(event, "buttonText")}
            >
              {content.buttonUrl?.startsWith("http") ? (
                <a
                  href={content.buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  {content.buttonText}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              ) : (
                <Link
                  to={getLocalizedPath(content.buttonUrl || "/dokumentumok", language)}
                  className="inline-flex items-center gap-2"
                >
                  {content.buttonText}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
