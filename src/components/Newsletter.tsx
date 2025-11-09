import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().trim().email("Érvénytelen email cím").max(255),
  privacy: z.boolean().refine(val => val === true, "Az adatkezelési tájékoztató elfogadása kötelező"),
});

export const Newsletter = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      newsletterSchema.parse({ email, privacy });
      setErrors({});
      
      toast({
        title: "Sikeres feliratkozás!",
        description: "Köszönjük, hogy feliratkoztál hírlevelünkre.",
      });
      
      setEmail("");
      setPrivacy(false);
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

  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">HÍRLEVÉL</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              OLVASTAD MÁR?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Iratkozz fel a MIK hírlevelére, ahol havonta egyszer összefoglaljuk neked, hogy mi történt velünk, 
              valamint megosztjuk veled a legnépszerűbb cikkeink a HYCA blog kínálatából.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-background border-border py-6 ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>
              <Button 
                type="submit" 
                className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 transition-all duration-300"
              >
                FELIRATKOZÁS
              </Button>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="newsletter-privacy"
                checked={privacy}
                onCheckedChange={(checked) => setPrivacy(checked as boolean)}
                className={errors.privacy ? 'border-destructive' : ''}
              />
              <label htmlFor="newsletter-privacy" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                Elfogadom az Adatkezelési Tájékoztatót
              </label>
            </div>
            {errors.privacy && <p className="text-sm text-destructive">{errors.privacy}</p>}
          </form>
        </div>
      </div>
    </section>
  );
};
