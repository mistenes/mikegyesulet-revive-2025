import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Calendar,
  Eye,
  Folder,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  createNews,
  createNewsCategory,
  deleteNewsCategory,
  deleteNews,
  getAdminNews,
  getNewsCategories,
  updateNewsCategory,
  updateNews,
} from "@/services/newsService";
import { listImageKitFiles, uploadToImageKit, type ImageKitItem } from "@/services/imageKitService";
import { renderMarkdown } from "@/utils/markdown";
import { translateNewsToEnglish } from "@/services/translationService";
import type { NewsArticle, NewsCategory, NewsInput, NewsTranslation } from "@/types/news";
import type { LanguageCode } from "@/types/language";

const NEWS_FOLDER = "hirek";

type LanguageAvailability = "hu" | "en" | "both";
type NewsFormState = NewsInput & { languageAvailability: LanguageAvailability; categoryTranslations: { hu: string; en: string } };

const emptyTranslation: NewsTranslation = { title: "", slug: "", excerpt: "", content: "" };

const todayIso = () => new Date().toISOString().slice(0, 10);

const createEmptyNews = (): NewsFormState => ({
  categoryId: "",
  category: "",
  categoryTranslations: { hu: "", en: "" },
  imageUrl: "",
  imageAlt: "",
  sticky: false,
  date: todayIso(),
  languageAvailability: "both",
  published: true,
  translations: {
    hu: { ...emptyTranslation },
    en: { ...emptyTranslation },
  },
});

