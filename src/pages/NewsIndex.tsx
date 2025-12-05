import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPublicNewsCategories, getPublishedNewsPage } from "@/services/newsService";
import type { NewsArticle, NewsCategory } from "@/types/news";

const PAGE_SIZE = 9;

export default function NewsIndex() {
  const { language } = useLanguage();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const { items, total: totalItems } = await getPublishedNewsPage({
          page,
          pageSize: PAGE_SIZE,
          categoryId: selectedCategory || undefined,
          lang: language === "en" ? "en" : "hu",
        });
        setArticles(items);
        setTotal(totalItems);
      } catch (err) {
        console.error(err);
        setError(language === "hu" ? "Nem sikerült betölteni a híreket." : "Failed to load news.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [language, page, selectedCategory]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const items = await getPublicNewsCategories();
        setCategories(items);
      } catch (err) {
        console.error(err);
      }
    };

    loadCategories();
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const renderArticle = (article: NewsArticle) => {
    const translation = article.translations[language] || article.translations.hu;
    const categoryLabel = article.categoryTranslations?.[language] || article.category;
    const formattedDate = (article.date || article.publishedAt)
      ? new Date(article.date || article.publishedAt).toLocaleDateString(language === "hu" ? "hu-HU" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

    return (
      <Card key={article.id} className="overflow-hidden flex flex-col">
        <Link to={`/news/${translation.slug}`} className="group flex-1 flex flex-col">
          <div className="relative h-48 overflow-hidden bg-muted">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.imageAlt || translation.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
            )}
          </div>
          <div className="p-5 space-y-3 flex-1 flex flex-col">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate || (language === "hu" ? "Dátum nélkül" : "No date")}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
              {translation.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{translation.excerpt}</p>
            <div className="pt-2">
              <Badge variant="secondary">{categoryLabel}</Badge>
            </div>
          </div>
        </Link>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container px-4 pt-32 pb-16 lg:pb-20">
        <div className="max-w-4xl mx-auto text-center mb-10 space-y-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">HYCA Blog</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            {language === "hu" ? "Minden hír" : "All News"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {language === "hu"
              ? "Olvasd el legfrissebb híreinket és beszámolóinkat a HYCA közösségeiből."
              : "Browse the latest stories and updates from HYCA communities."}
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="news-category-filter">
            {language === "hu" ? "Kategória szűrő" : "Filter by category"}
          </label>
          <select
            id="news-category-filter"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{language === "hu" ? "Összes" : "All"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name[language] || category.name.hu}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(PAGE_SIZE)].map((_, idx) => (
              <Card key={idx} className="h-full animate-pulse p-6 space-y-3">
                <div className="h-40 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-full" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground">{error}</div>
        ) : articles.length ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.map(renderArticle)}</div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  aria-label={language === "hu" ? "Előző oldal" : "Previous page"}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  aria-label={language === "hu" ? "Következő oldal" : "Next page"}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            {language === "hu" ? "Még nincsenek publikált hírek." : "No news published yet."}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
