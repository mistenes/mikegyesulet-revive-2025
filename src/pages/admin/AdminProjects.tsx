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
  createProject,
  deleteProject,
  getAdminProjects,
  reorderProjects,
  updateProject,
} from "@/services/projectsService";
import { listImageKitFiles, uploadToImageKit, type ImageKitItem } from "@/services/imageKitService";
import { translateProjectToEnglish } from "@/services/translationService";
import type { Project, ProjectInput } from "@/types/project";
import type { Language } from "@/contexts/LanguageContext";

const PROJECTS_FOLDER = "projektek";

const createEmptyProject = (sortOrder = 1): ProjectInput => ({
  sortOrder,
  slugHu: "",
  slugEn: "",
  languageAvailability: "both",
  heroImageUrl: "",
  heroImageAlt: "",
  location: "",
  dateRange: "",
  linkUrl: "",
  published: true,
  translations: {
    hu: { title: "", shortDescription: "", description: "" },
    en: { title: "", shortDescription: "", description: "" },
  },
});

export default function AdminProjects() {
  const { isLoading, session } = useAdminAuthGuard();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectInput>(createEmptyProject());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [translating, setTranslating] = useState<{ shortDescription: boolean; description: boolean }>({
    shortDescription: false,
    description: false,
  });
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserItems, setBrowserItems] = useState<ImageKitItem[]>([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserError, setBrowserError] = useState<string | null>(null);
  const [browserSearch, setBrowserSearch] = useState("");
  const [browserPath, setBrowserPath] = useState<string>(PROJECTS_FOLDER);
  const [browserBasePath, setBrowserBasePath] = useState<string>("");
  const [heroPreviewLoading, setHeroPreviewLoading] = useState(false);
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

    async function loadProjects() {
      try {
        setLoading(true);
        const items = await getAdminProjects();
        setProjects(items.sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Nem sikerült betölteni a projekteket";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [session]);

  useEffect(() => {
    if (form.heroImageUrl) {
      setHeroPreviewLoading(true);
    } else {
      setHeroPreviewLoading(false);
    }
  }, [form.heroImageUrl]);

  const resetForm = () => {
    setForm(createEmptyProject(projects.length + 1));
    setEditingId(null);
  };

  const handleTranslationChange = (
    language: Language,
    field: "title" | "shortDescription" | "description",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [language]: {
          ...prev.translations[language],
          [field]: value,
        },
      },
      ...(field === "title"
        ? (() => {
            const slugKey: "slugHu" | "slugEn" = language === "hu" ? "slugHu" : "slugEn";
            const currentSlug = prev[slugKey];
            const previousGenerated = slugifyText(prev.translations[language].title || "");
            const generated = slugifyText(value);
            if (!currentSlug || currentSlug === previousGenerated) {
              return { [slugKey]: generated } as Pick<ProjectInput, "slugHu" | "slugEn">;
            }
            return {};
          })()
        : {}),
    }));
  };

  const handleSlugChange = (language: Language, value: string) => {
    const slugKey: "slugHu" | "slugEn" = language === "hu" ? "slugHu" : "slugEn";
    setForm((prev) => ({
      ...prev,
      [slugKey]: slugifyText(value),
    }));
  };

  const handleFieldChange = (field: keyof ProjectInput, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  const handleTranslateToEnglish = async (field: "shortDescription" | "description") => {
    const sourceShort = form.translations.hu.shortDescription.trim();
    const sourceDescription = form.translations.hu.description.trim();

    if (field === "shortDescription" && !sourceShort) {
      toast.error("Előbb add meg a magyar rövid leírást");
      return;
    }

    if (field === "description" && !sourceDescription) {
      toast.error("Előbb add meg a magyar leírást");
      return;
    }

    setTranslating((prev) => ({ ...prev, [field]: true }));
    try {
      const result = await translateProjectToEnglish({
        shortDescriptionHu: field === "shortDescription" ? sourceShort : undefined,
        descriptionHu: field === "description" ? sourceDescription : undefined,
      });

      setForm((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          en: {
            ...prev.translations.en,
            shortDescription: result.shortDescription ?? prev.translations.en.shortDescription,
            description: result.description ?? prev.translations.en.description,
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

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    const normalizedTranslations: Project["translations"] = {
      hu: {
        title: project.translations.hu.title,
        shortDescription: project.translations.hu.shortDescription || project.translations.hu.description || "",
        description: project.translations.hu.description,
      },
      en: {
        title: project.translations.en.title,
        shortDescription: project.translations.en.shortDescription || project.translations.en.description || "",
        description: project.translations.en.description,
      },
    };
    setForm({
      sortOrder: project.sortOrder,
      slugHu: project.slugHu,
      slugEn: project.slugEn,
      languageAvailability: project.languageAvailability,
      heroImageUrl: project.heroImageUrl,
      heroImageAlt: project.heroImageAlt,
      location: project.location,
      dateRange: project.dateRange,
      linkUrl: project.linkUrl,
      published: project.published,
      translations: normalizedTranslations,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persistOrder = async (ordered: Project[]) => {
    setProjects(ordered);
    try {
      await reorderProjects(ordered.map((p) => p.id));
      toast.success("Sorrend frissítve");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült frissíteni a sorrendet";
      toast.error(message);
    }
  };

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragOver = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setProjects((prev) => {
      const currentIndex = prev.findIndex((p) => p.id === draggingId);
      const targetIndex = prev.findIndex((p) => p.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated.map((project, index) => ({ ...project, sortOrder: index + 1 }));
    });
  };

  const handleDrop = async () => {
    if (!draggingId) return;
    setDraggingId(null);
    await persistOrder(projects);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const needsHu = form.languageAvailability === "hu" || form.languageAvailability === "both";
      const needsEn = form.languageAvailability === "en" || form.languageAvailability === "both";

      if (needsHu && !form.translations.hu.title) {
        toast.error("Add meg a magyar címet");
        return;
      }

      if (needsEn && !form.translations.en.title) {
        toast.error("Add meg az angol címet");
        return;
      }

      if (needsHu && !form.translations.hu.shortDescription) {
        toast.error("Add meg a magyar rövid leírást");
        return;
      }

      if (needsEn && !form.translations.en.shortDescription) {
        toast.error("Add meg az angol rövid leírást");
        return;
      }

      if (needsHu && !form.slugHu.trim()) {
        toast.error("Add meg a magyar slugot");
        return;
      }

      if (needsEn && !form.slugEn.trim()) {
        toast.error("Add meg az angol slugot");
        return;
      }

      if (needsHu && !form.translations.hu.description) {
        toast.error("Add meg a magyar leírást");
        return;
      }

      if (needsEn && !form.translations.en.description) {
        toast.error("Add meg az angol leírást");
        return;
      }

      let saved: Project;
      if (editingId) {
        saved = await updateProject(editingId, form);
        setProjects((prev) =>
          prev
            .map((p) => (p.id === editingId ? saved : p))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        );
        toast.success("Projekt frissítve");
      } else {
        saved = await createProject(form);
        setProjects((prev) => [...prev, saved].sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success("Projekt létrehozva");
      }

      setEditingId(saved.id);
      setForm({
        sortOrder: saved.sortOrder,
        slugHu: saved.slugHu,
        slugEn: saved.slugEn,
        languageAvailability: saved.languageAvailability,
        heroImageUrl: saved.heroImageUrl,
        heroImageAlt: saved.heroImageAlt,
        location: saved.location,
        dateRange: saved.dateRange,
        linkUrl: saved.linkUrl,
        published: saved.published,
        translations: saved.translations,
      });
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült menteni a projektet";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    const confirmed = window.confirm(`Biztosan törlöd a(z) "${project.translations.hu.title}" projektet?`);
    if (!confirmed) return;

    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id).map((p, index) => ({ ...p, sortOrder: index + 1 })));
      if (editingId === id) {
        resetForm();
      }
      toast.success("Projekt törölve");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült törölni a projektet";
      toast.error(message);
    }
  };

  const languageSections = useMemo<Language[]>(() => {
    if (form.languageAvailability === "hu") return ["hu"];
    if (form.languageAvailability === "en") return ["en"];
    return ["hu", "en"];
  }, [form.languageAvailability]);

  const languageLabels: Record<Language, string> = { hu: "Magyar", en: "Angol" };

  const previewLanguage = languageSections[0] || "hu";

  const previewTitle = useMemo(
    () => form.translations[previewLanguage].title || "",
    [form, previewLanguage],
  );

  const currentBrowserPath = browserPath || browserBasePath || "";

  const availabilityLabels: Record<Project["languageAvailability"], string> = {
    hu: "HU",
    en: "EN",
    both: "HU & EN",
  };

  const parentBrowserPath = useMemo(() => {
    const trimmed = currentBrowserPath.replace(/\/$/, "");
    const segments = trimmed.split("/").filter(Boolean);
    if (!segments.length) return browserBasePath || currentBrowserPath;
    segments.pop();
    const value = segments.join("/");
    return value || browserBasePath || currentBrowserPath;
  }, [browserBasePath, currentBrowserPath]);

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

    handleFieldChange("heroImageUrl", file.url);
    if (!form.heroImageAlt.trim()) {
      handleFieldChange("heroImageAlt", file.name);
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
    if (!parentBrowserPath || parentBrowserPath === currentBrowserPath) return;
    setBrowserSearch("");
    void loadImageKitFiles(undefined, parentBrowserPath);
  };

  const handleCoverUpload = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    setCoverUploading(true);
    try {
      const uploadedUrl = await uploadToImageKit(files[0], PROJECTS_FOLDER);
      handleFieldChange("heroImageUrl", uploadedUrl);
      if (!form.heroImageAlt.trim()) {
        handleFieldChange("heroImageAlt", files[0].name);
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
              Projektek
            </h1>
            <p className="text-muted-foreground">Készítsd és rendezd a projektkártyákat magyarul és angolul.</p>
          </div>
          <Button onClick={resetForm} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Új projekt
          </Button>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">Nyelvi tartalom</p>
            <Badge variant="secondary">{editingId ? "Szerkesztés" : "Új projekt"}</Badge>
          </div>

          <div className="space-y-3">
            <Label>Projekt nyelve</Label>
            <RadioGroup
              value={form.languageAvailability}
              onValueChange={(value) => handleFieldChange("languageAvailability", value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3" htmlFor="lang-hu">
                <RadioGroupItem value="hu" id="lang-hu" />
                <div>
                  <p className="font-medium">Csak magyar</p>
                  <p className="text-sm text-muted-foreground">Az oldal csak magyarul lesz elérhető.</p>
                </div>
              </Label>
              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3" htmlFor="lang-both">
                <RadioGroupItem value="both" id="lang-both" />
                <div>
                  <p className="font-medium">Magyar és angol</p>
                  <p className="text-sm text-muted-foreground">Mindkét nyelven publikálva.</p>
                </div>
              </Label>
              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3" htmlFor="lang-en">
                <RadioGroupItem value="en" id="lang-en" />
                <div>
                  <p className="font-medium">Csak angol</p>
                  <p className="text-sm text-muted-foreground">Az oldal kizárólag angolul érhető el.</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {languageSections.map((language) => (
                <div key={language} className="space-y-3 rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{languageLabels[language]}</p>
                    <Badge variant="outline">{language.toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Cím ({language.toUpperCase()})</Label>
                    <Input
                      value={form.translations[language].title}
                      onChange={(e) => handleTranslationChange(language, "title", e.target.value)}
                      placeholder="Projekt cím"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Rövid leírás ({language.toUpperCase()})</Label>
                      {language === "en" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                          onClick={() => handleTranslateToEnglish("shortDescription")}
                          disabled={translating.shortDescription}
                        >
                          {translating.shortDescription ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span>Fordítás</span>
                          )}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      rows={3}
                      value={form.translations[language].shortDescription}
                      onChange={(e) => handleTranslationChange(language, "shortDescription", e.target.value)}
                      placeholder="Kártyán megjelenő összefoglaló"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Részletes leírás ({language.toUpperCase()})</Label>
                      {language === "en" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                          onClick={() => handleTranslateToEnglish("description")}
                          disabled={translating.description}
                        >
                          {translating.description ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span>Fordítás</span>
                          )}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      rows={6}
                      value={form.translations[language].description}
                      onChange={(e) => handleTranslationChange(language, "description", e.target.value)}
                      placeholder="Projekt oldal tartalma"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug ({language.toUpperCase()})</Label>
                    <Input
                      value={language === "hu" ? form.slugHu : form.slugEn}
                      onChange={(e) => handleSlugChange(language, e.target.value)}
                      placeholder="projekt-cim"
                    />
                    <p className="text-xs text-muted-foreground">
                      Az oldal URL-jében megjelenő azonosító. Csak a kijelölt nyelven lesz elérhető.
                    </p>
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <Label>Helyszín</Label>
                <Input
                  value={form.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                  placeholder="Magyarország, Románia, Szlovákia"
                />
              </div>
              <div className="space-y-2">
                <Label>Dátum / Időszak</Label>
                <Input
                  value={form.dateRange}
                  onChange={(e) => handleFieldChange("dateRange", e.target.value)}
                  placeholder="2024.01.01 - 2024.12.31"
                />
              </div>
              <div className="space-y-2">
                <Label>Külső hivatkozás</Label>
                <Input
                  value={form.linkUrl}
                  onChange={(e) => handleFieldChange("linkUrl", e.target.value)}
                  placeholder="https://mik.hu/projektek/..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="mb-0">Borítókép</Label>
                  {form.heroImageUrl && (
                    <span className="text-xs text-muted-foreground break-all">{form.heroImageUrl}</span>
                  )}
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
                  <div className="relative flex-1 rounded-lg border bg-muted/40 p-3 flex items-center justify-center min-h-[180px]">
                    {form.heroImageUrl ? (
                      <img
                        src={form.heroImageUrl}
                        alt={form.heroImageAlt || "Borítókép"}
                        className="h-full max-h-64 w-full rounded-lg object-cover"
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
                  <div className="flex flex-col gap-2 lg:w-64">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCoverUpload(e.target.files)}
                    />
                    <Button type="button" variant="outline" className="gap-2" onClick={handleOpenUpload} disabled={coverUploading}>
                      {coverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Kép feltöltése
                    </Button>
                    <Button type="button" variant="secondary" className="gap-2" onClick={handleBrowserOpen}>
                      <Search className="h-4 w-4" /> Kiválasztás az ImageKitből
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Borítókép alt szöveg</Label>
                <Input
                  value={form.heroImageAlt}
                  onChange={(e) => handleFieldChange("heroImageAlt", e.target.value)}
                  placeholder="Kép leírása"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Publikus megjelenés</p>
                  <p className="text-sm text-muted-foreground">Kapcsoló a nyilvános listához</p>
                </div>
                <Switch
                  checked={form.published}
                  onCheckedChange={(checked) => handleFieldChange("published", checked)}
                />
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Előnézet</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold">{previewTitle || "Névtelen projekt"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {form.translations[previewLanguage].shortDescription || "Rövid leírás"}
                  </p>
                  <p className="text-sm text-muted-foreground">{form.location || "Helyszín"}</p>
                  <p className="text-sm text-muted-foreground">{form.dateRange || "Időszak"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {editingId && (
              <Button variant="outline" onClick={resetForm} type="button">
                Új projekt
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mentés
            </Button>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Projekt lista</h2>
            <p className="text-sm text-muted-foreground">Fogd és vidd a kártyákat a sorrend módosításához.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground">Még nincs projekt. Adj hozzá egyet fent.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={() => handleDragStart(project.id)}
                  onDragOver={(event) => handleDragOver(event, project.id)}
                  onDrop={handleDrop}
                  className={`border rounded-lg p-4 space-y-3 bg-card shadow-sm transition-shadow ${
                    draggingId === project.id ? "ring-2 ring-primary" : "hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <GripVertical className="h-4 w-4" />
                      <span># {project.sortOrder}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{availabilityLabels[project.languageAvailability]}</Badge>
                      <Badge variant={project.published ? "default" : "outline"}>
                        {project.published ? "Publikus" : "Rejtett"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {project.translations.hu.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.translations.hu.shortDescription || project.translations.hu.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{project.location}</span>
                    <span>•</span>
                    <span>{project.dateRange}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleEdit(project)}>
                      <Pencil className="h-4 w-4" /> Szerkesztés
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => handleDelete(project.id)}>
                      <Trash className="h-4 w-4" /> Törlés
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>

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
                disabled={browserLoading || !parentBrowserPath || parentBrowserPath === currentBrowserPath}
              >
                Vissza
              </Button>
              <p className="text-sm text-muted-foreground break-all">
                {currentBrowserPath ? `/${currentBrowserPath}` : "Alap mappa"}
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
