import type React from "react";
import { useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSectionContent } from "@/hooks/useSectionContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";

type ContactOffice = {
  name?: string;
  address?: string;
  hours?: string[];
};

type ContactContent = {
  badge?: string;
  title?: string;
  description?: string;
  offices?: ContactOffice[];
};

const contactSchema = z.object({
  name: z.string().trim().min(1, "A név megadása kötelező").max(100, "A név maximum 100 karakter lehet"),
  email: z.string().trim().email("Érvénytelen email cím").max(255, "Az email maximum 255 karakter lehet"),
  message: z.string().trim().min(1, "Az üzenet megadása kötelező").max(1000, "Az üzenet maximum 1000 karakter lehet"),
  privacy: z.boolean().refine((val) => val === true, "Az adatkezelési tájékoztató elfogadása kötelező"),
});

export const Contact = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const adminPreview = isAdminPreview();
  const { content: sectionContent } = useSectionContent("contact_section");

  const content = useMemo<ContactContent>(() => {
    const localized = (sectionContent?.[language] || sectionContent?.hu) as ContactContent | undefined;
    const fallback = (defaultPageContent.contact_section?.[language] || defaultPageContent.contact_section?.hu) as
      | ContactContent
      | undefined;

    return localized || fallback || {};
  }, [language, sectionContent]);

  const offices = useMemo<ContactOffice[]>(() => {
    const localized = (sectionContent?.[language]?.offices || sectionContent?.hu?.offices) as ContactOffice[] | undefined;
    const fallback =
      (defaultPageContent.contact_section?.[language]?.offices || defaultPageContent.contact_section?.hu?.offices) as
      | ContactOffice[]
      | undefined;

    return localized || fallback || [];
  }, [language, sectionContent]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    privacy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      contactSchema.parse(formData);
      setErrors({});

      toast({
        title: "Üzenet elküldve!",
        description: "Köszönjük az érdeklődést, hamarosan válaszolunk.",
      });

      setFormData({ name: "", email: "", message: "", privacy: false });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("contact_section", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (content && (content as any).isVisible === false && !adminPreview) return null;

  return (
    <section ref={sectionRef} id="kapcsolat" className="py-20 bg-muted/20">
      <div className="container px-4">
        <div
          className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <p
            className={`text-sm font-semibold text-primary uppercase tracking-wider mb-2 ${adminPreview ? "cursor-pointer" : ""}`}
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

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Contact Form - Takes 2 columns */}
          <Card
            className={`lg:col-span-2 p-6 bg-card border-border shadow-lg transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
          >
            <h3 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
              Üzenet Küldése
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Input
                    placeholder="Név"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`bg-muted/30 border-border ${errors.name ? "border-destructive" : ""}`}
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`bg-muted/30 border-border ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <Textarea
                  placeholder="Üzenet"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`bg-muted/30 border-border resize-none ${errors.message ? "border-destructive" : ""}`}
                />
                {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="privacy"
                  checked={formData.privacy}
                  onCheckedChange={(checked) => setFormData({ ...formData, privacy: checked as boolean })}
                />
                <label htmlFor="privacy" className="text-xs text-muted-foreground cursor-pointer">
                  Elfogadom az Adatkezelési Tájékoztatót
                </label>
              </div>
              {errors.privacy && <p className="text-xs text-destructive">{errors.privacy}</p>}

              <Button
                type="submit"
                className="w-full md:w-auto bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 transition-all duration-300"
              >
                Küldés
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Card>

          {/* Contact Info & Office Hours - Takes 1 column */}
          <div
            className={`space-y-6 transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
          >
            {/* Quick Contact */}
            <Card className="p-6 bg-gradient-primary text-primary-foreground border-0 shadow-lg">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
                Elérhetőségeink
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="text-sm opacity-80">Email</p>
                    <p className="font-semibold">titkarsag@mikegyesulet.hu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <div>
                    <p className="text-sm opacity-80">Telefon</p>
                    <p className="font-semibold">+36 30 959 4595</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Office Locations */}
            <Card className="p-6 bg-card border-border shadow-sm">
              <h3
                className={`text-xl font-bold mb-4 ${adminPreview ? "cursor-pointer" : ""}`}
                style={{ fontFamily: "'Sora', sans-serif" }}
                onClick={(event) => handleClick(event, "offices")}
                role={adminPreview ? "button" : undefined}
                tabIndex={adminPreview ? 0 : undefined}
              >
                Irodáink
              </h3>
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <div key={`${office.name}-${index}`} className="flex gap-3">
                    <div className="mt-1">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{office.name}</p>
                      <p className="text-sm text-muted-foreground">{office.address}</p>
                      {office.hours?.length ? (
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          {office.hours.map((hour, hourIndex) => (
                            <p key={`${hour}-${hourIndex}`}>{hour}</p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
};
