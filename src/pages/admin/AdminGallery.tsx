import { useEffect, useMemo, useState, type DragEvent } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Image as ImageIcon, Loader2, Pencil, Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  createAlbum,
  deleteAlbum,
  getAdminGallery,
  reorderAlbums,
  updateAlbum,
} from "@/services/galleryService";
import type { GalleryAlbum, GalleryAlbumInput } from "@/types/gallery";

const createEmptyAlbum = (sortOrder = 1): GalleryAlbumInput => ({
  title: "",
  subtitle: "",
  eventDate: "",
  coverImageUrl: "",
  coverImageAlt: "",
  images: [],
  sortOrder,
  published: true,
});

export default function AdminGallery() {
  const { isLoading, session } = useAdminAuthGuard();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [form, setForm] = useState<GalleryAlbumInput>(createEmptyAlbum());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [imagesInput, setImagesInput] = useState("");

  useEffect(() => {
    if (!session) return;

    let active = true;
    const loadAlbums = async () => {
      try {
        setLoading(true);
        const items = await getAdminGallery();
        if (!active) return;
        setAlbums(items.sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Nem sikerült betölteni a galériákat";
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAlbums();
    return () => {
      active = false;
    };
  }, [session]);

  const resetForm = () => {
    setForm(createEmptyAlbum(albums.length + 1));
    setImagesInput("");
    setEditingId(null);
  };

  const handleFieldChange = (field: keyof GalleryAlbumInput, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  const handleImagesChange = (value: string) => {
    setImagesInput(value);
    const urls = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, images: urls }));
  };

  const handleEdit = (album: GalleryAlbum) => {
    setEditingId(album.id);
    setForm({
      title: album.title,
      subtitle: album.subtitle,
      eventDate: album.eventDate || "",
      coverImageUrl: album.coverImageUrl,
      coverImageAlt: album.coverImageAlt,
      images: album.images,
      sortOrder: album.sortOrder,
      published: album.published,
    });
    setImagesInput(album.images.join("\n"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persistOrder = async (ordered: GalleryAlbum[]) => {
    setAlbums(ordered);
    try {
      await reorderAlbums(ordered.map((album) => album.id));
      toast.success("Sorrend frissítve");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült frissíteni a sorrendet";
      toast.error(message);
    }
  };

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragOver = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setAlbums((prev) => {
      const currentIndex = prev.findIndex((album) => album.id === draggingId);
      const targetIndex = prev.findIndex((album) => album.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated.map((album, index) => ({ ...album, sortOrder: index + 1 }));
    });
  };

  const handleDrop = async () => {
    if (!draggingId) return;
    setDraggingId(null);
    await persistOrder(albums);
    if (editingId) {
      const updated = albums.find((album) => album.id === editingId);
      if (updated) {
        setForm((prev) => ({ ...prev, sortOrder: updated.sortOrder }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Adj meg címet a galériának");
      return;
    }

    if (!form.coverImageUrl.trim()) {
      toast.error("Add meg a borítókép URL-jét");
      return;
    }

    if (!form.images.length) {
      toast.error("Legalább egy képet adj meg");
      return;
    }

    setSaving(true);
    try {
      let saved: GalleryAlbum;
      if (editingId) {
        saved = await updateAlbum(editingId, form);
        setAlbums((prev) => prev.map((album) => (album.id === editingId ? saved : album)).sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success("Galéria frissítve");
      } else {
        saved = await createAlbum(form);
        setAlbums((prev) => [...prev, saved].sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success("Galéria létrehozva");
      }

      setEditingId(saved.id);
      setForm({
        title: saved.title,
        subtitle: saved.subtitle,
        eventDate: saved.eventDate || "",
        coverImageUrl: saved.coverImageUrl,
        coverImageAlt: saved.coverImageAlt,
        images: saved.images,
        sortOrder: saved.sortOrder,
        published: saved.published,
      });
      setImagesInput(saved.images.join("\n"));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült menteni a galériát";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const album = albums.find((item) => item.id === id);
    if (!album) return;
    const confirmed = window.confirm(`Biztosan törlöd a(z) "${album.title}" albumot?`);
    if (!confirmed) return;

    try {
      await deleteAlbum(id);
      setAlbums((prev) => prev.filter((item) => item.id !== id).map((item, index) => ({ ...item, sortOrder: index + 1 })));
      if (editingId === id) {
        resetForm();
      }
      toast.success("Galéria törölve");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült törölni a galériát";
      toast.error(message);
    }
  };

  const previewImage = useMemo(() => form.coverImageUrl, [form.coverImageUrl]);

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
              Galéria
            </h1>
            <p className="text-muted-foreground">Kezeld az Embla-alapú galériákat és képeiket.</p>
          </div>
          <Button onClick={resetForm} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Új galéria
          </Button>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{editingId ? "Galéria szerkesztése" : "Új galéria"}</h2>
              <p className="text-sm text-muted-foreground">
                Add meg a szükséges adatokat a galéria publikálásához.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cím</Label>
                <Input value={form.title} onChange={(e) => handleFieldChange("title", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Alcím</Label>
                <Input value={form.subtitle} onChange={(e) => handleFieldChange("subtitle", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Dátum</Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => handleFieldChange("eventDate", e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between space-y-0">
                <div>
                  <Label>Közzétéve</Label>
                  <p className="text-sm text-muted-foreground">Legyen-e látható a galéria a nyilvános oldalon</p>
                </div>
                <Switch
                  checked={form.published}
                  onCheckedChange={(checked) => handleFieldChange("published", checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Borítókép URL</Label>
                <Input
                  value={form.coverImageUrl}
                  onChange={(e) => handleFieldChange("coverImageUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Borítókép alt szöveg</Label>
                <Input
                  value={form.coverImageAlt}
                  onChange={(e) => handleFieldChange("coverImageAlt", e.target.value)}
                  placeholder="Rövid leírás a képről"
                />
              </div>

              <div className="space-y-2">
                <Label>Képek (soronként egy URL)</Label>
                <Textarea
                  rows={6}
                  value={imagesInput}
                  onChange={(e) => handleImagesChange(e.target.value)}
                  placeholder="https://...\nhttps://..."
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Sorrend</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.sortOrder}
                  onChange={(e) => handleFieldChange("sortOrder", Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {previewImage && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Borítókép előnézet</Label>
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img src={previewImage} alt={form.coverImageAlt || form.title} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={resetForm} type="button">
              <Pencil className="h-4 w-4 mr-2" /> Új galéria készítése
            </Button>
            <Button onClick={handleSubmit} disabled={saving} type="button">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mentés...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Mentés
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Galériák</h3>
              <p className="text-sm text-muted-foreground">Húzd és ejtsd a kártyákat a sorrend változtatásához.</p>
            </div>
            <Badge variant="secondary">{albums.length} galéria</Badge>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Galériák betöltése...</div>
          ) : !albums.length ? (
            <div className="py-10 text-center text-muted-foreground">Még nincs galéria. Hozz létre egyet!</div>
          ) : (
            <div className="space-y-4">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className={`flex items-center gap-4 rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md ${
                    draggingId === album.id ? "ring-2 ring-primary" : ""
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(album.id)}
                  onDragOver={(event) => handleDragOver(event, album.id)}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div className="h-16 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {album.coverImageUrl ? (
                        <img src={album.coverImageUrl} alt={album.coverImageAlt || album.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">Nincs kép</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold leading-tight">{album.title}</h4>
                        <Badge variant={album.published ? "default" : "secondary"}>
                          {album.published ? "Publikált" : "Piszkozat"}
                        </Badge>
                      </div>
                      {album.subtitle && <p className="text-sm text-muted-foreground">{album.subtitle}</p>}
                      <div className="text-xs text-muted-foreground flex gap-3">
                        {album.eventDate && <span>{album.eventDate}</span>}
                        <span>{album.images.length} kép</span>
                        <span>Sorrend: {album.sortOrder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(album)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(album.id)}>
                      <Trash className="h-4 w-4" />
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
