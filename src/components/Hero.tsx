import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import mikTeam from "@/assets/mik-team.jpg";
import puzzleLogo from "@/assets/puzzle-logo.png";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              Üdvözlünk a Magyar Ifjúsági Konferencia honlapján!
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              Akár a Kárpát-medencében, és azon kívül élő magyarság, akár szervezetünk érdekelnek, itt mindent megtalálsz.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                className="group bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-6 text-base transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                CSATLAKOZZ HOZZÁNK
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="font-semibold px-8 py-6 text-base border-2 hover:bg-muted/50 transition-all duration-300"
              >
                TUDJ MEG TÖBBET
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
              {[
                { value: "10+", label: "Régió" },
                { value: "2000+", label: "Tagok" },
                { value: "100+", label: "Események" },
              ].map((stat, index) => (
                <div 
                  key={index} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <div className="text-3xl font-bold text-primary" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image with Puzzle Overlay */}
          <div className="relative animate-slide-in-right lg:animate-slide-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img 
                src={mikTeam} 
                alt="MIK Team" 
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
              
              {/* Puzzle Logo Overlay */}
              <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 animate-bounce-in" style={{ animationDelay: "0.6s" }}>
                <div className="bg-background rounded-full p-8 shadow-2xl border-8 border-background hover:scale-110 transition-transform duration-500 cursor-pointer">
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
