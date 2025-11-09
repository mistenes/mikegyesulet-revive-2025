import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import workspaceImage from "@/assets/workspace.jpg";

export const ClosingStatements = () => {
  return (
    <section id="dokumentumok" className="py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative animate-slide-in order-2 lg:order-1">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={workspaceImage}
                alt="Zárónyilatkozatok" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 animate-slide-in order-1 lg:order-2" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm font-semibold text-foreground uppercase tracking-wider">ZÁRÓNYILATKOZATOK</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              NEM CSAK DOKUMENTUM, HELYZETKÉP
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              A Magyar Ifjúsági Konferencia mindent ülése végén elfogad egy zárónyilatkozatot, 
              ami reflektál az utóbbi fél év történéseire. Ezzel nem csak egy dokumentumot hozunk létre, 
              hanem egy krónikát is, hiszen a zárónyilatkozatok visszaolvasásával nyomon követhetők a 
              Kárpát-medence magyarságát érintő történések.
            </p>

            <Button 
              size="lg" 
              variant="outline"
              className="group border-2 border-foreground hover:bg-foreground hover:text-background font-semibold px-8 py-6 text-base transition-all duration-300"
            >
              ZÁRÓNYILATKOZATOK
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
