import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "A név megadása kötelező").max(100, "A név maximum 100 karakter lehet"),
  email: z.string().trim().email("Érvénytelen email cím").max(255, "Az email maximum 255 karakter lehet"),
  message: z.string().trim().min(1, "Az üzenet megadása kötelező").max(1000, "Az üzenet maximum 1000 karakter lehet"),
  privacy: z.boolean().refine(val => val === true, "Az adatkezelési tájékoztató elfogadása kötelező"),
});

export const Contact = () => {
  const { toast } = useToast();
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

  return (
    <section id="kapcsolat" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">KAPCSOLAT</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            VEDD FEL VELÜNK A KAPCSOLATOT
          </h2>
          <p className="text-lg text-muted-foreground">
            Itt üzenhetsz nekünk. Egyszerűbb, mint e-mailt írni, és ugyanolyan hatékony.
          </p>
        </div>

        <Card className="p-8 md:p-12 bg-card border-border shadow-lg max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                placeholder="Az ön Neve"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`bg-muted/50 border-0 py-6 ${errors.name ? 'border-2 border-destructive' : ''}`}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Az ön E-mail címe"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`bg-muted/50 border-0 py-6 ${errors.email ? 'border-2 border-destructive' : ''}`}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Az ön Üzenete"
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`bg-muted/50 border-0 resize-none ${errors.message ? 'border-2 border-destructive' : ''}`}
              />
              {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={formData.privacy}
                onCheckedChange={(checked) => setFormData({ ...formData, privacy: checked as boolean })}
                className={errors.privacy ? 'border-destructive' : ''}
              />
              <label htmlFor="privacy" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                Elfogadom az Adatkezelési Tájékoztatót
              </label>
            </div>
            {errors.privacy && <p className="text-sm text-destructive">{errors.privacy}</p>}

            <Button 
              type="submit" 
              className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-12 py-6 text-base transition-all duration-300 hover:scale-105"
            >
              KÜLDÉS
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
};
