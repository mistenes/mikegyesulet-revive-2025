import type React from "react";
import { useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSectionContent } from "@/hooks/useSectionContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";

type Testimonial = {
  quote: string;
  author: string;
  role?: string;
  region?: string;
  image?: string;
};

type TestimonialsContent = {
  badge?: string;
  title?: string;
  description?: string;
  testimonials?: Testimonial[];
};

export const Testimonials = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const { language } = useLanguage();
  const adminPreview = isAdminPreview();
  const { content: sectionContent } = useSectionContent("testimonials_section");

  const content = useMemo<TestimonialsContent>(() => {
    const localized = (sectionContent?.[language] || sectionContent?.hu) as TestimonialsContent | undefined;
    const fallback = (defaultPageContent.testimonials_section?.[language] || defaultPageContent.testimonials_section?.hu) as
      | TestimonialsContent
      | undefined;
    return localized || fallback || {};
  }, [language, sectionContent]);

  const testimonials = useMemo<Testimonial[]>(() => {
    const localized = (sectionContent?.[language]?.testimonials || sectionContent?.hu?.testimonials) as
      | Testimonial[]
      | undefined;
    const fallback =
      (defaultPageContent.testimonials_section?.[language]?.testimonials ||
        defaultPageContent.testimonials_section?.hu?.testimonials) as Testimonial[] | undefined;

    return localized || fallback || [];
  }, [language, sectionContent]);

  const handleClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("testimonials_section", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (sectionContent?.isVisible === false && !adminPreview) return null;

  return (
    <section ref={sectionRef} className="py-24 bg-background">
      <div className="container px-4">
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

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={`${testimonial.author}-${index}`}
              className={`p-8 bg-card border-border hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="space-y-6">
                {/* Quote Icon */}
                <div
                  className={`inline-flex p-3 bg-primary/10 rounded-xl ${adminPreview ? "cursor-pointer" : ""}`}
                  onClick={(event) => handleClick(event, "testimonials")}
                  role={adminPreview ? "button" : undefined}
                  tabIndex={adminPreview ? 0 : undefined}
                >
                  <Quote className="h-6 w-6 text-primary" />
                </div>

                {/* Testimonial Text */}
                <p
                  className={`text-muted-foreground leading-relaxed italic ${adminPreview ? "cursor-pointer" : ""}`}
                  onClick={(event) => handleClick(event, "testimonials")}
                  role={adminPreview ? "button" : undefined}
                  tabIndex={adminPreview ? 0 : undefined}
                >
                  "{testimonial.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  {testimonial.image && (
                    <img
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                    />
                  )}
                  <div>
                    <h4
                      className={`font-bold text-foreground ${adminPreview ? "cursor-pointer" : ""}`}
                      onClick={(event) => handleClick(event, "testimonials")}
                      role={adminPreview ? "button" : undefined}
                      tabIndex={adminPreview ? 0 : undefined}
                    >
                      {testimonial.author}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {[testimonial.role, testimonial.region].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