export default function AdminNews() {
  const { isLoading, session } = useAdminAuthGuard();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [form, setForm] = useState<NewsFormState>(createEmptyNews());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserItems, setBrowserItems] = useState<ImageKitItem[]>([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserError, setBrowserError] = useState<string | null>(null);
  const [browserSearch, setBrowserSearch] = useState("");
  const [browserPath, setBrowserPath] = useState<string>(NEWS_FOLDER);
  const [browserBasePath, setBrowserBasePath] = useState<string>("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [heroPreviewLoading, setHeroPreviewLoading] = useState(false);
  const [translating, setTranslating] = useState<{ excerpt: boolean; content: boolean }>({
    excerpt: false,
    content: false,
  });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryHu, setNewCategoryHu] = useState("");
  const [newCategoryEn, setNewCategoryEn] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const slugifyText = (value: string) =>
    value
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

  useEffect(() => {
    if (!session) return;

    async function loadCategories() {
      try {
        const items = await getNewsCategories();
        setCategories(items);
      } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Nem sikerült betölteni a kategóriákat";
        toast.error(message);
      }
    }

    async function loadNews() {
      try {
        setLoading(true);
        const { items } = await getAdminNews({ pageSize: 100 });
        setArticles(items);
      } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Nem sikerült betölteni a híreket";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    void loadCategories();
    void loadNews();
  }, [session]);

  useEffect(() => {
    if (form.imageUrl) {
      setHeroPreviewLoading(true);
    } else {
      setHeroPreviewLoading(false);
    }
  }, [form.imageUrl]);

  const resetForm = () => {
    setForm(createEmptyNews());
    setEditingId(null);
  };

  const handleTranslationChange = (
    language: LanguageCode,
    field: keyof NewsTranslation,
    value: string,
  ) => {
    setForm((prev) => {
      const currentTranslation = prev.translations[language];
      const next: NewsTranslation = {
        ...currentTranslation,
        [field]: field === "slug" ? slugifyText(value) : value,
      };

      if (field === "title") {
        const generated = slugifyText(value);
        const prevGenerated = slugifyText(currentTranslation.title);
        if (!currentTranslation.slug || currentTranslation.slug === prevGenerated) {
          next.slug = generated;
        }
      }

      return {
        ...prev,
        translations: {
          ...prev.translations,
          [language]: next,
        },
      };
    });
  };

  const handleFieldChange = (field: keyof NewsFormState, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    const selected = categories.find((item) => item.id === categoryId);
    setForm((prev) => ({
      ...prev,
      categoryId,
      category: selected?.name.hu || prev.category || "",
      categoryTranslations: selected?.name || prev.categoryTranslations,
    }));
  };

  const handleTranslateToEnglish = async (field: "excerpt" | "content") => {
    const sourceExcerpt = form.translations.hu.excerpt.trim();
    const sourceContent = form.translations.hu.content.trim();

    if (field === "excerpt" && !sourceExcerpt) {
      toast.error("Előbb add meg a magyar kivonatot");
      return;
    }

    if (field === "content" && !sourceContent) {
      toast.error("Előbb add meg a magyar tartalmat");
      return;
    }

    setTranslating((prev) => ({ ...prev, [field]: true }));
    try {
      const result = await translateNewsToEnglish({
        excerptHu: field === "excerpt" ? sourceExcerpt : undefined,
        contentHu: field === "content" ? sourceContent : undefined,
      });

      setForm((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          en: {
            ...prev.translations.en,
            excerpt: result.excerpt ?? prev.translations.en.excerpt,
            content: result.content ?? prev.translations.en.content,
          },
        },
      }));
      toast.success("Fordítás kész");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült lefordítani";
      toast.error(message);
    } finally {
      setTranslating((prev) => ({ ...prev, [field]: false }));
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setNewCategoryHu("");
    setNewCategoryEn("");
  };

  const openCategoryDialog = () => {
    resetCategoryForm();
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: NewsCategory) => {
    setEditingCategoryId(category.id);
    setNewCategoryHu(category.name.hu);
    setNewCategoryEn(category.name.en);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    const nameHu = newCategoryHu.trim();
    const nameEn = newCategoryEn.trim() || newCategoryHu.trim();

    if (!nameHu) {
      toast.error("Add meg a magyar kategórianevet");
      return;
    }

    if (!nameEn) {
      toast.error("Add meg az angol kategórianevet");
      return;
    }

    setCreatingCategory(true);
    try {
      if (editingCategoryId) {
        const updated = await updateNewsCategory(editingCategoryId, { nameHu, nameEn });
        setCategories((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setForm((prev) =>
          prev.categoryId === updated.id
            ? {
                ...prev,
                categoryId: updated.id,
                category: updated.name.hu,
                categoryTranslations: updated.name,
              }
            : prev,
        );
        toast.success("Kategória frissítve");
      } else {
        const created = await createNewsCategory({ nameHu, nameEn });
        setCategories((prev) => [...prev, created]);
        setForm((prev) => ({
          ...prev,
          categoryId: created.id,
          category: created.name.hu,
          categoryTranslations: created.name,
        }));
        toast.success("Kategória létrehozva");
      }

      setCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült menteni a kategóriát";
      toast.error(message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((item) => item.id === id);
    if (!category) return;

    const confirmed = window.confirm(
      `Biztosan törlöd a(z) "${category.name.hu}" kategóriát? A hozzárendelt hírek kategória nélkül maradnak.`,
    );
    if (!confirmed) return;

    setDeletingCategoryId(id);
    try {
      await deleteNewsCategory(id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
      setForm((prev) =>
        prev.categoryId === id
          ? {
              ...prev,
              categoryId: "",
              category: "",
              categoryTranslations: { hu: "", en: "" },
            }
          : prev,
      );
      toast.success("Kategória törölve");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült törölni a kategóriát";
      toast.error(message);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingId(article.id);
    setForm({
      categoryId: article.categoryId || "",
      category: article.categoryTranslations?.hu || article.category || "",
      categoryTranslations: article.categoryTranslations || { hu: article.category || "", en: article.category || "" },
      imageUrl: article.imageUrl || "",
      imageAlt: article.imageAlt || "",
      sticky: Boolean(article.sticky),
      date: article.date || todayIso(),
      languageAvailability: article.languageAvailability || "both",
      published: article.published,
      translations: {
        hu: { ...article.translations.hu },
        en: { ...article.translations.en },
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const article = articles.find((item) => item.id === id);
    if (!article) return;

    const confirmed = window.confirm(`Biztosan törlöd a(z) "${article.translations.hu.title}" hírt?`);
    if (!confirmed) return;

    try {
      await deleteNews(id);
      setArticles((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      toast.success("Hír törölve");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült törölni a hírt";
      toast.error(message);
    }
  };

  const languageSections = useMemo<LanguageCode[]>(() => {
    if (form.languageAvailability === "hu") return ["hu"];
    if (form.languageAvailability === "en") return ["en"];
    return ["hu", "en"];
  }, [form.languageAvailability]);

  const languageLabels: Record<LanguageCode, string> = { hu: "Magyar", en: "Angol" };

  const previewLanguage = languageSections[0] || "hu";

  const availabilityLabels: Record<LanguageAvailability, string> = {
    hu: "HU",
    en: "EN",
    both: "HU & EN",
  };

  const handleSubmit = async () => {
    setSaving(true);
    const hu = form.translations.hu;
    const en = form.translations.en;
    const needsHu = form.languageAvailability === "hu" || form.languageAvailability === "both";
    const needsEn = form.languageAvailability === "en" || form.languageAvailability === "both";
    const selectedCategory = categories.find((item) => item.id === form.categoryId);
    const categoryTranslations = selectedCategory?.name || form.categoryTranslations;

    try {
      if (!categoryTranslations.hu.trim()) {
        toast.error("Add meg a kategóriát magyarul");
        return;
      }

      if (!categoryTranslations.en.trim()) {
        toast.error("Add meg a kategóriát angolul");
        return;
      }

      if (!form.date) {
        toast.error("Add meg a dátumot");
        return;
      }

      const translations: [LanguageCode, NewsTranslation, boolean][] = [
        ["hu", hu, needsHu],
        ["en", en, needsEn],
      ];

      for (const [lang, translation, required] of translations) {
        if (!required) continue;
        const label = lang === "hu" ? "magyar" : "angol";
        if (!translation.title.trim()) {
          toast.error(`Add meg a ${label} címet`);
          return;
        }
        if (!translation.slug.trim()) {
          toast.error(`Add meg a ${label} slugot`);
          return;
        }
        if (!translation.excerpt.trim()) {
          toast.error(`Add meg a ${label} kivonatot`);
          return;
        }
        if (!translation.content.trim()) {
          toast.error(`Add meg a ${label} tartalmat`);
          return;
        }
      }

      const payload: NewsInput = {
        categoryId: selectedCategory?.id || form.categoryId || null,
        category: categoryTranslations.hu,
        categoryTranslations,
        imageUrl: form.imageUrl || undefined,
        imageAlt: form.imageAlt || undefined,
        sticky: form.sticky,
        date: form.date,
        languageAvailability: form.languageAvailability,
        published: form.published,
        translations: form.translations,
      };

      let saved: NewsArticle;
      if (editingId) {
        saved = await updateNews(editingId, payload);
        setArticles((prev) => prev.map((item) => (item.id === editingId ? saved : item)));
        toast.success("Hír frissítve");
      } else {
        saved = await createNews(payload);
        setArticles((prev) => [saved, ...prev]);
        toast.success("Hír létrehozva");
      }

      setEditingId(saved.id);
      setForm({
        categoryId: saved.categoryId || "",
        category: saved.categoryTranslations?.hu || saved.category || "",
        categoryTranslations: saved.categoryTranslations || {
          hu: saved.category || "",
          en: saved.category || "",
        },
        imageUrl: saved.imageUrl || "",
        imageAlt: saved.imageAlt || "",
        sticky: Boolean(saved.sticky),
        date: saved.date || form.date,
        languageAvailability: saved.languageAvailability || form.languageAvailability,
        published: saved.published,
        translations: {
          hu: { ...saved.translations.hu },
          en: { ...saved.translations.en },
        },
      });
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült menteni a hírt";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragOver = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setArticles((prev) => {
      const currentIndex = prev.findIndex((item) => item.id === draggingId);
      const targetIndex = prev.findIndex((item) => item.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const handleDrop = () => {
    setDraggingId(null);
  };

  const parentBrowserPath = useMemo(() => {
    const trimmed = (browserPath || "").replace(/\/$/, "");
    const segments = trimmed.split("/").filter(Boolean);
    if (!segments.length) return browserBasePath || browserPath;
    segments.pop();
    const value = segments.join("/");
    return value || browserBasePath || browserPath;
  }, [browserBasePath, browserPath]);

  const loadImageKitFiles = async (term?: string, path?: string) => {
    setBrowserLoading(true);
    setBrowserError(null);
    try {
      const { items, folder, baseFolder } = await listImageKitFiles(term, path || browserPath || undefined);
      setBrowserItems(items);
      setBrowserPath(folder || path || "");
      setBrowserBasePath(baseFolder || browserBasePath);
      if (!items.length) {
        toast.info("Nem található fájl vagy mappa ebben a könyvtárban");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült lekérni az ImageKit fájlokat";
      setBrowserError(message);
      toast.error(message);
    } finally {
      setBrowserLoading(false);
    }
  };

  const handleBrowserOpen = () => {
    setBrowserOpen(true);
    void loadImageKitFiles(browserSearch, browserPath);
  };

  const handlePickImage = (file: ImageKitItem) => {
    if (file.isFolder) return;
    if (!file.url) {
      toast.error("A kijelölt kép URL-je nem elérhető");
      return;
    }

    handleFieldChange("imageUrl", file.url);
    if (!form.imageAlt?.trim()) {
      handleFieldChange("imageAlt", file.name);
    }

    toast.success("Borítókép kiválasztva");
    setBrowserOpen(false);
  };

  const handleOpenFolder = (item: ImageKitItem) => {
    if (!item.isFolder) return;
    setBrowserSearch("");
    void loadImageKitFiles(undefined, item.path);
  };

  const handleOpenParent = () => {
    if (!parentBrowserPath || parentBrowserPath === browserPath) return;
    setBrowserSearch("");
    void loadImageKitFiles(undefined, parentBrowserPath);
  };

  const handleCoverUpload = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    setCoverUploading(true);
    try {
      const uploadedUrl = await uploadToImageKit(files[0], NEWS_FOLDER);
      handleFieldChange("imageUrl", uploadedUrl);
      if (!form.imageAlt?.trim()) {
        handleFieldChange("imageAlt", files[0].name);
      }
      toast.success("Borítókép feltöltve az ImageKitre");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült feltölteni a borítóképet";
      toast.error(message);
    } finally {
      setCoverUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleOpenUpload = () => {
    fileInputRef.current?.click();
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
    <>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                Hírek kezelése
              </h1>
              <p className="text-muted-foreground">
                Hozz létre és szerkessz híreket magyarul és angolul, borítóképpel és élő előnézettel.
              </p>
            </div>
            <Button onClick={resetForm} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Új hír
            </Button>
          </div>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">Nyelvi tartalom</p>
              <Badge variant="secondary">{editingId ? "Szerkesztés" : "Új hír"}</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Hír nyelve</Label>
                  <RadioGroup
                    value={form.languageAvailability}
                    onValueChange={(value) => handleFieldChange("languageAvailability", value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3"
                  >
                    <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3" htmlFor="news-lang-hu">
                      <RadioGroupItem value="hu" id="news-lang-hu" />
                      <div>
                        <p className="font-medium">Csak magyar</p>
                        <p className="text-sm text-muted-foreground">Az oldal csak magyarul lesz elérhető.</p>
                      </div>
                    </Label>
                    <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3" htmlFor="news-lang-both">
                      <RadioGroupItem value="both" id="news-lang-both" />
                      <div>
                        <p className="font-medium">Magyar és angol</p>
                        <p className="text-sm text-muted-foreground">Mindkét nyelven publikálva.</p>
                      </div>
                    </Label>
                    <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3" htmlFor="news-lang-en">
                      <RadioGroupItem value="en" id="news-lang-en" />
                      <div>
                        <p className="font-medium">Csak angol</p>
                        <p className="text-sm text-muted-foreground">Az oldal kizárólag angolul érhető el.</p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  {languageSections.map((language) => {
                    const translation = form.translations[language];
                    return (
                      <div key={language} className="space-y-3 rounded-lg border p-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{languageLabels[language]}</p>
                          <Badge variant="outline">{language.toUpperCase()}</Badge>
                        </div>
                        <div className="space-y-2">
                          <Label>Cím ({language.toUpperCase()})</Label>
                          <Input
                            value={translation.title}
                            onChange={(e) => handleTranslationChange(language, "title", e.target.value)}
                            placeholder="Add meg a címet"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug ({language.toUpperCase()})</Label>
                          <Input
                            value={translation.slug}
                            onChange={(e) => handleTranslationChange(language, "slug", e.target.value)}
                            placeholder="pelda-cikk"
                          />
                          <p className="text-xs text-muted-foreground">Az oldal URL-jében megjelenő azonosító.</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label>Kivonat ({language.toUpperCase()})</Label>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{translation.excerpt.length}/500</span>
                              {language === "en" && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="gap-2"
                                  onClick={() => handleTranslateToEnglish("excerpt")}
                                  disabled={translating.excerpt}
                                >
                                  {translating.excerpt ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Fordítás</span>}
                                </Button>
                              )}
                            </div>
                          </div>
                          <Textarea
                            value={translation.excerpt}
                            onChange={(e) => handleTranslationChange(language, "excerpt", e.target.value)}
                            rows={3}
                            maxLength={500}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label>Tartalom ({language.toUpperCase()})</Label>
                            {language === "en" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="gap-2"
                                onClick={() => handleTranslateToEnglish("content")}
                                disabled={translating.content}
                              >
                                {translating.content ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Fordítás</span>}
                              </Button>
                            )}
                          </div>
                          <Textarea
                            value={translation.content}
                            onChange={(e) => handleTranslationChange(language, "content", e.target.value)}
                            rows={10}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Kategória</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={openCategoryDialog}
                    >
                      <Plus className="h-4 w-4" /> Kategóriák kezelése
                    </Button>
                  </div>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.categoryId || ""}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                  >
                    <option value="">Válassz kategóriát</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name.hu} / {category.name.en}
                      </option>
                    ))}
                  </select>
                  {form.categoryTranslations.hu && (
                    <p className="text-xs text-muted-foreground">
                      {`HU: ${form.categoryTranslations.hu} • EN: ${form.categoryTranslations.en || form.categoryTranslations.hu}`}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Dátum</Label>
                    <Input
                      type="date"
                      value={form.date || todayIso()}
                      onChange={(e) => handleFieldChange("date", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Rögzített hír</p>
                      <p className="text-sm text-muted-foreground">A rögzített hír elsőként jelenik meg.</p>
                    </div>
                    <Switch checked={Boolean(form.sticky)} onCheckedChange={(checked) => handleFieldChange("sticky", checked)} />
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Borítókép</p>
                      <p className="text-sm text-muted-foreground">Válassz vagy tölts fel képet</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="gap-2" onClick={handleBrowserOpen} type="button">
                        <Search className="h-4 w-4" /> Kiválasztás az ImageKitből
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={handleOpenUpload} type="button" disabled={coverUploading}>
                        {coverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Kép feltöltése
                      </Button>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCoverUpload(e.target.files)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
                    <div className="relative rounded-lg border bg-muted/40 p-4 min-h-[200px] flex items-center justify-center overflow-hidden">
                      {form.imageUrl ? (
                        <img
                          src={form.imageUrl}
                          alt={form.imageAlt || "Borítókép"}
                          className="h-full max-h-72 w-full rounded-lg object-cover"
                          onLoad={() => setHeroPreviewLoading(false)}
                          onError={() => setHeroPreviewLoading(false)}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-10 w-10" />
                          <p className="text-sm">Nincs kiválasztott borítókép</p>
                        </div>
                      )}
                      {heroPreviewLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Borítókép alt szöveg</Label>
                      <Input
                        value={form.imageAlt || ""}
                        onChange={(e) => handleFieldChange("imageAlt", e.target.value)}
                        placeholder="Kép leírása"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Publikus megjelenés</p>
                    <p className="text-sm text-muted-foreground">Csak a publikált hírek jelennek meg a főoldalon</p>
                  </div>
                  <Switch checked={form.published} onCheckedChange={(checked) => handleFieldChange("published", checked)} />
                </div>

                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Eye className="h-4 w-4" />
                    <span>Előnézet ({availabilityLabels[form.languageAvailability]})</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {form.translations[previewLanguage].title || "Cím"}
                    </h3>
                    <p className="text-muted-foreground">{form.translations[previewLanguage].excerpt || "Kivonat"}</p>
                  </div>
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt={form.imageAlt || form.translations[previewLanguage].title}
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  )}
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(form.translations[previewLanguage].content) }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              {editingId && (
                <Button variant="outline" onClick={resetForm} type="button">
                  Új hír
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mentés
              </Button>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hír lista</h2>
              <p className="text-sm text-muted-foreground">Fogd és vidd a kártyákat a kézi rendezéshez.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : articles.length === 0 ? (
              <p className="text-muted-foreground">Még nincs hír. Adj hozzá egyet fent.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article, index) => {
                  const availability = (article.languageAvailability as LanguageAvailability) || "both";
                  return (
                    <div
                      key={article.id}
                      draggable
                      onDragStart={() => handleDragStart(article.id)}
                      onDragOver={(event) => handleDragOver(event, article.id)}
                      onDrop={handleDrop}
                      className={`border rounded-lg p-4 space-y-3 bg-card shadow-sm transition-shadow ${
                        draggingId === article.id ? "ring-2 ring-primary" : "hover:shadow-lg"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <GripVertical className="h-4 w-4" />
                          <span># {index + 1}</span>
                        </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{availabilityLabels[availability]}</Badge>
                        {article.sticky && <Badge variant="outline">Rögzített</Badge>}
                        <Badge variant={article.published ? "default" : "outline"}>
                          {article.published ? "Publikus" : "Rejtett"}
                        </Badge>
                      </div>
                    </div>

                      <div className="space-y-1">
                        <p className="text-xs uppercase text-muted-foreground tracking-wide">
                          {article.categoryTranslations?.hu || article.category}
                        </p>
                        <h3 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                          {article.translations.hu.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.translations.hu.excerpt || article.translations.hu.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {article.date
                          ? new Date(article.date).toLocaleDateString("hu-HU")
                          : article.published
                            ? new Date(article.publishedAt || article.createdAt).toLocaleDateString("hu-HU")
                            : "Nincs publikálva"}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleEdit(article)}>
                          <Pencil className="h-4 w-4" /> Szerkesztés
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          title="Nyilvános oldal megnyitása"
                        >
                          <a href={`/news/${article.translations.hu.slug}`} target="_blank" rel="noreferrer">
                            <Eye className="h-4 w-4" />
                            Megnyitás
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => handleDelete(article.id)}>
                          <Trash className="h-4 w-4" /> Törlés
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>

      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) {
            resetCategoryForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Kategóriák kezelése</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Meglévő kategóriák</p>
                <Button variant="ghost" size="sm" onClick={resetCategoryForm} disabled={creatingCategory}>
                  Alapértelmezett
                </Button>
              </div>
              <ScrollArea className="h-72 rounded-md border">
                {categories.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground px-4">
                    Nincs még kategória
                  </div>
                ) : (
                  <div className="divide-y">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div>
                          <p className="font-medium">{category.name.hu}</p>
                          <p className="text-xs text-muted-foreground">{category.name.en}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditCategory(category)}
                            title="Szerkesztés"
                            disabled={deletingCategoryId === category.id}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deletingCategoryId === category.id}
                            title="Törlés"
                          >
                            {deletingCategoryId === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="font-medium">{editingCategoryId ? "Kategória szerkesztése" : "Új kategória"}</p>
                <p className="text-sm text-muted-foreground">
                  Add meg a kategória magyar és angol nevét a hírlistákhoz.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Magyar név</Label>
                <Input
                  value={newCategoryHu}
                  onChange={(e) => setNewCategoryHu(e.target.value)}
                  placeholder="Pl. Közösség"
                />
              </div>
              <div className="space-y-2">
                <Label>Angol név</Label>
                <Input
                  value={newCategoryEn}
                  onChange={(e) => setNewCategoryEn(e.target.value)}
                  placeholder="Pl. Community"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCategoryDialogOpen(false);
                    resetCategoryForm();
                  }}
                  disabled={creatingCategory}
                >
                  Mégse
                </Button>
                <Button onClick={handleSaveCategory} disabled={creatingCategory} className="gap-2">
                  {creatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mentés
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={browserOpen} onOpenChange={setBrowserOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ImageKit böngészése</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenParent}
                  disabled={browserLoading || !parentBrowserPath || parentBrowserPath === browserPath}
                >
                  Vissza
                </Button>
                <p className="text-sm text-muted-foreground break-all">
                  {browserPath ? `/${browserPath}` : "Alap mappa"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Keresés az ImageKitben"
                  value={browserSearch}
                  onChange={(e) => setBrowserSearch(e.target.value)}
                  className="w-48 sm:w-64"
                />
                <Button onClick={() => loadImageKitFiles(browserSearch)} disabled={browserLoading} className="gap-2">
                  {browserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Keresés
                </Button>
              </div>
            </div>

            {browserError && <p className="text-sm text-destructive">{browserError}</p>}

            <ScrollArea className="h-[420px] rounded-md border p-3">
              {browserLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Fájlok betöltése...</span>
                </div>
              ) : browserItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Nincs megjeleníthető fájl vagy mappa
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {browserItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => (item.isFolder ? handleOpenFolder(item) : handlePickImage(item))}
                      className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-left hover:border-primary/60 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-muted p-2">
                          {item.isFolder ? (
                            <Folder className="h-5 w-5 text-primary" />
                          ) : item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              className="h-10 w-10 rounded object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground break-all" title={item.path}>
                            {item.path}
                          </p>
                        </div>
                      </div>
                      {!item.isFolder && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.width && item.height ? `${item.width}×${item.height}` : "Kép"}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
