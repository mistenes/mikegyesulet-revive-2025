import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/lib/localePaths";
import { getPublicProjectBySlug } from "@/services/projectsService";
import type { Project } from "@/types/project";
import { ArrowLeft, Calendar, ExternalLink, MapPin } from "lucide-react";

const ProjectPage = () => {
  const { slug } = useParams();
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const loadProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicProjectBySlug(slug, language);
        setProject(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nem sikerült betölteni a projektet";
        setError(message);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [slug, language]);

  const translation = project?.translations[language] || project?.translations.hu;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8 flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to={getLocalizedPath('/projektek', language)}>
                <ArrowLeft className="h-4 w-4" /> Vissza a projektekhez
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-16">Projekt betöltése...</div>
          ) : error || !project || !translation ? (
            <Card className="p-10 text-center space-y-4">
              <p className="text-xl font-semibold">A projekt nem található</p>
              <p className="text-muted-foreground">Lehet, hogy átkerült vagy a kiválasztott nyelven nem érhető el.</p>
              <Button asChild>
                <Link to={getLocalizedPath('/projektek', language)}>Vissza a projektekhez</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="rounded-2xl overflow-hidden shadow-sm border">
                <img
                  src={project.heroImageUrl}
                  alt={project.heroImageAlt || translation.title}
                  className="w-full h-[360px] object-cover"
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-primary text-sm font-semibold uppercase tracking-wide">Projekt</p>
                  <h1 className="text-4xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {translation.title}
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                    {translation.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-4 flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Helyszín</p>
                      <p className="font-semibold">{project.location || "-"}</p>
                    </div>
                  </Card>
                  <Card className="p-4 flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Időszak</p>
                      <p className="font-semibold">{project.dateRange || "-"}</p>
                    </div>
                  </Card>
                  <Card className="p-4 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {project.languageAvailability === "both"
                        ? "HU/EN"
                        : project.languageAvailability.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm text-muted-foreground">Elérhető nyelv</p>
                      <p className="font-semibold">
                        {project.languageAvailability === "both"
                          ? "Magyar és angol"
                          : project.languageAvailability === "hu"
                          ? "Csak magyar"
                          : "Csak angol"}
                      </p>
                    </div>
                  </Card>
                </div>

                {project.linkUrl && (
                  <div className="pt-2">
                    <Button asChild variant="secondary" className="gap-2">
                      <a href={project.linkUrl} target="_blank" rel="noreferrer">
                        Külső hivatkozás <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectPage;
