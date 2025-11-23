import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Folder, GripVertical, Image as ImageIcon, Loader2, Pencil, Plus, Save, Trash, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  createAlbum,
  deleteAlbum,
  getAdminGallery,
  reorderAlbums,
  updateAlbum,
} from "@/services/galleryService";
import { listImageKitFiles, uploadToImageKit, type ImageKitItem } from "@/services/imageKitService";
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
  const [coverUploading, setCoverUploading] = useState(false);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserItems, setBrowserItems] = useState<ImageKitItem[]>([]);
  const [browserTarget, setBrowserTarget] = useState<"cover" | "gallery">("cover");
  const [browserSearch, setBrowserSearch] = useState("");
  const [browserError, setBrowserError] = useState<string | null>(null);
  const [browserPath, setBrowserPath] = useState<string>("");
  const [browserBasePath, setBrowserBasePath] = useState<string>("");
  const [browserSelected, setBrowserSelected] = useState<Set<string>>(new Set());

  const currentBrowserPath = browserPath || browserBasePath || "";
  const parentBrowserPath = useMemo(() => {
    const trimmed = currentBrowserPath.replace(/\/$/, "");
    const segments = trimmed.split("/").filter(Boolean);
    if (segments.length <= 1) return browserBasePath || currentBrowserPath;
    segments.pop();
    return segments.join("/") || browserBasePath || currentBrowserPath;
  }, [browserBasePath, currentBrowserPath]);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

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
    setForm(createEmptyAlbum(1));
    setEditingId(null);
  };

  const handleFieldChange = (field: keyof GalleryAlbumInput, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  const handleCoverUpload = async (file?: File | null) => {
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadToImageKit(file);
      handleFieldChange("coverImageUrl", url);
      toast.success("Borítókép feltöltve");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült feltölteni a borítóképet";
      toast.error(message);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleGalleryUpload = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    setImagesUploading(true);
    try {
      const uploads = await Promise.all([...files].map((file) => uploadToImageKit(file)));
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploads],
      }));
      toast.success("Képek feltöltve");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült feltölteni a képeket";
      toast.error(message);
    } finally {
      setImagesUploading(false);
    }
  };

  const loadImageKitFiles = async (term?: string, path?: string) => {
    setBrowserLoading(true);
    setBrowserError(null);
    try {
      const { items, folder, baseFolder } = await listImageKitFiles(term, path || browserPath || undefined);
      setBrowserItems(items);
      setBrowserPath(folder || baseFolder);
      setBrowserBasePath(baseFolder);
      setBrowserSelected((prev) => {
        const validIds = new Set(items.map((item) => item.id));
        return new Set([...prev].filter((id) => validIds.has(id)));
      });
      if (!items.length) {
        toast.info("Nincs találat az ImageKitben");
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

  const handleBrowserOpen = (target: "cover" | "gallery") => {
    setBrowserTarget(target);
    setBrowserSelected(new Set());
    setBrowserOpen(true);
    void loadImageKitFiles(browserSearch, browserPath);
  };

  const handlePickImage = (file: ImageKitItem) => {
    if (file.isFolder) return;
    if (!file.url) {
      toast.error("A kijelölt kép URL-je nem elérhető");
      return;
    }
    if (browserTarget === "cover") {
      handleFieldChange("coverImageUrl", file.url);
      if (!form.coverImageAlt.trim()) {
        handleFieldChange("coverImageAlt", file.name);
      }
    } else {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, file.url],
      }));
    }

    toast.success("Kép kiválasztva az ImageKitből");
    setBrowserOpen(false);
  };

  const handleToggleSelection = (item: ImageKitItem) => {
    if (item.isFolder || !item.url) return;

    setBrowserSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const selectableIds = browserItems.filter((item) => !item.isFolder && item.url).map((item) => item.id);
    setBrowserSelected(new Set(selectableIds));
  };

  const handleClearSelection = () => setBrowserSelected(new Set());

  const handleAddSelected = () => {
    const selectedItems = browserItems.filter((item) => browserSelected.has(item.id) && !item.isFolder && item.url);
    const newUrls = selectedItems.map((item) => item.url!).filter(Boolean);

    if (!newUrls.length) {
      toast.error("Nincs kiválasztott kép");
      return;
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newUrls.filter((url) => !prev.images.includes(url))],
    }));

    toast.success(`${newUrls.length} kép hozzáadva`);
    setBrowserSelected(new Set());
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
      toast.error("Válassz borítóképet az ImageKitből vagy tölts fel egyet");
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
        setAlbums((prev) => {
          const current = prev.find((album) => album.id === editingId);
          if (!current) {
            return prev;
          }

          const others = prev.filter((album) => album.id !== editingId).map((album) => {
            if (saved.sortOrder < current.sortOrder) {
              if (album.sortOrder >= saved.sortOrder && album.sortOrder < current.sortOrder) {
                return { ...album, sortOrder: album.sortOrder + 1 };
              }
            } else if (saved.sortOrder > current.sortOrder) {
              if (album.sortOrder <= saved.sortOrder && album.sortOrder > current.sortOrder) {
                return { ...album, sortOrder: album.sortOrder - 1 };
              }
            }
            return album;
          });

          return [...others, saved].sort((a, b) => a.sortOrder - b.sortOrder);
        });
        toast.success("Galéria frissítve");
      } else {
        saved = await createAlbum(form);
        setAlbums((prev) => {
          const shifted = prev.map((album) =>
            album.sortOrder >= saved.sortOrder ? { ...album, sortOrder: album.sortOrder + 1 } : album,
          );
          return [...shifted, saved].sort((a, b) => a.sortOrder - b.sortOrder);
        });
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

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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
                <Label>Borítókép</Label>
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted border relative">
                  {previewImage ? (
                    <img src={previewImage} alt={form.coverImageAlt || form.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                      Válassz egy képet borítóként
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    className="gap-2"
                  >
                    {coverUploading && <Loader2 className="h-4 w-4 animate-spin" />}Feltöltés ImageKitre
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBrowserOpen("cover")}
                    disabled={coverUploading}
                    className="gap-2"
                  >
                    ImageKit böngészése
                  </Button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void handleCoverUpload(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Válassz vagy tölts fel egy képet, amit a galéria borítójaként használunk.
                </p>
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
                <Label>Galéria képei</Label>
                {form.images.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {form.images.map((image, index) => (
                      <div key={image + index} className="relative group border rounded-lg overflow-hidden bg-muted">
                        <img src={image} alt={form.title || `Galéria kép ${index + 1}`} className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 h-7 w-7 inline-flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                          onClick={() => handleRemoveImage(index)}
                          aria-label="Kép eltávolítása"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/50 p-6 text-center text-muted-foreground text-sm">
                    Még nincs kiválasztott kép. Adj hozzá képeket az ImageKitből vagy tölts fel újakat.
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={imagesUploading}
                    className="gap-2"
                  >
                    {imagesUploading && <Loader2 className="h-4 w-4 animate-spin" />}Képek feltöltése ImageKitre
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBrowserOpen("gallery")}
                    disabled={imagesUploading}
                    className="gap-2"
                  >
                    Képek kiválasztása ImageKitből
                  </Button>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void handleGalleryUpload(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </div>
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

        <Dialog open={browserOpen} onOpenChange={setBrowserOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>ImageKit böngészése</DialogTitle>
              <DialogDescription>
                Válaszd ki, hogy melyik képet szeretnéd {browserTarget === "cover" ? "borítóként beállítani" : "a galériához hozzáadni"}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="flex gap-2 flex-1">
                  <Input
                    placeholder="Keresés fájlnévre"
                    value={browserSearch}
                    onChange={(event) => setBrowserSearch(event.target.value)}
                  />
                  <Button onClick={() => loadImageKitFiles(browserSearch)} disabled={browserLoading}>
                    {browserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Keresés"}
                  </Button>
                </div>
                <Button variant="outline" onClick={() => loadImageKitFiles(browserSearch)} disabled={browserLoading}>
                  Frissítés
                </Button>
              </div>

              {browserError && <p className="text-sm text-destructive">{browserError}</p>}

              {browserTarget === "gallery" && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {browserSelected.size ? `${browserSelected.size} kép kiválasztva` : "Nincs kiválasztott kép"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={handleSelectAll} disabled={!browserItems.length}>
                      Összes kijelölése
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleClearSelection} disabled={!browserSelected.size}>
                      Kijelölések törlése
                    </Button>
                    <Button size="sm" onClick={handleAddSelected} disabled={!browserSelected.size}>
                      Kiválasztott képek hozzáadása
                    </Button>
                  </div>
                </div>
              )}

              {browserLoading ? (
                <div className="py-10 text-center text-muted-foreground">Fájlok betöltése az ImageKitből...</div>
              ) : !browserItems.length ? (
                <div className="py-10 text-center text-muted-foreground">Nincs megjeleníthető fájl.</div>
              ) : (
                <ScrollArea className="max-h-[60vh] pr-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">Mappa:</span>
                        <span className="break-all">{browserPath || browserBasePath || "/"}</span>
                      </div>
                      <div className="flex gap-2">
                        {currentBrowserPath && parentBrowserPath && currentBrowserPath !== parentBrowserPath && (
                          <Button size="sm" variant="ghost" onClick={handleOpenParent}>
                            Egy szinttel feljebb
                          </Button>
                        )}
                        {browserPath && browserBasePath && browserPath !== browserBasePath && (
                          <Button size="sm" variant="ghost" onClick={() => loadImageKitFiles(undefined, browserBasePath)}>
                            Alap mappa
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {browserItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-card shadow-sm">
                          <div className="relative aspect-video overflow-hidden rounded-md bg-muted flex items-center justify-center">
                            {browserTarget === "gallery" && !item.isFolder && item.url && (
                              <label className="absolute left-2 top-2 flex items-center gap-2 rounded bg-background/90 px-2 py-1 text-xs shadow">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={browserSelected.has(item.id)}
                                  onChange={() => handleToggleSelection(item)}
                                />
                                Kijelölés
                              </label>
                            )}
                            {item.isFolder ? (
                              <Folder className="h-10 w-10 text-muted-foreground" />
                            ) : item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                                Nincs előnézet
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-sm truncate" title={item.name}>
                              {item.name}
                            </p>
                            {!item.isFolder && (
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {item.width && item.height ? `${item.width}×${item.height}` : "Méret nem elérhető"}
                                </span>
                                {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString()}</span>}
                              </div>
                            )}
                            {item.isFolder && item.path && (
                              <p className="text-xs text-muted-foreground break-all">{item.path}</p>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            {item.isFolder ? (
                              <Button size="sm" variant="outline" onClick={() => handleOpenFolder(item)}>
                                Megnyitás
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  browserTarget === "gallery" ? handleToggleSelection(item) : handlePickImage(item)
                                }
                              >
                                {browserTarget === "cover" ? "Borító beállítása" : browserSelected.has(item.id) ? "Kijelölve" : "Kijelölés"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
