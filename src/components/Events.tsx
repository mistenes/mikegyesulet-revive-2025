import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

export const Events = () => {
  const events = [
    {
      title: "Ifjúsági Fórum 2025",
      date: "Március 15-17",
      location: "Budapest",
      attendees: "300+",
      description: "Háromnapos esemény, ahol megvitatjuk a fiatalokat érintő legfontosabb kérdéseket.",
    },
    {
      title: "Közösségépítő Tábor",
      date: "Július 5-10",
      location: "Kárpátalja",
      attendees: "150+",
      description: "Nyári tábor, ahol erősítjük a határon átnyúló kapcsolatokat.",
    },
    {
      title: "Évzáró Konferencia",
      date: "November 20-22",
      location: "Kolozsvár",
      attendees: "400+",
      description: "Az év legnagyobb eseménye, ahol összegezzük az eredményeket és tervezzük a jövőt.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            Események
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Csatlakozz programjainkhoz és légy részese a változásnak!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {events.map((event, index) => (
            <Card
              key={index}
              className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative space-y-4">
                <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date}</span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {event.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {event.description}
                </p>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{event.attendees} résztvevő</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                >
                  Részletek
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-8 shadow-md hover:shadow-glow transition-all duration-300">
            Összes Esemény
          </Button>
        </div>
      </div>
    </section>
  );
};
