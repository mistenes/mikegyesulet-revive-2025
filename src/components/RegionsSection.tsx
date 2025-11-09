import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import regionsImage from "@/assets/regions-collage.jpg";

export const RegionsSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Images */}
          <div className="relative animate-slide-in">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={regionsImage}
                alt="Régiók" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">RÉGIÓK</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              ISMERD MEG PARTNEREINKET!
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              A MIK tagszervezetei tíz régióból képviselik a világ magyar ifjúságát. 
              Itt róluk, illetve szűk pátriájukról olvashatsz.
            </p>

            <Button 
              size="lg" 
              className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105"
            >
              RÉGIÓK
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
