import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import regionsImage from "@/assets/regions-collage.jpg";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const RegionsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);

  return (
    <section ref={sectionRef} className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Images */}
          <div 
            className={`relative transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl group cursor-pointer">
              <img 
                src={regionsImage}
                alt="Régiók" 
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
          </div>

          {/* Content */}
          <div 
            className={`space-y-6 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                RÉGIÓK
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              ismerd meg partnereinket!
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              A MIK tagszervezetei a Kárpát-medence minden régiójában képviselik a magyar ifjúság érdekeit. Erdélytől Felvidékig, Kárpátaljától a diaszpóráig – minden sarokban ott vagyunk, ahol magyarok élnek.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              {["Erdély", "Felvidék", "Kárpátalja", "Vajdaság", "Horvátország", "Szlovénia"].map((region, i) => (
                <span 
                  key={i}
                  className="px-4 py-2 bg-muted/50 rounded-full text-sm font-medium text-foreground border border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                >
                  {region}
                </span>
              ))}
            </div>

            <Button 
              size="lg" 
              className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105 hover:shadow-xl mt-6"
            >
              FEDEZD FEL A RÉGIÓKAT
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
