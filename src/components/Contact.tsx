import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const contactSchema = z.object({
  name: z.string().trim().min(1, "A név megadása kötelező").max(100, "A név maximum 100 karakter lehet"),
  email: z.string().trim().email("Érvénytelen email cím").max(255, "Az email maximum 255 karakter lehet"),
  message: z.string().trim().min(1, "Az üzenet megadása kötelező").max(1000, "Az üzenet maximum 1000 karakter lehet"),
  privacy: z.boolean().refine(val => val === true, "Az adatkezelési tájékoztató elfogadása kötelező"),
});

const newsletterSchema = z.object({
  email: z.string().trim().email("Érvénytelen email cím").max(255),
  privacy: z.boolean().refine(val => val === true, "Az adatkezelési tájékoztató elfogadása kötelező"),
});

export const Contact = () => {
  const { toast } = useToast();
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    privacy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterPrivacy, setNewsletterPrivacy] = useState(false);
  const [newsletterErrors, setNewsletterErrors] = useState<Record<string, string>>({});

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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      newsletterSchema.parse({ email: newsletterEmail, privacy: newsletterPrivacy });
      setNewsletterErrors({});
      
      toast({
        title: "Sikeres feliratkozás!",
        description: "Köszönjük, hogy feliratkoztál hírlevelünkre.",
      });
      
      setNewsletterEmail("");
      setNewsletterPrivacy(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setNewsletterErrors(newErrors);
      }
    }
  };

  const offices = [
    {
      name: "Központi Iroda",
      address: "2900 Komárom, Arany János utca 17.",
      hours: ["H-Cs: 8:30-16:00", "P-V: zárva"],
    },
    {
      name: "Kárpátaljai Iroda",
      address: "Beregszász, Mihók Péter út 4.",
      hours: ["H-K: 8:00-14:00", "Sz-Cs: 12:00-18:00", "P: 8:00-14:00", "Szo-V: zárva"],
    },
  ];

  return (
    <section ref={sectionRef} id="kapcsolat" className="py-20 bg-muted/20">
      <div className="container px-4">
        <div 
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Kapcsolat
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            Lépj Kapcsolatba Velünk
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Contact Form - Takes 2 columns */}
          <Card 
            className={`lg:col-span-2 p-6 bg-card border-border shadow-lg transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
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
                    className={`bg-muted/30 border-border ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`bg-muted/30 border-border ${errors.email ? 'border-destructive' : ''}`}
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
                  className={`bg-muted/30 border-border resize-none ${errors.message ? 'border-destructive' : ''}`}
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
            className={`space-y-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            {/* Quick Contact */}
            <Card className="p-6 bg-gradient-primary text-primary-foreground border-0 shadow-lg">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
                Gyors Elérhetőség
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 opacity-80" />
                  <span>info@mikegyesulet.hu</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 opacity-80" />
                  <span>+36 XX XXX XXXX</span>
                </div>
              </div>
            </Card>

            {/* Office Hours */}
            <Card className="p-6 bg-card border-border shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Nyitvatartás
                </h3>
              </div>
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <div key={index} className="border-t border-border pt-3 first:border-0 first:pt-0">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{office.name}</p>
                        <p className="text-xs text-muted-foreground">{office.address}</p>
                      </div>
                    </div>
                    <div className="ml-6 space-y-1">
                      {office.hours.map((hour, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{hour}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Newsletter Section - Full Width Below */}
        <Card 
          className={`mt-6 p-6 bg-card border-border shadow-lg max-w-7xl mx-auto transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Hírlevél Feliratkozás
              </h3>
              <p className="text-muted-foreground text-sm">
                Havonta egyszer összefoglaljuk a legfontosabb híreket és eseményeket
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Email címed"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className={`bg-muted/30 border-border ${newsletterErrors.email ? 'border-destructive' : ''}`}
                  />
                  {newsletterErrors.email && <p className="text-xs text-destructive mt-1">{newsletterErrors.email}</p>}
                </div>
                <Button 
                  type="submit" 
                  className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-6"
                >
                  Feliratkozás
                </Button>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="newsletter-privacy"
                  checked={newsletterPrivacy}
                  onCheckedChange={(checked) => setNewsletterPrivacy(checked as boolean)}
                />
                <label htmlFor="newsletter-privacy" className="text-xs text-muted-foreground cursor-pointer">
                  Elfogadom az Adatkezelési Tájékoztatót
                </label>
              </div>
              {newsletterErrors.privacy && <p className="text-xs text-destructive">{newsletterErrors.privacy}</p>}
            </form>
          </div>
        </Card>
      </div>
    </section>
  );
};
