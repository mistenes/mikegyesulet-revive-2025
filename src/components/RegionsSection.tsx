import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

// Import region images
import erdelyImg from "@/assets/region-erdely.jpg";
import felvidekImg from "@/assets/region-felvidek.jpg";
import karpataljaImg from "@/assets/region-karpattalja.jpg";
import vajdasagImg from "@/assets/region-vajdasag.jpg";
import youthImg from "@/assets/region-youth-1.jpg";
import cultureImg from "@/assets/region-culture.jpg";

const scrollImages = [
  { src: erdelyImg, alt: "Erdély" },
  { src: felvidekImg, alt: "Felvidék" },
  { src: karpataljaImg, alt: "Kárpátalja" },
  { src: vajdasagImg, alt: "Vajdaság" },
  { src: youthImg, alt: "Magyar Ifjúság" },
  { src: cultureImg, alt: "Magyar Kultúra" },
];

export const RegionsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);

  return (
    <section ref={sectionRef} className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Scrolling Images */}
          <div 
            className={`relative h-[600px] transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Column 1 - Scrolling Up */}
              <div className="relative overflow-hidden rounded-3xl">
                <div className="animate-scroll-up">
                  {/* Duplicate images for seamless loop */}
                  {[...scrollImages, ...scrollImages].map((image, i) => (
                    <div key={i} className="mb-4">
                      <img 
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-[280px] object-cover rounded-2xl shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2 - Scrolling Down */}
              <div className="relative overflow-hidden rounded-3xl mt-12">
                <div className="animate-scroll-down">
                  {/* Duplicate images for seamless loop */}
                  {[...scrollImages, ...scrollImages].map((image, i) => (
                    <div key={i} className="mb-4">
                      <img 
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-[280px] object-cover rounded-2xl shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
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
              Ismerd meg partnereinket!
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
