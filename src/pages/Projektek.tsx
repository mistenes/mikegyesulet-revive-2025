import { useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const projects = [
  {
    id: 1,
    title: "Segítség.ma",
    description: "A Segítség ma közösségi startup 2020-ban indult útjára azzal a céllal, hogy segítsen a Kárpát-medencében és a diaszpórában élő honfitársainknak anyanyelvű egészségügyi, mentálhigiénés és speciálpedagógiai ellátáshoz jutni.",
    image: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/620b766b1a2bc42505fe255c_2.png",
    location: "nemzetközi",
    date: "2020.04.01. -",
    link: "https://www.mikegyesulet.hu/projektek/segitseg-ma-projekt"
  },
  {
    id: 2,
    title: "MIK Start",
    description: "A Magyar Ifjúsági Konferencia 2021 áprilisában indította útjára vállalkozásfejlesztési képzését: a MIK Startot, amely segíti a külhonban élő fiatalokat vállalkozásaik létrehozásában",
    image: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/620b767d1f708f9fffe3d854_1.png",
    location: "nemzetközi",
    date: "2021.04.01. -",
    link: "https://www.mikegyesulet.hu/projektek/mik-start-projekt"
  },
  {
    id: 3,
    title: "EVITA",
    description: "2022-ben, a MIK égisze alatt indítottuk el a magyar családokat támogató EVITA elnevezésű projektünket, amely egy, minden magyar édesanya és családalapítás előtt álló fiatal számára könnyen használható e-learning platform.",
    image: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/620b774a6c4afef28fef4658_N%C3%A9vtelen%20(800%20%C3%97%20400%20k%C3%A9ppont)%20(900%20%C3%97%20600%20k%C3%A9ppont).png",
    location: "nemzetközi",
    date: "2021.12.01. -",
    link: "https://www.mikegyesulet.hu/projektek/evita-projekt"
  },
  {
    id: 4,
    title: "Egészségre fel!",
    description: "Egészségre fel! programsorozatunk egy olyan magas szintű, nemzetközi konferencia, ahol elemi párbeszédet tudunk folytatni az egészségügy és fiatalok kapcsolatáról.",
    image: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/6228854c4685065d5231b324_Eg%C3%A9szs%C3%A9gre%20fel!-3.png",
    location: "Magyarország, Románia, Szlovákia",
    date: "2021.09.01. - 2022.09.01.",
    link: "https://www.mikegyesulet.hu/projektek/egeszsegre-fel-projekt"
  }
];

const Projektek = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <section
          ref={sectionRef}
          className={`container mx-auto px-4 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Page Header */}
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-4">
              Projektek
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Ismerd meg a projektjeinket
            </h1>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {projects.map((project, index) => (
              <Card
                key={project.id}
                className="group overflow-hidden bg-card border-border hover:shadow-xl transition-all duration-500"
                style={{
                  animation: isVisible ? `fadeInUp 0.8s ease-out ${index * 0.15}s both` : 'none'
                }}
              >
                {/* Project Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {project.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Project Meta Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{project.location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{project.date}</span>
                    </div>
                  </div>

                  {/* Read More Link */}
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300"
                  >
                    Bővebben
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Projektek;
