import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Calendar, Languages, Search, Bold, Italic, Link2, Image, Quote } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createNews, deleteNews, getAdminNews, updateNews } from "@/services/newsService";
import type { NewsArticle, NewsInput, NewsTranslation } from "@/types/news";
import type { LanguageCode } from "@/types/language";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { renderMarkdown } from "@/utils/markdown";

const translationSchema = z.object({
  title: z.string().min(1, "A cím kötelező").max(200),
  slug: z.string().min(1, "A slug kötelező").max(200),
  excerpt: z.string().min(1, "A kivonat kötelező").max(500),
  content: z.string().min(1, "A tartalom kötelező"),
});

const newsSchema = z.object({
  category: z.string().min(1, "A kategória kötelező"),
  imageUrl: z.string().url("Érvényes URL-t adj meg").optional().or(z.literal("")),
  imageAlt: z.string().optional(),
  published: z.boolean(),
  translations: z.object({
    hu: translationSchema,
    en: translationSchema,
  }),
});

const emptyTranslation: NewsTranslation = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
};

const createEmptyTranslations = () => ({
  hu: { ...emptyTranslation },
  en: { ...emptyTranslation },
});

const PAGE_SIZE = 6;

export default function AdminNews() {
  const { isLoading, session } = useAdminAuthGuard();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState<NewsInput>({
    category: "",
    imageUrl: "",
    imageAlt: "",
    published: false,
    translations: createEmptyTranslations(),
  });
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>("hu");
  const [isSaving, setIsSaving] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const contentRefs = useRef<Record<LanguageCode, HTMLTextAreaElement | null>>({ hu: null, en: null });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadArticles = useCallback(async () => {
    setIsListLoading(true);
    try {
      const { items, total: count } = await getAdminNews({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
      });
      setArticles(items);
      setTotal(count);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsListLoading(false);
    }
  }, [debouncedSearch, page, statusFilter]);

  useEffect(() => {
    if (!session) return;
    loadArticles();
  }, [loadArticles, session]);

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

  if (!session) return <Navigate to="/auth" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      newsSchema.parse(formData);

      if (editingArticle) {
        await updateNews(editingArticle.id, formData);
        toast.success("Hír frissítve!");
      } else {
        await createNews(formData);
        toast.success("Hír létrehozva!");
      }

      setIsDialogOpen(false);
      resetForm();
      loadArticles();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error((error as Error).message || "Hiba történt a mentés során");
        console.error(error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      category: article.category,
      imageUrl: article.imageUrl || "",
      imageAlt: article.imageAlt || "",
      published: article.published,
      translations: {
        hu: { ...article.translations.hu },
        en: { ...article.translations.en },
      },
    });
    setActiveLanguage("hu");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a hírt?")) return;

    try {
      await deleteNews(id);
      toast.success("Hír törölve!");
      loadArticles();
    } catch (error) {
      toast.error((error as Error).message || "Nem sikerült törölni a hírt");
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      imageUrl: "",
      imageAlt: "",
      published: false,
      translations: createEmptyTranslations(),
    });
    setEditingArticle(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const updateTranslationField = (lang: LanguageCode, field: keyof NewsTranslation, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          [field]: field === "slug" ? value : value,
        },
      },
    }));
  };

  const setSlugFromTitle = (lang: LanguageCode, title: string) => {
    const slug = generateSlug(title);
    updateTranslationField(lang, "title", title);
    updateTranslationField(lang, "slug", slug);
  };

  const applyFormatting = (
    lang: LanguageCode,
    wrapperStart: string,
    wrapperEnd: string,
    placeholder: string,
  ) => {
    const ref = contentRefs.current[lang];
    if (!ref) return;

    const { selectionStart, selectionEnd, value } = ref;
    const selected = value.substring(selectionStart, selectionEnd) || placeholder;
    const newValue =
      value.substring(0, selectionStart) +
      `${wrapperStart}${selected}${wrapperEnd}` +
      value.substring(selectionEnd);

    updateTranslationField(lang, "content", newValue);

    requestAnimationFrame(() => {
      const cursorPosition = selectionStart + wrapperStart.length + selected.length + wrapperEnd.length;
      ref.focus();
      ref.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const insertLink = (lang: LanguageCode) => {
    const url = prompt("Add meg a hivatkozás URL-jét:");
    if (!url) return;
    applyFormatting(lang, "[", `](${url})`, "link szöveg");
  };

  const insertImage = (lang: LanguageCode) => {
    const url = prompt("Add meg a kép URL-jét vagy hagyd üresen a feltöltéshez:");
    if (url) {
      applyFormatting(lang, "![", `](${url})`, "alternatív szöveg");
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        applyFormatting(lang, "![", `](${dataUrl})`, file.name || "feltöltött kép");
      };
      reader.readAsDataURL(file);
    };

    fileInput.click();
  };

  const handleFeatureImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result as string, imageAlt: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const renderTranslationTab = (lang: LanguageCode) => {
    const translation = formData.translations[lang];
    const isHu = lang === "hu";

    return (
      <TabsContent value={lang} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Cím ({isHu ? "magyar" : "angol"})</Label>
          <Input
            value={translation.title}
            onChange={(e) => setSlugFromTitle(lang, e.target.value)}
            placeholder="Add meg a címet"
          />
        </div>
        <div className="space-y-2">
          <Label>Slug ({isHu ? "magyar" : "angol"})</Label>
          <Input
            value={translation.slug}
            onChange={(e) => updateTranslationField(lang, "slug", generateSlug(e.target.value))}
            placeholder="pelda-cikk"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Kivonat ({isHu ? "magyar" : "angol"})</Label>
            <span className="text-xs text-muted-foreground">{translation.excerpt.length}/500</span>
          </div>
          <Textarea
            value={translation.excerpt}
            onChange={(e) => updateTranslationField(lang, "excerpt", e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tartalom ({isHu ? "magyar" : "angol"})</Label>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => applyFormatting(lang, "**", "**", "félkövér")}
              >
                <Bold className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => applyFormatting(lang, "*", "*", "dőlt")}
              >
                <Italic className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => applyFormatting(lang, "- ", "", "listaelem")}
              >
                •
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => applyFormatting(lang, "> ", "", "idézet")}
              >
                <Quote className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => insertLink(lang)}
              >
                <Link2 className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => insertImage(lang)}
              >
                <Image className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Textarea
            ref={(node) => (contentRefs.current[lang] = node)}
            value={translation.content}
            onChange={(e) => updateTranslationField(lang, "content", e.target.value)}
            rows={10}
          />
        </div>
        <div>
          <Label>Élő előnézet</Label>
          <Card className="p-4 mt-2 prose prose-neutral max-w-none">
            {translation.content ? (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(translation.content) }} />
            ) : (
              <p className="text-muted-foreground text-sm">Add meg a tartalmat a bal oldali szerkesztőben.</p>
            )}
          </Card>
        </div>
      </TabsContent>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Hírek kezelése
            </h1>
            <p className="text-muted-foreground">
              Készíts egyszerre magyar és angol tartalmat, élő előnézettel és borítóképpel.
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Új hír
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingArticle ? "Hír szerkesztése" : "Új hír létrehozása"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Kategória</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Pl. Közösség"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Borítókép</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                      <Button type="button" variant="outline" className="whitespace-nowrap" onClick={() => document.getElementById("feature-upload")?.click()}>
                        Feltöltés
                      </Button>
                      <input id="feature-upload" type="file" accept="image/*" className="hidden" onChange={handleFeatureImageUpload} />
                    </div>
                    <Input
                      value={formData.imageAlt || ""}
                      onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                      placeholder="Alternatív szöveg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Megadhatsz URL-t vagy tölthetsz fel képet (base64) a Render API hiányában.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium">Publikálás</p>
                    <p className="text-sm text-muted-foreground">Csak a publikált hírek jelennek meg a főoldalon</p>
                  </div>
                  <Switch
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Languages className="h-4 w-4" />
                    <span>Nyelvi változatok</span>
                  </div>
                  <Tabs value={activeLanguage} onValueChange={(val) => setActiveLanguage(val as LanguageCode)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="hu">Magyar</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                    </TabsList>
                    {renderTranslationTab("hu")}
                    {renderTranslationTab("en")}
                  </Tabs>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Eye className="h-4 w-4" />
                      <span>Élő előnézet (HU)</span>
                    </div>
                    <h3 className="text-xl font-semibold">{formData.translations.hu.title || "Cím"}</h3>
                    <p className="text-muted-foreground">{formData.translations.hu.excerpt || "Kivonat"}</p>
                    {formData.imageUrl && (
                      <img
                        src={formData.imageUrl}
                        alt={formData.imageAlt || formData.translations.hu.title}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                    )}
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.translations.hu.content) }}
                    />
                  </Card>
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Eye className="h-4 w-4" />
                      <span>Live preview (EN)</span>
                    </div>
                    <h3 className="text-xl font-semibold">{formData.translations.en.title || "Title"}</h3>
                    <p className="text-muted-foreground">{formData.translations.en.excerpt || "Excerpt"}</p>
                    {formData.imageUrl && (
                      <img
                        src={formData.imageUrl}
                        alt={formData.imageAlt || formData.translations.en.title}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                    )}
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.translations.en.content) }}
                    />
                  </Card>
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Mentés..." : editingArticle ? "Hír frissítése" : "Hír létrehozása"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-4 border-dashed border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Keresés cím vagy kivonat alapján"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setPage(1);
                    setSearchTerm(e.target.value);
                  }}
                />
              </div>
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value as typeof statusFilter);
                }}
              >
                <option value="all">Összes</option>
                <option value="published">Publikált</option>
                <option value="draft">Piszkozat</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              {total} hír • {totalPages} oldal
            </div>
          </div>
        </Card>

        {isListLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(PAGE_SIZE)].map((_, idx) => (
              <Card key={idx} className="p-6 animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </Card>
            ))}
          </div>
        ) : articles.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const hu = article.translations.hu;
              return (
                <Card key={article.id} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-muted-foreground tracking-wider">{article.category}</p>
                    <h3 className="text-xl font-semibold text-foreground">{hu.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{hu.excerpt}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {article.published
                      ? new Date(article.publishedAt || article.createdAt).toLocaleDateString("hu-HU")
                      : "Nincs publikálva"}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={article.published ? "default" : "secondary"}>
                      {article.published ? "Publikálva" : "Piszkozat"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(article)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Szerkesztés
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      title="Nyilvános oldal megnyitása"
                    >
                      <a href={`/news/${hu.slug}`} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                        Megnyitás
                      </a>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Törlés
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Nincs megjeleníthető hír.</p>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Előző
            </Button>
            <div className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Következő
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
