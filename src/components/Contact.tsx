import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Send } from "lucide-react";

export const Contact = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            Lépj Kapcsolatba Velünk
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Kérdésed van? Szeretnél csatlakozni? Írj nekünk bizalommal!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 bg-card border-border shadow-md">
            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Név
                </label>
                <Input
                  id="name"
                  placeholder="Teljes neved"
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@pelda.hu"
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Üzenet
                </label>
                <Textarea
                  id="message"
                  placeholder="Írd meg üzeneted..."
                  rows={5}
                  className="border-border focus:ring-primary resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-semibold py-6 shadow-md hover:shadow-glow transition-all duration-300"
              >
                Üzenet Küldése
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-8 bg-card border-border hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-primary rounded-xl shadow-md group-hover:shadow-glow transition-all duration-300">
                  <Mail className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Email</h3>
                  <p className="text-muted-foreground">info@mikegyesulet.hu</p>
                  <p className="text-muted-foreground">kapcsolat@mikegyesulet.hu</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card border-border hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-primary rounded-xl shadow-md group-hover:shadow-glow transition-all duration-300">
                  <MessageSquare className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Közösségi Média</h3>
                  <p className="text-muted-foreground mb-1">Kövesd munkánkat:</p>
                  <div className="flex gap-3 mt-3">
                    <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                      Facebook
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                      Instagram
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-primary text-primary-foreground border-0 shadow-glow">
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                Csatlakozz Hírlevélünkhöz
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Legyél értesülve a legfrissebb eseményekről és hírekről!
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Email címed"
                  className="bg-background/20 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                />
                <Button variant="secondary" className="flex-shrink-0">
                  Feliratkozás
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
