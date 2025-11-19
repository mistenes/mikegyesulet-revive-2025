import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Eye, Calendar, Languages } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createNews, deleteNews, getAllNews, updateNews } from "@/services/newsService";
import type { NewsArticle, NewsInput, NewsTranslation } from "@/types/news";
import type { LanguageCode } from "@/types/language";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";

const translationSchema = z.object({
  title: z.string().min(1, "A cím kötelező").max(200),
  slug: z.string().min(1, "A slug kötelező").max(200),
  excerpt: z.string().min(1, "A kivonat kötelező").max(500),
  content: z.string().min(1, "A tartalom kötelező"),
});

const newsSchema = z.object({
  category: z.string().min(1, "A kategória kötelező"),
  imageUrl: z.string().url("Érvényes URL-t adj meg").optional().or(z.literal("")),
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

export default function AdminNews() {
  const { isLoading, session } = useAdminAuthGuard();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState<NewsInput>({
    category: "",
    imageUrl: "",
    published: false,
    translations: createEmptyTranslations(),
  });
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>("hu");

  useEffect(() => {
    loadArticles();
  }, []);

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

  const loadArticles = async () => {
    const data = await getAllNews();
    setArticles(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        toast.error("Hiba történt a mentés során");
        console.error(error);
      }
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      category: article.category,
      imageUrl: article.imageUrl || "",
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

    await deleteNews(id);
    toast.success("Hír törölve!");
    loadArticles();
  };

  const resetForm = () => {
    setFormData({
      category: "",
      imageUrl: "",
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

  const renderTranslationTab = (lang: LanguageCode) => {
    const translation = formData.translations[lang];
    const isHu = lang === "hu";

    return (
      <TabsContent value={lang} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Cím ({isHu ? "magyar" : "angol"})</Label>
          <Input
            value={translation.title}
            onChange={(e) => {
              updateTranslationField(lang, "title", e.target.value);
              updateTranslationField(lang, "slug", generateSlug(e.target.value));
            }}
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
          <Label>Kivonat ({isHu ? "magyar" : "angol"})</Label>
          <Textarea
            value={translation.excerpt}
            onChange={(e) => updateTranslationField(lang, "excerpt", e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Tartalom ({isHu ? "magyar" : "angol"})</Label>
          <Textarea
            value={translation.content}
            onChange={(e) => updateTranslationField(lang, "content", e.target.value)}
            rows={6}
          />
        </div>
      </TabsContent>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Hírek kezelése
            </h1>
            <p className="text-muted-foreground">
              Készíts egyszerre magyar és angol tartalmat, hogy a főoldalon mindkét nyelven megjelenjen.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Új hír
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? "Hír szerkesztése" : "Új hír létrehozása"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kategória</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Pl. Közösség"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kiemelt kép URL</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Jelenleg csak közvetlen kép URL adható meg. Feltöltési integráció a Render API-ban lesz elérhető.
                  </p>
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

                <Button type="submit" className="w-full">
                  {editingArticle ? "Hír frissítése" : "Hír létrehozása"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase text-muted-foreground tracking-wider">{article.category}</p>
                <h3 className="text-xl font-semibold text-foreground">
                  {article.translations.hu.title}
                </h3>
                <p className="text-sm text-muted-foreground">{article.translations.en.title}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {article.published
                  ? new Date(article.publishedAt || article.createdAt).toLocaleDateString("hu-HU")
                  : "Nincs publikálva"}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  article.published
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {article.published ? "Publikálva" : "Piszkozat"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(article)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Szerkesztés
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert(JSON.stringify(article, null, 2))}>
                  <Eye className="h-4 w-4 mr-2" />
                  Előnézet
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Törlés
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
