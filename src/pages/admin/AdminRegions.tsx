import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  listImageKitFiles,
  uploadToImageKit,
  type ImageKitItem,
} from "@/services/imageKitService";
import {
  createRegion,
  deleteRegion,
  getAdminRegions,
  REGIONS_EVENT,
  updateRegion,
} from "@/services/regionsService";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import type { Region, RegionInput, RegionOrganizationInput } from "@/types/region";
import { toast } from "sonner";
import {
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Save,
  Trash,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REGIONS_FOLDER = "regiok";

const createEmptyOrganization = (): RegionOrganizationInput => ({
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  email: "",
  logoUrl: "",
  website: "",
});

const createEmptyRegion = (): RegionInput => ({
  id: undefined,
  nameHu: "",
  nameEn: "",
  imageUrl: "",
  organizations: [createEmptyOrganization()],
});

type ImageTarget =
  | { type: "region" }
  | { type: "organization"; index: number };

export default function AdminRegions() {
  const { session } = useAdminAuthGuard();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<RegionInput>(createEmptyRegion());
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserItems, setBrowserItems] = useState<ImageKitItem[]>([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserSearch, setBrowserSearch] = useState("");
  const [browserBasePath, setBrowserBasePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageTarget, setImageTarget] = useState<ImageTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasSelectedInitial = useRef(false);

  const sortedRegions = useMemo(
    () => [...regions].sort((a, b) => a.nameHu.localeCompare(b.nameHu, "hu")),
    [regions],
  );

  useEffect(() => {
    if (!session) return;

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const items = await getAdminRegions();
        if (!active) return;
        setRegions(items);
        if (items.length > 0 && !hasSelectedInitial.current) {
          hasSelectedInitial.current = true;
          setSelectedId((current) => current ?? items[0].id);
          setForm((current) => (current.nameHu ? current : { ...items[0] }));
        }
      } catch (error) {
        console.error(error);
        toast.error("Nem sikerült betölteni a régiókat");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    const handleUpdate = () => load();
    window.addEventListener(REGIONS_EVENT, handleUpdate as EventListener);

    return () => {
      active = false;
      window.removeEventListener(REGIONS_EVENT, handleUpdate as EventListener);
    };
  }, [session]);

  const resetForm = () => {
    setForm(createEmptyRegion());
    setSelectedId(null);
  };

  const handleSelect = (id: string) => {
    const region = regions.find((item) => item.id === id);
    if (!region) return;
    setSelectedId(id);
    setForm({ ...region });
  };

  const handleFieldChange = (key: keyof RegionInput, value: string | RegionOrganizationInput[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOrgChange = (index: number, key: keyof RegionOrganizationInput, value: string) => {
    setForm((prev) => {
      const organizations = [...prev.organizations];
      organizations[index] = { ...organizations[index], [key]: value };
      return { ...prev, organizations };
    });
  };

  const addOrganization = () => {
    setForm((prev) => ({ ...prev, organizations: [...prev.organizations, createEmptyOrganization()] }));
  };

  const removeOrganization = (index: number) => {
    setForm((prev) => ({
      ...prev,
      organizations: prev.organizations.filter((_, i) => i !== index),
    }));
  };

  const loadImages = async (path?: string) => {
    if (!browserBasePath && !path) return;
    try {
      setBrowserLoading(true);
      const items = await listImageKitFiles(browserBasePath || path || "");
      setBrowserItems(items);
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült betölteni a képeket");
    } finally {
      setBrowserLoading(false);
    }
  };

  const openBrowser = (target: ImageTarget, basePath: string) => {
    setImageTarget(target);
    setBrowserBasePath(basePath);
    setBrowserSearch("");
    setBrowserOpen(true);
    loadImages(basePath);
  };

  const handleImageSelect = (url: string) => {
    if (!imageTarget) return;

    if (imageTarget.type === "region") {
      handleFieldChange("imageUrl", url);
    } else {
      handleOrgChange(imageTarget.index, "logoUrl", url);
    }

    setBrowserOpen(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !browserBasePath) return;

    try {
      setUploading(true);
      const uploaded = await uploadToImageKit(file, browserBasePath);
      handleImageSelect(uploaded.url);
      loadImages(browserBasePath);
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült feltölteni a képet");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const slugify = (value: string) =>
    value
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

  const handleSave = async () => {
    if (!form.nameHu.trim()) {
      toast.error("A magyar név megadása kötelező");
      return;
    }

    const payload: RegionInput = {
      ...form,
      id: form.id || slugify(form.nameHu),
    };

    try {
      setSaving(true);
      let saved: Region;
      if (selectedId) {
        saved = await updateRegion(selectedId, payload);
      } else {
        saved = await createRegion(payload);
      }

      setRegions((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = saved;
          return copy;
        }
        return [...prev, saved];
      });

      setSelectedId(saved.id);
      setForm({ ...saved });
      toast.success("Régió mentve");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült menteni";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      setSaving(true);
      await deleteRegion(selectedId);
      setRegions((prev) => prev.filter((item) => item.id !== selectedId));
      resetForm();
      toast.success("Régió törölve");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült törölni a régiót");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!session) return;
    try {
      setRefreshing(true);
      const items = await getAdminRegions();
      setRegions(items);
      if (selectedId) {
        const updated = items.find((item) => item.id === selectedId);
        if (updated) {
          setForm({ ...updated });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült frissíteni a listát");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Régiók kezelése</p>
            <h1 className="text-2xl font-bold">Régiók</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              Frissítés
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Mentés
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-[260px,1fr] gap-5">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Régiók
              </h2>
              <Button size="sm" variant="outline" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" /> Új
              </Button>
            </div>

            <ScrollArea className="h-[480px]">
              <div className="space-y-2 pr-2">
                {loading && <p className="text-sm text-muted-foreground">Betöltés...</p>}
                {!loading && sortedRegions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nincs még régió rögzítve.</p>
                )}
                {sortedRegions.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => handleSelect(region.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border flex items-center justify-between",
                      selectedId === region.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div>
                      <div className="font-medium">{region.nameHu || "Névtelen régió"}</div>
                      <div className="text-xs text-muted-foreground">{region.nameEn || "Angol név nincs"}</div>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {region.organizations.length}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="p-6 space-y-6">
            {selectedId || form.nameHu ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="nameHu">Magyar név</Label>
                    <Input
                      id="nameHu"
                      value={form.nameHu}
                      onChange={(event) => handleFieldChange("nameHu", event.target.value)}
                      placeholder="Pl. Erdély"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="nameEn">Angol név</Label>
                    <Input
                      id="nameEn"
                      value={form.nameEn}
                      onChange={(event) => handleFieldChange("nameEn", event.target.value)}
                      placeholder="Pl. Transylvania"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Régió borítókép</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-24 w-32 rounded-lg overflow-hidden bg-muted border">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt={form.nameHu} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                          Nincs kép
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openBrowser({ type: "region" }, REGIONS_FOLDER)}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" /> Választás
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleFieldChange("imageUrl", "")}
                        >
                        <Trash className="h-4 w-4 mr-2" /> Eltávolítás
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Szervezetek
                    </h3>
                    <Button size="sm" variant="outline" onClick={addOrganization}>
                      <Plus className="h-4 w-4 mr-1" /> Új szervezet
                    </Button>
                  </div>

                  {form.organizations.map((org, index) => (
                    <Card key={index} className="p-4 space-y-3 border-dashed">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Szervezet #{index + 1}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeOrganization(index)}
                          disabled={form.organizations.length === 1}
                        >
                          <Trash className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Magyar név</Label>
                          <Input
                            value={org.name}
                            onChange={(event) => handleOrgChange(index, "name", event.target.value)}
                            placeholder="Név"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Angol név</Label>
                          <Input
                            value={org.nameEn}
                            onChange={(event) => handleOrgChange(index, "nameEn", event.target.value)}
                            placeholder="English name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Leírás (HU)</Label>
                          <Textarea
                            value={org.description}
                            onChange={(event) => handleOrgChange(index, "description", event.target.value)}
                            placeholder="Rövid leírás"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Leírás (EN)</Label>
                          <Textarea
                            value={org.descriptionEn}
                            onChange={(event) => handleOrgChange(index, "descriptionEn", event.target.value)}
                            placeholder="Short description"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={org.email}
                            onChange={(event) => handleOrgChange(index, "email", event.target.value)}
                            placeholder="kapcsolat@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Weboldal</Label>
                          <Input
                            value={org.website}
                            onChange={(event) => handleOrgChange(index, "website", event.target.value)}
                            placeholder="https://"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Logó</Label>
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border">
                            {org.logoUrl ? (
                              <img src={org.logoUrl} alt={org.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                                Nincs logó
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => openBrowser({ type: "organization", index }, `${REGIONS_FOLDER}/logos`)}
                            >
                              <ImageIcon className="h-4 w-4 mr-1" /> Választás
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              type="button"
                              onClick={() => handleOrgChange(index, "logoUrl", "")}
                            >
                              <Trash className="h-4 w-4 mr-1" /> Eltávolítás
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="destructive" onClick={handleDelete} disabled={!selectedId || saving}>
                    <Trash className="h-4 w-4 mr-2" /> Régió törlése
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Mentés
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">Válassz vagy hozz létre egy régiót a szerkesztéshez.</div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={browserOpen} onOpenChange={setBrowserOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Kép kiválasztása</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Keresés név szerint"
                value={browserSearch}
                onChange={(event) => setBrowserSearch(event.target.value)}
              />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
            </div>

            <ScrollArea className="h-[400px]">
              {browserLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" /> Betöltés...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-2">
                  {browserItems
                    .filter((item) => item.name.toLowerCase().includes(browserSearch.toLowerCase()))
                    .map((item) => (
                      <button
                        key={item.fileId}
                        type="button"
                        onClick={() => handleImageSelect(item.url)}
                        className="border rounded-lg overflow-hidden hover:border-primary focus:border-primary"
                      >
                        <div className="aspect-video bg-muted">
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2 text-left text-sm truncate">{item.name}</div>
                      </button>
                    ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
