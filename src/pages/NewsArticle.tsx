import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { getNewsBySlug } from "@/services/newsService";
import type { NewsArticle } from "@/types/news";
import { renderMarkdown } from "@/utils/markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EmptyState = ({ message }: { message: string }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
    <p className="text-lg text-muted-foreground">{message}</p>
    <Link to="/">
      <Button variant="outline" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Vissza a főoldalra
      </Button>
    </Link>
  </div>
);

export default function NewsArticlePage() {
  const { slug = "" } = useParams();
  const { language } = useLanguage();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const result = await getNewsBySlug(slug);
        setArticle(result);
      } catch (error) {
        console.error(error);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="container px-4 pt-32 pb-16 lg:pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 border-b-2 border-primary rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-muted-foreground">Betöltés...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="container px-4 pt-32 pb-16 lg:pb-20">
          <EmptyState message={language === "hu" ? "A cikk nem található." : "Article not found."} />
        </main>
        <Footer />
      </div>
    );
  }

  const translation = article.translations[language] || article.translations.hu;
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(language === "hu" ? "hu-HU" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container px-4 pt-32 pb-16 lg:pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between gap-4">
            <Link to="/news">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {language === "hu" ? "Vissza a hírekhez" : "Back to news"}
              </Button>
            </Link>
            <Badge variant={article.published ? "default" : "secondary"} className="uppercase tracking-wide">
              {article.published ? (language === "hu" ? "Publikálva" : "Published") : "Draft"}
            </Badge>
          </div>

          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">{article.category}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              {translation.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {article.imageUrl && (
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <img
                src={article.imageUrl}
                alt={article.imageAlt || translation.title}
                className="w-full h-[420px] object-cover"
              />
            </div>
          )}

          <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(translation.content) }} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
