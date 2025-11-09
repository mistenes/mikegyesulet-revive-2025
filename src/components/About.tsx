import { Card } from "@/components/ui/card";
import { Heart, Globe, Lightbulb, Users } from "lucide-react";

export const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Közösség",
      description: "Összekapcsoljuk a magyar ifjúságot, létrehozva egy erős, támogató közösséget.",
    },
    {
      icon: Globe,
      title: "Határok Nélkül",
      description: "A Kárpát-medence minden magyarját képviseljük, függetlenül a földrajzi határoktól.",
    },
    {
      icon: Lightbulb,
      title: "Innováció",
      description: "Modern megoldásokkal közelítjük meg a magyar ifjúság kihívásait.",
    },
    {
      icon: Users,
      title: "Együttműködés",
      description: "Hiszünk abban, hogy együtt többet érhetünk el, mint egyedül.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            Rólunk
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A Magyar Ifjúsági Konferencia (MIK) célja, hogy egyeztetőfórum legyen a magyar ifjúság számára, 
            hatékonyan képviselve a Kárpát-medence és a világ magyar ifjúságát.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <Card
              key={index}
              className="p-8 bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-primary rounded-2xl shadow-md group-hover:shadow-glow transition-all duration-300">
                  <value.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="p-10 bg-card border-border shadow-md">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                Alapító Nyilatkozat
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Nyilatkozatukban az alapítók világosan kifejtették, miért van szükség arra, 
                hogy a magyar ifjúságnak legyen egyeztetőfóruma, hogy hatékonyan képviseljék 
                a Kárpát-medence és a világ magyar ifjúságát.
              </p>
              <div className="pt-4">
                <h4 className="text-xl font-semibold text-foreground mb-3">Célkitűzéseink</h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>Az ifjúság képviselete minden releváns fórumon</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>Közösségépítés és együttműködés elősegítése</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>A magyar identitás megerősítése a fiatalok körében</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
