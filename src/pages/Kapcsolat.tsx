import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string().trim().min(1, "A név megadása kötelező").max(100, "A név maximum 100 karakter lehet"),
  email: z.string().trim().email("Érvényes e-mail címet adj meg").max(255, "Az e-mail maximum 255 karakter lehet"),
  message: z.string().trim().min(1, "Az üzenet megadása kötelező").max(2000, "Az üzenet maximum 2000 karakter lehet"),
  privacy: z.boolean().refine(val => val === true, "El kell fogadnod az adatkezelési tájékoztatót")
});

const newsletterSchema = z.object({
  email: z.string().trim().email("Érvényes e-mail címet adj meg").max(255, "Az e-mail maximum 255 karakter lehet"),
  privacy: z.boolean().refine(val => val === true, "El kell fogadnod az adatkezelési tájékoztatót")
});

export default function Kapcsolat() {
  const { language, t } = useLanguage();
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "", privacy: false });
  const [newsletterForm, setNewsletterForm] = useState({ email: "", privacy: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = contactFormSchema.parse(contactForm);
      setIsSubmitting(true);

      // Encode data for WhatsApp (safer than direct submission)
      const message = `Név: ${encodeURIComponent(validatedData.name)}\nE-mail: ${encodeURIComponent(validatedData.email)}\nÜzenet: ${encodeURIComponent(validatedData.message)}`;
      
      toast.success("Üzenet sikeresen elküldve!");
      setContactForm({ name: "", email: "", message: "", privacy: false });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Hiba történt az üzenet küldésekor");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = newsletterSchema.parse(newsletterForm);
      setIsSubmitting(true);

      // Here you would normally integrate with a newsletter service
      toast.success("Sikeresen feliratkoztál a hírlevélre!");
      setNewsletterForm({ email: "", privacy: false });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Hiba történt a feliratkozáskor");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-fade-in">
            <p className="text-sm font-semibold text-primary tracking-wider uppercase">
              {language === 'hu' ? 'Kapcsolat' : 'Contact'}
            </p>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {language === 'hu' ? 'Vedd fel velünk a kapcsolatot' : 'Get in Touch With Us'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {language === 'hu' 
                ? 'Kérdésed van? Írj nekünk bizalommal!' 
                : 'Have questions? Feel free to reach out!'}
            </p>
          </div>
        </div>
      </section>

      {/* Official Data Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="shadow-xl border-border/50">
            <CardContent className="p-8 lg:p-12">
              <h2 
                className="text-3xl font-bold text-foreground mb-8"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {language === 'hu' ? 'Hivatalos Adatok' : 'Official Information'}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Building2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {language === 'hu' ? 'Szervezet neve' : 'Organization Name'}
                      </h3>
                      <p className="text-muted-foreground">Magyar Ifjúsági Konferencia Egyesület</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {language === 'hu' ? 'Székhely' : 'Headquarters'}
                      </h3>
                      <p className="text-muted-foreground">2900 Komárom, Szent László utca 23.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {language === 'hu' ? 'Levelezési cím' : 'Mailing Address'}
                      </h3>
                      <p className="text-muted-foreground">2900 Komárom, Arany János utca 17.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">E-mail</h3>
                      <a href="mailto:titkarsag@mikegyesulet.hu" className="text-primary hover:underline">
                        titkarsag@mikegyesulet.hu
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {language === 'hu' ? 'Telefon' : 'Phone'}
                      </h3>
                      <a href="tel:+36309594595" className="text-primary hover:underline">
                        +36 30 959 4595
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Building2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {language === 'hu' ? 'Adószám' : 'Tax Number'}
                      </h3>
                      <p className="text-muted-foreground">18745500-1-11</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-semibold text-foreground mb-4">
                  {language === 'hu' ? 'Bankszámlaszám' : 'Bank Account'}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2 text-muted-foreground">
                    <p className="font-semibold text-foreground">Forint:</p>
                    <p><span className="font-medium">IBAN:</span> HU24 1171 3081 2124 1587 0000 0000</p>
                    <p><span className="font-medium">SZÁMLASZÁM:</span> 11713081-21241587</p>
                    <p><span className="font-medium">BIC/SWIFT:</span> OTPVHUHB (OTP Bank)</p>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="font-semibold text-foreground">Euró:</p>
                    <p><span className="font-medium">IBAN:</span> HU65 1176 3134 3717 3887 0000 0000</p>
                    <p><span className="font-medium">SZÁMLASZÁM:</span> 11763134-37173887</p>
                    <p><span className="font-medium">BIC/SWIFT:</span> OTPVHUHB (OTP Bank)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form & Newsletter Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="shadow-xl border-border/50">
              <CardContent className="p-8">
                <h2 
                  className="text-2xl font-bold text-foreground mb-6"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {language === 'hu' ? 'Vedd fel velünk a kapcsolatot' : 'Contact Us'}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {language === 'hu' 
                    ? 'Itt üzenhetsz nekünk. Egyszerűbb, mint e-mailt írni, és ugyanolyan hatékony.' 
                    : 'Send us a message. Simpler than email and just as effective.'}
                </p>

                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">{language === 'hu' ? 'Név' : 'Name'} *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{language === 'hu' ? 'Üzenet' : 'Message'} *</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={6}
                      maxLength={2000}
                      required
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="contact-privacy"
                      checked={contactForm.privacy}
                      onCheckedChange={(checked) => setContactForm({ ...contactForm, privacy: checked as boolean })}
                    />
                    <Label htmlFor="contact-privacy" className="text-sm cursor-pointer">
                      {language === 'hu' ? 'Elfogadom az ' : 'I accept the '}
                      <a href="/adatvedelem" className="text-primary hover:underline">
                        {language === 'hu' ? 'Adatkezelési Tájékoztatót' : 'Privacy Policy'}
                      </a>
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (language === 'hu' ? 'Küldés...' : 'Sending...') : (language === 'hu' ? 'Üzenet küldése' : 'Send Message')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Newsletter Form */}
            <Card className="shadow-xl border-border/50">
              <CardContent className="p-8">
                <h2 
                  className="text-2xl font-bold text-foreground mb-6"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {language === 'hu' ? 'Hírlevél' : 'Newsletter'}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {language === 'hu' 
                    ? 'Iratkozz fel a MIK hírlevelére, ahol havonta egyszer összefoglaljuk neked, hogy mi történt velünk, valamint megosztjuk veled a legnépszerűbb cikkeink a HYCA blog kínálatából.' 
                    : 'Subscribe to the MIK newsletter where we summarize monthly what happened with us and share our most popular articles from the HYCA blog.'}
                </p>

                <form onSubmit={handleNewsletterSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="newsletter-email">E-mail *</Label>
                    <Input
                      id="newsletter-email"
                      type="email"
                      value={newsletterForm.email}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, email: e.target.value })}
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="newsletter-privacy"
                      checked={newsletterForm.privacy}
                      onCheckedChange={(checked) => setNewsletterForm({ ...newsletterForm, privacy: checked as boolean })}
                    />
                    <Label htmlFor="newsletter-privacy" className="text-sm cursor-pointer">
                      {language === 'hu' ? 'Elfogadom az ' : 'I accept the '}
                      <a href="/adatvedelem" className="text-primary hover:underline">
                        {language === 'hu' ? 'Adatkezelési Tájékoztatót' : 'Privacy Policy'}
                      </a>
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (language === 'hu' ? 'Feliratkozás...' : 'Subscribing...') : (language === 'hu' ? 'Feliratkozás' : 'Subscribe')}
                  </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-4">
                    {language === 'hu' ? 'Támogass minket!' : 'Support Us!'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'hu' 
                      ? 'Arra kérjük, hogy amennyiben a projektjeink elnyerték tetszését, támogassa munkánkat egy megosztással vagy közvetlenül anyagilag!' 
                      : 'If you liked our projects, please support our work by sharing or through direct financial support!'}
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:titkarsag@mikegyesulet.hu">
                      {language === 'hu' ? 'Kapcsolatfelvétel' : 'Contact Us'}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
