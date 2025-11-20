import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Loader2, Pencil, Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  createProject,
  deleteProject,
  getAdminProjects,
  reorderProjects,
  updateProject,
} from "@/services/projectsService";
import type { Project, ProjectInput } from "@/types/project";
import type { Language } from "@/contexts/LanguageContext";

const createEmptyProject = (sortOrder = 1): ProjectInput => ({
  sortOrder,
  heroImageUrl: "",
  heroImageAlt: "",
  location: "",
  dateRange: "",
  linkUrl: "",
  published: true,
  translations: {
    hu: { title: "", description: "" },
    en: { title: "", description: "" },
  },
});

export default function AdminProjects() {
  const { isLoading, session } = useAdminAuthGuard();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectInput>(createEmptyProject());
  const [activeLanguage, setActiveLanguage] = useState<Language>("hu");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

  const resetForm = () => {
    setForm(createEmptyProject(projects.length + 1));
    setEditingId(null);
  };

  const handleTranslationChange = (field: "title" | "description", value: string) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLanguage]: {
          ...prev.translations[activeLanguage],
          [field]: value,
        },
      },
    }));
  };

  const handleFieldChange = (field: keyof ProjectInput, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setForm({
      sortOrder: project.sortOrder,
      heroImageUrl: project.heroImageUrl,
      heroImageAlt: project.heroImageAlt,
      location: project.location,
      dateRange: project.dateRange,
      linkUrl: project.linkUrl,
      published: project.published,
      translations: project.translations,
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
      if (!form.translations.hu.title || !form.translations.en.title) {
        toast.error("Add meg a magyar és angol címet");
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

  const previewTitle = useMemo(() => form.translations[activeLanguage].title || "", [form, activeLanguage]);

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
            <Tabs value={activeLanguage} onValueChange={(val) => setActiveLanguage(val as Language)}>
              <TabsList>
                <TabsTrigger value="hu">Magyar</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge variant="secondary">{editingId ? "Szerkesztés" : "Új projekt"}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cím ({activeLanguage.toUpperCase()})</Label>
                <Input
                  value={form.translations[activeLanguage].title}
                  onChange={(e) => handleTranslationChange("title", e.target.value)}
                  placeholder="Projekt cím"
                />
              </div>
              <div className="space-y-2">
                <Label>Leírás ({activeLanguage.toUpperCase()})</Label>
                <Textarea
                  rows={5}
                  value={form.translations[activeLanguage].description}
                  onChange={(e) => handleTranslationChange("description", e.target.value)}
                  placeholder="Rövid összefoglaló"
                />
              </div>
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
              <div className="space-y-2">
                <Label>Borítókép URL</Label>
                <Input
                  value={form.heroImageUrl}
                  onChange={(e) => handleFieldChange("heroImageUrl", e.target.value)}
                  placeholder="https://...jpg"
                />
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
                    <Badge variant={project.published ? "default" : "outline"}>
                      {project.published ? "Publikus" : "Rejtett"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {project.translations.hu.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.translations.hu.description}
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
  );
}
