import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const NewsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const news = [
    {
      category: "DYLA – 2025-08-11",
      title: "Utazz velünk az USA-ba a DYLA-projektünkkel!",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
    },
    {
      category: "NIS ROADSHOW – 2025-06-03",
      title: "A MIK is részt vesz a NIS Roadshow lebonyolításában",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
    },
    {
      category: "KÖZGYŰLÉS – 2025-05-26",
      title: "45. közgyűlésünk helyszíne Székesfehérvár",
      badge: "ELOLVASOM",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
    },
    {
      category: "ZÁRÓNYILATKOZAT – 2025-05-24",
      title: "ZÁRÓNYILATKOZAT - 44. KÖZGYŰLÉS",
      image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=300&fit=crop",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div 
          className={`mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">
            fRISs hÍREINK, írásaink
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            tájékozódj szülőföldünkről!
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
            Vagy olvass el minden írást a HYCA blogon
          </p>
          <Button variant="outline" className="group border-2 border-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300">
            HYCA BLOG
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {news.map((item, index) => (
            <Card
              key={index}
              className={`group overflow-hidden border-border hover:shadow-xl transition-all duration-700 hover:-translate-y-2 cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {item.badge && (
                  <div className="absolute bottom-4 left-4 bg-background px-4 py-2 rounded-lg shadow-md">
                    <span className="text-xs font-bold text-foreground">{item.badge}</span>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  {item.category}
                </div>
                <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {item.title}
                </h3>
                <div className="pt-2">
                  <span className="inline-flex items-center text-primary hover:text-primary-glow font-semibold text-sm group-hover:gap-3 transition-all">
                    Részletek
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
