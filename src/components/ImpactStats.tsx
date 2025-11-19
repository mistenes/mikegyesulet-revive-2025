import { useRef } from "react";
import { TrendingUp, Users, Globe, Award } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const ImpactStats = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);

  const stats = [
    {
      icon: Users,
      value: "1000+",
      label: "Tagszervezeteinken keresztül",
      description: "Fiatal magyar közösségi vezetők",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Globe,
      value: "10",
      label: "Régió",
      description: "A Kárpát-medence minden sarkából",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: TrendingUp,
      value: "150+",
      label: "Projekt",
      description: "Sikeres közösségi programok",
      color: "text-primary-glow",
      bgColor: "bg-primary-glow/10",
    },
    {
      icon: Award,
      value: "25+",
      label: "Év",
      description: "Tapasztalat és elkötelezettség",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-16">
          <div 
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Büszkék vagyunk
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Hatásunk Számokban
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Több mint két évtizede építjük a magyar ifjúság jövőjét, és számíthatunk közösségünk erejére
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group transition-all duration-700 delay-${index * 100} ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                {/* Icon */}
                <div className={`inline-flex p-4 ${stat.bgColor} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>

                {/* Value */}
                <div className="mb-2">
                  <span 
                    className={`text-5xl font-bold ${stat.color}`}
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {stat.value}
                  </span>
                </div>

                {/* Label */}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>

                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-primary opacity-5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
