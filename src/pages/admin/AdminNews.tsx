import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { deleteNews, getAdminNews, updateNews } from "@/services/newsService";
import type { NewsArticle, NewsInput } from "@/types/news";
import {
  Check,
  Grid,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminNews() {
  const { isLoading, session } = useAdminAuthGuard();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    void loadArticles();
  }, [session]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { items } = await getAdminNews({ pageSize: 300 });
      setArticles(items);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült betölteni a híreket";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === articles.length) {
        return new Set();
      }
      return new Set(articles.map((article) => article.id));
    });
  };

  const buildPayload = (article: NewsArticle, published: boolean): NewsInput => ({
    categoryId: article.categoryId || null,
    category: article.category,
    categoryTranslations: article.categoryTranslations,
    imageUrl: article.imageUrl,
    imageAlt: article.imageAlt,
    sticky: Boolean(article.sticky),
    date: article.date,
    languageAvailability: article.languageAvailability,
    published,
    translations: article.translations,
  });

  const handleBulkAction = async (action: "publish" | "draft" | "delete") => {
    if (selectedIds.size === 0) {
      toast.message("Nincs kiválasztott hír");
      return;
    }

    setBulkLoading(true);
    try {
      if (action === "delete") {
        for (const id of selectedIds) {
          await deleteNews(id);
        }
        setArticles((prev) => prev.filter((article) => !selectedIds.has(article.id)));
        toast.success("A kiválasztott hírek törölve");
      } else {
        const targetPublished = action === "publish";
        const updates: NewsArticle[] = [];

        for (const id of selectedIds) {
          const article = articles.find((item) => item.id === id);
          if (!article) continue;
          const updated = await updateNews(id, buildPayload(article, targetPublished));
          updates.push(updated);
        }

        setArticles((prev) =>
          prev.map((article) => updates.find((item) => item.id === article.id) || article),
        );
        toast.success(targetPublished ? "Hírek publikálva" : "Hírek vázlatra állítva");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "A művelet nem sikerült";
      toast.error(message);
    } finally {
      setBulkLoading(false);
      setSelectedIds(new Set());
    }
  };

  const handleDelete = async (id: string) => {
    const article = articles.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Biztosan törlöd a(z) "${article?.translations.hu.title || "hír"}" hírt?`,
    );
    if (!confirmed) return;

    try {
      await deleteNews(id);
      setArticles((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Hír törölve");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült törölni a hírt";
      toast.error(message);
    }
  };

  const handleSinglePublishToggle = async (article: NewsArticle, published: boolean) => {
    try {
      const updated = await updateNews(article.id, buildPayload(article, published));
      setArticles((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(published ? "Hír publikálva" : "Hír vázlatra állítva");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült frissíteni";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              Hírek listája
            </h1>
            <p className="text-muted-foreground">Publikált és vázlat hírek kezelése, tömeges műveletekkel.</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/admin/news/new-article">
              <Plus className="h-4 w-4" />
              Új hír
            </Link>
          </Button>
        </div>

        <Card className="p-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Checkbox id="select-all" checked={selectedIds.size === articles.length && articles.length > 0} onCheckedChange={toggleSelectAll} />
            <label htmlFor="select-all" className="text-sm">
              Összes kijelölése ({selectedIds.size}/{articles.length})
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              aria-label="Kártyás nézet"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              aria-label="Listás nézet"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkAction("publish")}
              disabled={selectedIds.size === 0 || bulkLoading}
              className="gap-2"
            >
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Publikálás
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("draft")}
              disabled={selectedIds.size === 0 || bulkLoading}
              className="gap-2"
            >
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />} Vázlat
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction("delete")}
              disabled={selectedIds.size === 0 || bulkLoading}
              className="gap-2"
            >
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />} Törlés
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-10">Hírek betöltése...</div>
          ) : articles.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">Nincs még hír</div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <article key={article.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(article.id)}
                        onCheckedChange={() => toggleSelect(article.id)}
                        aria-label="Hír kijelölése"
                      />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{article.category || "Nincs kategória"}</p>
                        <h3 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                          {article.translations.hu.title || article.translations.en.title || "Cím nélkül"}
                        </h3>
                      </div>
                    </div>
                    <Badge variant={article.published ? "default" : "outline"}>
                      {article.published ? "Publikált" : "Vázlat"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.translations.hu.excerpt || article.translations.en.excerpt || "Nincs kivonat"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {article.date
                        ? new Date(article.date).toLocaleDateString("hu-HU")
                        : article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString("hu-HU")
                          : "Nincs dátum"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Szerkesztés">
                        <Link to={`/admin/news/new-article?id=${article.id}`} state={{ article }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="Törlés"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSinglePublishToggle(article, true)}>
                            Publikálás
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSinglePublishToggle(article, false)}>
                            Vázlat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {articles.map((article) => (
                <div key={article.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(article.id)}
                      onCheckedChange={() => toggleSelect(article.id)}
                      aria-label="Hír kijelölése"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={article.published ? "default" : "outline"}>
                          {article.published ? "Publikált" : "Vázlat"}
                        </Badge>
                        {article.languageAvailability && (
                          <Badge variant="secondary">{article.languageAvailability.toUpperCase()}</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {article.translations.hu.title || article.translations.en.title || "Cím nélkül"}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.translations.hu.excerpt || article.translations.en.excerpt || "Nincs kivonat"}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {article.date
                          ? new Date(article.date).toLocaleDateString("hu-HU")
                          : article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString("hu-HU")
                            : "Nincs dátum"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <Link to={`/admin/news/new-article?id=${article.id}`} state={{ article }}>
                        <Pencil className="h-4 w-4" />
                        Szerkesztés
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSinglePublishToggle(article, !article.published)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {article.published ? "Vázlat" : "Publikálás"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-destructive"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash className="h-4 w-4" />
                      Törlés
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
