import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import mikTeam from "@/assets/mik-team.jpg";
import puzzleLogo from "@/assets/puzzle-logo.png";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-in">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              ÜDVÖZLÜNK A MAGYAR IFJÚSÁGI KONFERENCIA HONLAPJÁN!
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Akár a Kárpát-medencében, és azon kívül élő magyarság, akár szervezetünk érdekelnek, itt mindent megtalálsz.
            </p>

            <Button 
              size="lg" 
              className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105"
            >
              TAGSZERVEZETEINK
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right Image with Puzzle Overlay */}
          <div className="relative animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={mikTeam} 
                alt="MIK Team" 
                className="w-full h-auto"
              />
              {/* Puzzle Logo Overlay */}
              <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2">
                <div className="bg-background rounded-full p-8 shadow-2xl border-8 border-background">
                  <img 
                    src={puzzleLogo} 
                    alt="MIK Puzzle Logo" 
                    className="w-48 h-48 animate-float"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
