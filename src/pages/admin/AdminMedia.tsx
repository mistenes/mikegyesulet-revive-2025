import { useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus, RefreshCw, Upload, Search, Folder, Image as ImageIcon, Loader2, Trash } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  createImageKitFolder,
  deleteImageKitFile,
  listImageKitFiles,
  uploadToImageKit,
  type ImageKitItem,
} from "@/services/imageKitService";

export default function AdminMedia() {
  const { isLoading, session } = useAdminAuthGuard();
  const [items, setItems] = useState<ImageKitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [path, setPath] = useState<string>("");
  const [basePath, setBasePath] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedItem, setSelectedItem] = useState<ImageKitItem | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const currentPath = path || basePath || "";

  const parentPath = useMemo(() => {
    const trimmed = currentPath.replace(/\/$/, "");
    const segments = trimmed.split("/").filter(Boolean);
    if (!segments.length) return basePath || currentPath;
    segments.pop();
    const value = segments.join("/");
    return value || basePath || currentPath;
  }, [basePath, currentPath]);

  useEffect(() => {
    if (!session) return;
    void loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadFiles = async (term?: string, targetPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { items: found, folder, baseFolder } = await listImageKitFiles(term, targetPath || currentPath || undefined);
      setItems(found);
      setPath(folder || targetPath || "");
      setBasePath(baseFolder || basePath);
      if (!found.length) {
        toast.info("Nem található fájl vagy mappa ebben a könyvtárban");
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nem sikerült betölteni a médiatárat";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = (item: ImageKitItem) => {
    if (!item.isFolder) return;
    void loadFiles(undefined, item.path);
  };

  const handleOpenItem = (item: ImageKitItem) => {
    if (item.isFolder) {
      handleOpenFolder(item);
      return;
    }

    setSelectedItem(item);
  };

  const handleBack = () => {
    if (!currentPath || currentPath === basePath) return;
    void loadFiles(undefined, parentPath);
  };

  const handleUpload = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const folderTarget = currentPath || basePath;
      await Promise.all([...files].map((file) => uploadToImageKit(file, folderTarget)));
      toast.success("Fájlok feltöltve az ImageKitre");
      await loadFiles(searchTerm, currentPath);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nem sikerült feltölteni a fájlokat";
      toast.error(message);
    } finally {
      setUploading(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error("Adj meg egy mappanevet");
      return;
    }

    try {
      await createImageKitFolder(currentPath || basePath, folderName.trim());
      toast.success("Mappa létrehozva");
      setFolderDialogOpen(false);
      setFolderName("");
      await loadFiles(searchTerm, currentPath);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nem sikerült létrehozni a mappát";
      toast.error(message);
    }
  };

  const handleDeleteFile = async (item: ImageKitItem) => {
    if (item.isFolder) {
      toast.error("Mappák törlése jelenleg nem támogatott");
      return;
    }

    if (!item.id) {
      toast.error("Ismeretlen fájl nem törölhető");
      return;
    }

    const confirmed = window.confirm(`Biztosan törlöd a(z) "${item.name}" fájlt?`);
    if (!confirmed) return;

    setDeletingIds((prev) => new Set(prev).add(item.id));
    try {
      await deleteImageKitFile(item.id);
      toast.success("Fájl törölve az ImageKitből");
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      await loadFiles(searchTerm, currentPath);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nem sikerült törölni a fájlt";
      toast.error(message);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const renderItemCard = (item: ImageKitItem) => {
    if (item.isFolder) {
      return (
        <button
          key={item.id}
          onClick={() => handleOpenFolder(item)}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">Mappa</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground break-all">{item.path}</p>
        </button>
      );
    }

    return (
      <div className="relative">
        <button
          key={item.id}
          type="button"
          onClick={() => handleOpenItem(item)}
          className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              {item.thumbnailUrl ? (
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
        </button>
        <div className="absolute right-2 top-2 flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            title="Fájl törlése"
            disabled={deletingIds.has(item.id)}
            onClick={(event) => {
              event.stopPropagation();
              void handleDeleteFile(item);
            }}
          >
            {deletingIds.has(item.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              Médiatár
            </h1>
            <p className="text-muted-foreground">
              Böngészd, töltsd fel és rendezd az ImageKit fájlokat és mappákat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleBack} disabled={!currentPath || currentPath === basePath}>
              Vissza
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => void loadFiles(searchTerm, currentPath)}>
              <RefreshCw className="h-4 w-4" /> Frissítés
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setFolderDialogOpen(true)}>
              <FolderPlus className="h-4 w-4" /> Új mappa
            </Button>
            <Button
              className="gap-2"
              disabled={uploading}
              onClick={() => uploadInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> {uploading ? "Feltöltés..." : "Feltöltés"}
            </Button>
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void handleUpload(event.target.files)}
            />
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Jelenlegi útvonal</p>
              <p className="font-medium break-all">{currentPath || "/"}</p>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Keresés az ImageKitben"
                  className="pl-10"
                />
              </div>
              <Button variant="secondary" onClick={() => void loadFiles(searchTerm, currentPath)}>
                Keresés
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div
            className="relative max-h-[70vh] rounded-md border overflow-auto touch-pan-x touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-w-[320px] sm:min-w-0">
              {loading ? (
                <div className="col-span-full flex justify-center py-10 text-muted-foreground">
                  Betöltés...
                </div>
              ) : items.length ? (
                items.map((item) => renderItemCard(item))
              ) : (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Folder className="h-8 w-8" />
                  <p>Üres könyvtár</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Új mappa létrehozása</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Mappanév</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Pl. 2025-es események"
              />
            </div>
            <p className="text-sm text-muted-foreground">Hely: {currentPath || "/"}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Mégse
              </Button>
              <Button onClick={() => void handleCreateFolder()}>Létrehozás</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.url ? (
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.name}
                    className="mx-auto max-h-[60vh] w-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ehhez a fájlhoz nem érhető el előnézet.</p>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Elérési út</p>
                <p className="break-all font-medium">{selectedItem.path}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedItem.url && (
                  <Button asChild>
                    <a href={selectedItem.url} target="_blank" rel="noreferrer">
                      Megnyitás új lapon
                    </a>
                  </Button>
                )}
                {selectedItem.thumbnailUrl && selectedItem.thumbnailUrl !== selectedItem.url && (
                  <Button variant="secondary" asChild>
                    <a href={selectedItem.thumbnailUrl} target="_blank" rel="noreferrer">
                      Bélyegkép megnyitása
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="gap-2"
                  disabled={deletingIds.has(selectedItem.id)}
                  onClick={() => void handleDeleteFile(selectedItem)}
                >
                  {deletingIds.has(selectedItem.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                  Fájl törlése
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
