import { useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { Cloud, ExternalLink, FileStack, Globe2, KeyRound, Link2 } from "lucide-react";

const bunnyStorageZone = import.meta.env.VITE_BUNNY_STORAGE_ZONE || "";
const bunnyStorageKey = import.meta.env.VITE_BUNNY_STORAGE_KEY || "";
const bunnyCdnHostname = import.meta.env.VITE_BUNNY_CDN_HOSTNAME || "";
const bunnyStorageHost = import.meta.env.VITE_BUNNY_STORAGE_HOST || "storage.bunnycdn.com";

function maskSecret(value: string) {
  if (!value) return "Nincs beállítva";
  if (value.length <= 6) return "***";
  return `${value.slice(0, 3)}…${value.slice(-2)}`;
}

export default function AdminFileManager() {
  const { isLoading, session } = useAdminAuthGuard();

  const endpoints = useMemo(
    () => ({
      storageApi: bunnyStorageZone ? `https://${bunnyStorageHost}/${bunnyStorageZone}/` : "Állítsd be a storage zónát",
      cdnUrl: bunnyCdnHostname ? `https://${bunnyCdnHostname}/` : "Állítsd be a CDN hostot",
    }),
    [bunnyCdnHostname, bunnyStorageHost, bunnyStorageZone],
  );

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Fájlkezelő</p>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Bunny.net alapú tároló
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              A fájlkezelő a Bunny.net storage zónáját használja a dokumentumok és statikus fájlok kiszolgálásához.
              Ellenőrizd az alábbi beállításokat, mielőtt feltöltéseket engedélyezel.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="https://dash.bunny.net/storage" target="_blank" rel="noreferrer">
              Bunny.net konzol
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Storage zóna</CardTitle>
              </div>
              <Badge variant={bunnyStorageZone ? "default" : "secondary"}>
                {bunnyStorageZone ? "Aktív" : "Hiányzik"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-1">
              <CardDescription className="text-sm text-muted-foreground">Zóna neve</CardDescription>
              <p className="font-medium text-foreground">
                {bunnyStorageZone || "Nincs beállítva (VITE_BUNNY_STORAGE_ZONE)"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Storage kulcs</CardTitle>
              </div>
              <Badge variant={bunnyStorageKey ? "default" : "secondary"}>
                {bunnyStorageKey ? "Beállítva" : "Hiányzik"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-1">
              <CardDescription className="text-sm text-muted-foreground">API kulcs</CardDescription>
              <p className="font-medium text-foreground">
                {bunnyStorageKey ? maskSecret(bunnyStorageKey) : "Nincs beállítva (VITE_BUNNY_STORAGE_KEY)"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">CDN host</CardTitle>
              </div>
              <Badge variant={bunnyCdnHostname ? "default" : "secondary"}>
                {bunnyCdnHostname ? "Aktív" : "Hiányzik"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-1">
              <CardDescription className="text-sm text-muted-foreground">Elérési cím</CardDescription>
              <p className="font-medium text-foreground">
                {bunnyCdnHostname || "Nincs beállítva (VITE_BUNNY_CDN_HOSTNAME)"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Környezeti változók kitöltése</CardTitle>
                <CardDescription>Gyors útmutató a Bunny.net értékek beszerzéséhez.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">VITE_BUNNY_STORAGE_ZONE</span>: a storage zóna neve (pl.
                <code className="ml-1">your-storage-zone-name</code>), amit a Bunny.net Storage menüben találsz.
              </li>
              <li>
                <span className="font-medium text-foreground">VITE_BUNNY_STORAGE_KEY</span>: a Storage zónához tartozó
                <em>Access Key</em>, ami a <em>FTP &amp; API Access</em> panelen jelenik meg.
              </li>
              <li>
                <span className="font-medium text-foreground">VITE_BUNNY_CDN_HOSTNAME</span>: a kiadási/pull zóna host neve
                (pl. <code className="ml-1">example.b-cdn.net</code> vagy a saját domain), ahonnan a fájlok publikusak.
              </li>
              <li>
                <span className="font-medium text-foreground">VITE_BUNNY_STORAGE_HOST</span>: régiótól függő storage host
                (alapértelmezés: <code className="ml-1">storage.bunnycdn.com</code>). Csak akkor módosítsd, ha külön régiót
                használsz.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <FileStack className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Elérési pontok</CardTitle>
                <CardDescription>
                  Használd ezeket az URL-eket a szerver oldali integrációhoz vagy külső kliensekhez.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Link2 className="h-4 w-4" />Storage API
                </div>
                <Badge variant="secondary">WRITE</Badge>
              </div>
              <p className="mt-2 break-all text-sm text-muted-foreground">{endpoints.storageApi}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Közvetlen feltöltésekhez használd az <code>AccessKey</code> fejléccel.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Link2 className="h-4 w-4" />CDN URL
                </div>
                <Badge variant="secondary">READ</Badge>
              </div>
              <p className="mt-2 break-all text-sm text-muted-foreground">{endpoints.cdnUrl}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Statikus fájlok kiszolgálásához vagy a webes felületen való előnézethez használd.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Használati útmutató</CardTitle>
                <CardDescription>
                  Rövid lépések a Bunny.net storage és a Fájlkezelő összekapcsolásához.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge className="mt-1">1</Badge>
              <div>
                <p className="font-medium text-foreground">Állítsd be a környezeti változókat</p>
                <p className="text-sm text-muted-foreground">
                  A render.yaml fájlban add meg a <code>VITE_BUNNY_STORAGE_ZONE</code>, <code>VITE_BUNNY_STORAGE_KEY</code> és
                  <code> VITE_BUNNY_CDN_HOSTNAME</code> értékeket. A storage hostot a <code>VITE_BUNNY_STORAGE_HOST</code> változóval
                  testreszabhatod, ha régióspecifikus végpontot használsz.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge className="mt-1">2</Badge>
              <div>
                <p className="font-medium text-foreground">Használd a storage API-t feltöltéshez</p>
                <p className="text-sm text-muted-foreground">
                  Feltöltéskor a storage API végpontot hívd meg az <code>AccessKey</code> fejléccel. A Fájlkezelő
                  kliensoldali elemei ezt az API-t fogják használni a későbbi fejlesztések során.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge className="mt-1">3</Badge>
              <div>
                <p className="font-medium text-foreground">CDN-en keresztüli elérés</p>
                <p className="text-sm text-muted-foreground">
                  A publikus linkek a megadott CDN hoston keresztül érhetők el. A Fájlkezelő itt listázza majd a
                  dokumentumok előnézeteit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
