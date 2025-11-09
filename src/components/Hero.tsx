import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Calendar } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-in">
          <div className="inline-block px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-primary/20 mb-4">
            <p className="text-sm font-semibold text-primary">Magyar Ifjúsági Konferencia</p>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Az Ifjúság Hangja,
            <span className="block mt-2 bg-gradient-primary bg-clip-text text-transparent">
              A Jövő Alakítója
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A Kárpát-medence és a világ magyar ifjúságának egyeztetőfóruma, 
            ahol közösen alakítjuk a jövőnket.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button size="lg" className="group bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-8 py-6 text-lg shadow-glow transition-all duration-300 hover:scale-105">
              Csatlakozz Hozzánk
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-primary/20 hover:border-primary hover:bg-primary/5 font-semibold px-8 py-6 text-lg transition-all duration-300">
              Tudj Meg Többet
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            {[
              { icon: Users, label: "Aktív Tagok", value: "500+" },
              { icon: Target, label: "Befejezett Projekt", value: "150+" },
              { icon: Calendar, label: "Események", value: "50+" },
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-background/60 backdrop-blur-md border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
