import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getPublicProjects } from "@/services/projectsService";
import type { Project } from "@/types/project";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const Projektek = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const { language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const items = await getPublicProjects(language);
        setProjects(items);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [language]);

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
          {loading ? (
            <div className="text-center text-muted-foreground py-12">Projektek betöltése...</div>
          ) : projects.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Hamarosan elérhetőek lesznek a projektjeink.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {projects.map((project, index) => {
                const translation = project.translations[language] || project.translations.hu;

                const slugForLanguage = language === "en" ? project.slugEn : project.slugHu;
                const fallbackSlug = project.slugHu || project.slugEn;
                const projectSlug = slugForLanguage || fallbackSlug;

                return (
                  <Card
                    key={project.id}
                    className="group overflow-hidden bg-card border-border hover:shadow-xl transition-all duration-500"
                    style={{
                      animation: isVisible ? `fadeInUp 0.8s ease-out ${index * 0.15}s both` : "none",
                    }}
                  >
                    {/* Project Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={project.heroImageUrl}
                        alt={project.heroImageAlt || translation.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Project Content */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {translation.title}
                      </h3>

                      <p className="text-muted-foreground mb-6 line-clamp-3">
                        {translation.description}
                      </p>

                      {/* Project Meta Info */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span>{project.location}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span>{project.dateRange}</span>
                        </div>
                      </div>

                      {/* Read More Link */}
                      <div className="flex flex-wrap gap-3">
                        {projectSlug && (
                          <Link
                            to={`/projektek/${projectSlug}`}
                            className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300"
                          >
                            Részletek
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        )}
                        {project.linkUrl && (
                          <a
                            href={project.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-semibold transition-all duration-300"
                          >
                            Külső link
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Projektek;
