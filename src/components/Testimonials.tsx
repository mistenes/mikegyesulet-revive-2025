import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const Testimonials = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);

  const testimonials = [
    {
      quote: "A MIK megmutatta, hogy mennyire erős lehet egy közösség, ha együtt dolgozunk céljainkért. Itt találtam meg az igazi társakat, akikkel közösen alakíthatjuk a jövőnket.",
      author: "Kovács Anna",
      role: "Tagszervező",
      region: "Erdély",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    },
    {
      quote: "Évek óta aktív tagja vagyok a MIK-nek, és minden alkalommal megtapasztalom, milyen fontos, hogy legyen egy olyan platform, ahol a fiatalok hangja számít és meghallgatásra talál.",
      author: "Nagy Péter",
      role: "Közgyűlési Tag",
      region: "Felvidék",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    },
    {
      quote: "A konferenciákon való részvétel megváltoztatta az életemet. Rengeteg motivált fiatallal találkoztam, akik ugyanúgy hittek a közös célokban, mint én.",
      author: "Szabó Júlia",
      role: "Projektkoordinátor",
      region: "Kárpátalja",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <div 
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Közösségünk
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Mit Mondanak Tagjaink
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A MIK közösségének tagjai osztják meg tapasztalataikat és élményeiket
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`p-8 bg-card border-border hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="space-y-6">
                {/* Quote Icon */}
                <div className="inline-flex p-3 bg-primary/10 rounded-xl">
                  <Quote className="h-6 w-6 text-primary" />
                </div>

                {/* Testimonial Text */}
                <p className="text-muted-foreground leading-relaxed italic">
                  "{testimonial.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <h4 className="font-bold text-foreground">
                      {testimonial.author}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} · {testimonial.region}
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
