import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Folder,
  HardDrive,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

const bunnyStorageZone = (import.meta.env.VITE_BUNNY_STORAGE_ZONE || "").trim();
const bunnyStorageKey = (import.meta.env.VITE_BUNNY_STORAGE_KEY || "").trim();
const bunnyCdnHostname = (import.meta.env.VITE_BUNNY_CDN_HOSTNAME || "").trim();
const storageApiBase = "/api/bunny/storage";

type StorageEntry = {
  objectName: string;
  isDirectory: boolean;
  size: number;
  lastChanged: string;
  path: string;
};

type RawStorageEntry = StorageEntry &
  Partial<{
    ObjectName: string;
    IsDirectory: boolean;
    Length: number;
    LastChanged: string;
    Path: string;
  }>;

function encodePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export default function AdminFileManager() {
  const { isLoading, session } = useAdminAuthGuard();
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<StorageEntry[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasConfig = Boolean(bunnyStorageZone && bunnyStorageKey);

  const buildTargetPath = useCallback(
    (target?: string) => {
      const combined = [currentPath, target].filter(Boolean).join("/").replace(/\/+$/g, "");
      const normalized = combined ? `/${combined}` : "/";
      return normalized;
    },
    [currentPath],
  );

  const buildApiUrl = useCallback(
    (target?: string, opts?: { directory?: boolean }) => {
      const params = new URLSearchParams({ path: buildTargetPath(target) });
      if (opts?.directory) {
        params.set("directory", "true");
      }
      return `${storageApiBase}?${params.toString()}`;
    },
    [buildTargetPath],
  );

  const normalizeEntries = useCallback((payload: unknown): StorageEntry[] => {
    const items: RawStorageEntry[] = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { Items?: RawStorageEntry[] })?.Items)
        ? ((payload as { Items?: RawStorageEntry[] }).Items as RawStorageEntry[])
        : Array.isArray((payload as { items?: RawStorageEntry[] })?.items)
          ? ((payload as { items?: RawStorageEntry[] }).items as RawStorageEntry[])
          : [];

    return items.map((item) => ({
      objectName:
        item.ObjectName ||
        item.objectName ||
        (typeof item === "object" && item !== null ? (item as { Name?: string }).Name : undefined) ||
        item.path?.split("/").filter(Boolean).pop() ||
        item.Path?.split("/").filter(Boolean).pop() ||
        "",
      isDirectory: Boolean(item.isDirectory ?? item.IsDirectory),
      size: typeof item.size === "number" ? item.size : typeof item.Length === "number" ? item.Length : 0,
      lastChanged: item.lastChanged || item.LastChanged || new Date().toISOString(),
      path: item.path || item.Path || "",
    }));
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!hasConfig) return;
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl(undefined, { directory: true }), {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Nem sikerült betölteni a fájlokat. Ellenőrizd a beállításokat.");
      }

      const data = normalizeEntries(await response.json());
      const sorted = data
        .filter((entry) => Boolean(entry.objectName))
        .sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory));
      setEntries(sorted);
    } catch (err) {
      setEntries([]);
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt.");
    } finally {
      setIsFetching(false);
    }
  }, [buildApiUrl, hasConfig, normalizeEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleEnterFolder = (name: string) => {
    setCurrentPath((prev) => {
      const cleaned = prev.replace(/\/+$/g, "");
      return cleaned ? `${cleaned}/${name}` : name;
    });
  };

  const handleGoUp = () => {
    setCurrentPath((prev) => prev.split("/").slice(0, -1).join("/"));
  };

  const handleCreateFolder = async (event: FormEvent) => {
    event.preventDefault();
    if (!folderName.trim() || !hasConfig) return;

    setIsCreatingFolder(true);
    try {
      const response = await fetch(buildApiUrl(folderName, { directory: true }), {
        method: "PUT",
        body: "",
      });

      if (!response.ok) {
        throw new Error("A mappa létrehozása nem sikerült.");
      }

      toast.success("Mappa létrehozva");
      setFolderName("");
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !hasConfig) return;

    const files = Array.from(event.target.files);
    setIsUploading(true);

    try {
      for (const file of files) {
        const response = await fetch(buildApiUrl(file.name), {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`A(z) ${file.name} feltöltése nem sikerült.`);
        }
      }

      toast.success("Fájl(ok) feltöltve");
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Feltöltési hiba történt");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (entry: StorageEntry) => {
    if (!hasConfig) return;

    setDeleting(entry.objectName);
    try {
      const response = await fetch(buildApiUrl(entry.objectName, { directory: entry.isDirectory }), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Nem sikerült törölni az elemet.");
      }

      toast.success("Törölve");
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Törlési hiba történt");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const breadcrumbs = currentPath.split("/").filter(Boolean);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Fájlkezelő</p>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Bunny.net tároló
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Böngéssz, tölts fel, hozz létre mappákat és törölj fájlokat közvetlenül a Bunny.net storage zónádban.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchEntries} disabled={!hasConfig || isFetching}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Frissítés
            </Button>
            <Button onClick={handleUploadClick} disabled={!hasConfig || isUploading}>
              <UploadCloud className="h-4 w-4 mr-2" />
              Fájl feltöltése
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={!hasConfig}
            />
          </div>
        </div>

        {!hasConfig && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTitle>Hiányzó beállítások</AlertTitle>
            <AlertDescription>
              A fájlkezeléshez töltsd ki a következőket: VITE_BUNNY_STORAGE_ZONE = YOUR_STORAGE_ZONE_NAME,
              VITE_BUNNY_STORAGE_KEY = YOUR_BUNNY_STORAGE_API_KEY, VITE_BUNNY_STORAGE_HOST = storage.bunnycdn.com,
              VITE_BUNNY_CDN_HOSTNAME = a CDN/Pull zónád hostneve. A Bunny Storage API az AccessKey fejlécet várja.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <HardDrive className="h-5 w-5 text-primary" />
                Tároló tartalma
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={() => setCurrentPath("")}
                  disabled={!currentPath}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Gyökér
                </Button>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb} className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => setCurrentPath(breadcrumbs.slice(0, index + 1).join("/"))}
                    >
                      {crumb}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center" onSubmit={handleCreateFolder}>
              <Input
                placeholder="Új mappa neve"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                disabled={!hasConfig || isCreatingFolder}
              />
              <Button type="submit" disabled={!hasConfig || isCreatingFolder || !folderName.trim()}>
                {isCreatingFolder ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Mappa létrehozása
              </Button>
            </form>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleGoUp} disabled={!currentPath}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Egy szinttel feljebb
                </Button>
                {isFetching && (
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Betöltés
                  </Badge>
                )}
              </div>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Hiba</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : entries.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nincs megjeleníthető fájl vagy mappa.</div>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border bg-muted/30">
                {entries.map((entry) => {
                  const isDir = entry.isDirectory;
                  const name = entry.objectName;
                  const sizeLabel = isDir ? "—" : formatBytes(entry.size);
                  const href = !isDir && bunnyCdnHostname
                    ? `https://${bunnyCdnHostname}/${encodePath([currentPath, name].filter(Boolean).join("/"))}`
                    : null;

                  return (
                    <div key={name} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {isDir ? <Folder className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5" />}
                        <div className="space-y-1">
                          <button
                            type="button"
                            className="text-left font-medium text-foreground hover:underline"
                            onClick={() => (isDir ? handleEnterFolder(name) : undefined)}
                          >
                            {name}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {isDir ? "Mappa" : "Fájl"} • {new Date(entry.lastChanged).toLocaleString()} • {sizeLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {href && (
                          <Button asChild size="sm" variant="outline">
                            <a href={href} target="_blank" rel="noreferrer">
                              Megnyitás
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(entry)}
                          disabled={deleting === name}
                        >
                          {deleting === name ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                          Törlés
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
