import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import umbrellaImage from "@/assets/umbrella-person.jpg";

export const About = () => {
  return (
    <section id="rolunk" className="py-24 bg-background">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-in">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wider">RÓLUNK</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              KIK VAGYUNK MI?
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Kattints, hogy megtudd, kik is alkotjuk a MIK-et, hogyan is oszlik meg a munka, 
              vagy ha többet szeretnél megtudni szervezeti struktúránkról.
            </p>

            <Button 
              variant="outline"
              size="lg" 
              className="group border-2 border-foreground hover:bg-foreground hover:text-background font-semibold px-8 py-6 text-base transition-all duration-300"
            >
              MAGUNKRÓL
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right Image */}
          <div className="relative animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={umbrellaImage}
                alt="Kik vagyunk mi" 
                className="w-full h-auto"
              />
            </div>
            
            {/* Overlay Card */}
            <div className="absolute bottom-8 right-8 bg-background/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-sm border border-border">
              <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">ALAPÍTÓ NYILATKOZAT</p>
              <h3 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                CÉLKITŰZÉSEINK
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Nyilatkozatukban az alapítók világosan kifejtették, miért van szükség, hogy a magyar ifjúságnak legyen 
                egyeztetőfóruma, hogy hatékonyan képviseljék a Kárpát-medence és a világ magyar ifjúságát.
              </p>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary-glow p-0 h-auto font-semibold group"
              >
                MEGNYITÁS
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
