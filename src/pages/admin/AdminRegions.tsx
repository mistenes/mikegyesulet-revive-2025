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
import { Switch } from "@/components/ui/switch";
import {
  listImageKitFiles,
  uploadExternalImageToImageKit,
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
  ShieldCheck,
  Save,
  Trash,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSettings, type SettingsStore } from "@/services/settingsService";

const REGIONS_FOLDER = "regiok";
const REGION_COVER_FOLDER = "regions";
const ORG_LOGO_FOLDER = "orglogo";

const createEmptyOrganization = (): RegionOrganizationInput => ({
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  email: "",
  logoUrl: "",
  website: "",
  facebookUrl: "",
  instagramUrl: "",
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

type ImportCandidate = {
  row: number;
  regionId: string;
  regionName: string;
  regionNameEn?: string;
  regionImage?: string;
  orgName: string;
  orgDescription: string;
  orgDescriptionEn?: string;
  email?: string;
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  logoUrl?: string;
  approved: boolean;
};

type RegionImportCandidate = {
  row: number;
  nameHu: string;
  nameEn?: string;
  imageUrl?: string;
  slug: string;
  approved: boolean;
};

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
  const [importPreview, setImportPreview] = useState<ImportCandidate[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [regionImportPreview, setRegionImportPreview] = useState<RegionImportCandidate[]>([]);
  const [regionImportError, setRegionImportError] = useState<string | null>(null);
  const [regionImporting, setRegionImporting] = useState(false);
  const [regionImportSaving, setRegionImportSaving] = useState(false);
  const [importerEnabled, setImporterEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const regionImportFileInputRef = useRef<HTMLInputElement | null>(null);
  const hasSelectedInitial = useRef(false);

  const sortedRegions = useMemo(
    () => [...regions].sort((a, b) => a.nameHu.localeCompare(b.nameHu, "hu")),
    [regions],
  );

  const approvedImportCount = useMemo(
    () => importPreview.filter((item) => item.approved).length,
    [importPreview],
  );

  const approvedRegionImportCount = useMemo(
    () => regionImportPreview.filter((item) => item.approved).length,
    [regionImportPreview],
  );

  const hasApprovedImport = approvedImportCount > 0;
  const hasApprovedRegionImport = approvedRegionImportCount > 0;

  useEffect(() => {
    const applySetting = (settings: SettingsStore) => {
      setImporterEnabled(Boolean(settings.general.regions_importer_enabled?.value ?? true));
    };

    applySetting(getSettings());

    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<SettingsStore>).detail;
      if (detail) {
        applySetting(detail);
      }
    };

    window.addEventListener("mik-settings-updated", handleSettingsUpdate as EventListener);
    return () => window.removeEventListener("mik-settings-updated", handleSettingsUpdate as EventListener);
  }, []);

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
      const { items } = await listImageKitFiles(undefined, browserBasePath || path || "");
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

  const handleImportFile = async (file: File) => {
    try {
      setImporting(true);
      const text = await file.text();
      const { candidates, errors } = parseImportCsv(text);
      setImportPreview(candidates);
      setImportError(errors.length ? errors.join("\n") : null);
      if (errors.length) {
        toast.warning("Néhány sor kimaradt az importból. Ellenőrizd az üzenetet.");
      } else {
        toast.success("Az import adatok előnézete elkészült");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült feldolgozni a CSV fájlt";
      setImportError(message);
      setImportPreview([]);
      toast.error(message);
    } finally {
      setImporting(false);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = "";
      }
    }
  };

  const handleImportInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImportFile(file);
    }
  };

  const handleRegionImportFile = async (file: File) => {
    try {
      setRegionImporting(true);
      const text = await file.text();
      const { candidates, errors } = parseRegionImportCsv(text);
      setRegionImportPreview(candidates);
      setRegionImportError(errors.length ? errors.join("\n") : null);
      if (errors.length) {
        toast.warning("Néhány régió kimaradt az import előnézetből. Ellenőrizd az üzenetet.");
      } else {
        toast.success("A régió import előnézete elkészült");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült feldolgozni a régió CSV fájlt";
      setRegionImportError(message);
      setRegionImportPreview([]);
      toast.error(message);
    } finally {
      setRegionImporting(false);
      if (regionImportFileInputRef.current) {
        regionImportFileInputRef.current.value = "";
      }
    }
  };

  const handleRegionImportInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleRegionImportFile(file);
    }
  };

  const toggleImportApproval = (row: number, approved: boolean) => {
    setImportPreview((prev) => prev.map((item) => (item.row === row ? { ...item, approved } : item)));
  };

  const toggleAllImportApprovals = (approved: boolean) => {
    setImportPreview((prev) => prev.map((item) => ({ ...item, approved })));
  };

  const toggleRegionImportApproval = (row: number, approved: boolean) => {
    setRegionImportPreview((prev) => prev.map((item) => (item.row === row ? { ...item, approved } : item)));
  };

  const toggleAllRegionImportApprovals = (approved: boolean) => {
    setRegionImportPreview((prev) => prev.map((item) => ({ ...item, approved })));
  };

  const handleImportSubmit = async () => {
    if (!importPreview.length) {
      toast.error("Tölts fel egy CSV-t az importáláshoz");
      return;
    }

    const approvedItems = importPreview.filter((item) => item.approved);
    if (!approvedItems.length) {
      toast.error("Legalább egy sort jóvá kell hagyni az importáláshoz");
      return;
    }

    setImportSaving(true);

    try {
      const existing = await getAdminRegions();
      for (const region of existing) {
        await deleteRegion(region.id);
      }

      const regionMap = new Map<string, RegionInput>();

      for (const candidate of approvedItems) {
        const regionKey = candidate.regionId || slugify(candidate.regionName);
        const region = regionMap.get(regionKey) || {
          id: regionKey,
          nameHu: candidate.regionName,
          nameEn: candidate.regionNameEn,
          imageUrl: candidate.regionImage || "",
          organizations: [],
        };

        let logoUrl = candidate.logoUrl;
        if (candidate.logoUrl) {
          try {
            const logoName = `${slugify(candidate.orgName || "logo")}-${candidate.row}`;
            logoUrl = await uploadExternalImageToImageKit(candidate.logoUrl, ORG_LOGO_FOLDER, logoName);
          } catch (error) {
            console.error(error);
            throw new Error(`Nem sikerült feltölteni a logót (${candidate.orgName || "ismeretlen"})`);
          }
        }

        region.organizations.push({
          name: candidate.orgName,
          description: candidate.orgDescription || candidate.orgName,
          descriptionEn: candidate.orgDescriptionEn,
          email: candidate.email,
          logoUrl,
          website: candidate.website,
          facebookUrl: candidate.facebookUrl,
          instagramUrl: candidate.instagramUrl,
        });

        regionMap.set(regionKey, region);
      }

      const created: Region[] = [];
      for (const region of regionMap.values()) {
        const saved = await createRegion(region);
        created.push(saved);
      }

      setRegions(created);
      if (created.length) {
        setSelectedId(created[0].id);
        setForm({ ...created[0] });
      } else {
        resetForm();
      }

      setImportPreview([]);
      setImportError(null);
      toast.success(`Importálva: ${created.length} régió`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült importálni a régiókat";
      toast.error(message);
    } finally {
      setImportSaving(false);
    }
  };

  const handleRegionImportSubmit = async () => {
    if (!regionImportPreview.length) {
      toast.error("Tölts fel egy CSV-t a régió importálásához");
      return;
    }

    const approvedItems = regionImportPreview.filter((item) => item.approved);
    if (!approvedItems.length) {
      toast.error("Legalább egy régiót jóvá kell hagyni az importáláshoz");
      return;
    }

    setRegionImportSaving(true);

    try {
      const existing = await getAdminRegions();
      for (const region of existing) {
        await deleteRegion(region.id);
      }

      const created: Region[] = [];

      for (const candidate of approvedItems) {
        let imageUrl = candidate.imageUrl || "";

        if (candidate.imageUrl) {
          try {
            const coverName = `${candidate.slug}-cover`;
            imageUrl = await uploadExternalImageToImageKit(candidate.imageUrl, REGION_COVER_FOLDER, coverName);
          } catch (error) {
            console.error(error);
            throw new Error(`Nem sikerült feltölteni a borítóképet (${candidate.nameHu})`);
          }
        }

        const regionInput: RegionInput = {
          id: candidate.slug,
          nameHu: candidate.nameHu,
          nameEn: candidate.nameEn,
          imageUrl,
          organizations: [],
        };

        const saved = await createRegion(regionInput);
        created.push(saved);
      }

      setRegions(created);
      if (created.length) {
        setSelectedId(created[0].id);
        setForm({ ...created[0] });
      } else {
        resetForm();
      }

      setRegionImportPreview([]);
      setRegionImportError(null);
      toast.success(`Importálva: ${created.length} régió`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Nem sikerült importálni a régiókat";
      setRegionImportError(message);
      toast.error(message);
    } finally {
      setRegionImportSaving(false);
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

  const normalizeKey = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const parseCsv = (content: string) => {
    const rows: string[][] = [];
    const clean = content.replace(/\r\n?/g, "\n");
    let current: string[] = [];
    let value = "";
    let inQuotes = false;

    for (let i = 0; i <= clean.length; i += 1) {
      const char = clean[i] ?? "";
      const isLast = i === clean.length;

      if (inQuotes) {
        if (char === '"') {
          const next = clean[i + 1];
          if (next === '"') {
            value += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          value += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
        continue;
      }

      if (char === "," || char === "\n" || isLast) {
        current.push(value);
        value = "";

        if (char === "\n" || isLast) {
          rows.push(current);
          current = [];
        }

        continue;
      }

      value += char;
    }

    return rows.filter((row) => row.length && row.some((cell) => cell.trim() !== ""));
  };

  const matchRegion = (label: string) => {
    const normalized = normalizeKey(label);
    return regions.find(
      (item) =>
        normalizeKey(item.id) === normalized ||
        normalizeKey(item.nameHu) === normalized ||
        normalizeKey(item.nameEn || "") === normalized,
    );
  };

  const parseImportCsv = (content: string) => {
    const rows = parseCsv(content);
    if (!rows.length) {
      throw new Error("Az importfájl üresnek tűnik");
    }

    const headers = rows[0].map((header) => header.trim());
    const normalizedHeaders = headers.map(normalizeKey);

    const getValue = (row: string[], keys: string[]) => {
      for (const key of keys) {
        const normalizedKey = normalizeKey(key);
        const index = normalizedHeaders.findIndex((header) => header === normalizedKey);
        if (index !== -1) {
          return row[index] || "";
        }
      }
      return "";
    };

    const NAME_HEADERS = ["név", "name", "szervezet neve"];
    const EMAIL_HEADERS = ["e-mail cím", "e mail cím", "email", "mail"];
    const REGION_HEADERS = ["melyik régióhoz tartozik?", "régió", "regio", "regio neve"];
    const DESCRIPTION_HEADERS = ["rövid bemutatkozó szöveg", "leírás", "leiras (hu)"];
    const DESCRIPTION_EN_HEADERS = ["[en] brief", "leírás (en)", "leiras (en)", "brief en"];
    const LOGO_HEADERS = ["logó", "logo", "logokep"];
    const WEBSITE_HEADERS = ["weboldal", "website", "url"];
    const FACEBOOK_HEADERS = ["facebook url", "facebook"];
    const INSTAGRAM_HEADERS = ["instagram", "instagram url"];

    const candidates: ImportCandidate[] = [];
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || row.every((cell) => !cell.trim())) continue;

      const orgName = getValue(row, NAME_HEADERS).trim();
      const regionLabel = getValue(row, REGION_HEADERS).trim();
      const email = getValue(row, EMAIL_HEADERS).trim();
      const description = getValue(row, DESCRIPTION_HEADERS).trim();
      const descriptionEn = getValue(row, DESCRIPTION_EN_HEADERS).trim();
      const logoUrl = getValue(row, LOGO_HEADERS).trim();
      const website = getValue(row, WEBSITE_HEADERS).trim();
      const facebookUrl = getValue(row, FACEBOOK_HEADERS).trim();
      const instagramUrl = getValue(row, INSTAGRAM_HEADERS).trim();

      if (!orgName) {
        errors.push(`${i + 1}. sor: hiányzik a szervezet neve (Név)`);
        continue;
      }

      if (!regionLabel) {
        errors.push(`${i + 1}. sor: nincs megadva régió (Melyik régióhoz tartozik?)`);
        continue;
      }

      const matchedRegion = matchRegion(regionLabel);
      if (!matchedRegion) {
        errors.push(`${i + 1}. sor: a megadott régió nem található: ${regionLabel}`);
        continue;
      }

      candidates.push({
        row: i + 1,
        regionId: matchedRegion.id,
        regionName: matchedRegion.nameHu || regionLabel,
        regionNameEn: matchedRegion.nameEn,
        regionImage: matchedRegion.imageUrl,
        orgName,
        orgDescription: description,
        orgDescriptionEn: descriptionEn,
        email,
        website,
        facebookUrl,
        instagramUrl,
        logoUrl,
        approved: false,
      });
    }

    return { candidates, errors };
  };

  const parseRegionImportCsv = (content: string) => {
    const rows = parseCsv(content);
    if (!rows.length) {
      throw new Error("Az importfájl üresnek tűnik");
    }

    const headers = rows[0].map((header) => header.trim());
    const normalizedHeaders = headers.map(normalizeKey);

    const getValue = (row: string[], keys: string[]) => {
      for (const key of keys) {
        const normalizedKey = normalizeKey(key);
        const index = normalizedHeaders.findIndex((header) => header === normalizedKey);
        if (index !== -1) {
          return row[index] || "";
        }
      }
      return "";
    };

    const NAME_HU_HEADERS = ["a régió neve", "régió neve", "regio neve", "name", "region"];
    const NAME_EN_HEADERS = ["[en] region name", "region name en", "region name", "name en"];
    const IMAGE_HEADERS = ["régió borítókép", "borítókép", "cover", "cover image", "image"];

    const candidates: RegionImportCandidate[] = [];
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || row.every((cell) => !cell.trim())) continue;

      const nameHu = getValue(row, NAME_HU_HEADERS).trim();
      const nameEn = getValue(row, NAME_EN_HEADERS).trim();
      const imageUrl = getValue(row, IMAGE_HEADERS).trim();

      if (!nameHu) {
        errors.push(`${i + 1}. sor: hiányzik a régió neve (A régió neve)`);
        continue;
      }

      const slug = slugify(nameHu);
      if (!slug) {
        errors.push(`${i + 1}. sor: nem sikerült slugot képezni a régióhoz (${nameHu})`);
        continue;
      }

      candidates.push({
        row: i + 1,
        nameHu,
        nameEn: nameEn || undefined,
        imageUrl: imageUrl || undefined,
        slug,
        approved: false,
      });
    }

    return { candidates, errors };
  };

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
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Mentés
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {importerEnabled ? (
            <Badge variant="secondary">CSV import engedélyezve</Badge>
          ) : (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
              CSV import kikapcsolva a Beállításokban
            </Badge>
          )}
        </div>

        {importerEnabled ? (
          <>
            <Card className="p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">CSV import</p>
                    <h2 className="text-lg font-semibold">Régiók betöltése</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A feltöltés előtt minden jelenlegi régió törlődik. A CSV tartalmazza az "A régió neve", "Régió Borítókép"
                    és "[EN] Region Name" oszlopokat. A borítóképek letöltve, majd a /regions mappába feltöltve kerülnek
                    mentésre.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => toggleAllRegionImportApprovals(true)}
                    disabled={!regionImportPreview.length}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" /> Összes jóváhagyása
                  </Button>
                  <Button
                    onClick={handleRegionImportSubmit}
                    type="button"
                    disabled={
                      !hasApprovedRegionImport || regionImportSaving || regionImporting || !regionImportPreview.length
                    }
                    className="gap-2"
                  >
                    {regionImportSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Importálás
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => regionImportFileInputRef.current?.click()}
                    disabled={regionImporting}
                  >
                    {regionImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} CSV feltöltés
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Jóváhagyva: {approvedRegionImportCount}/{regionImportPreview.length || 0}. Legalább egy régiót jóvá kell hagynod az importáláshoz.
                </div>
                <Badge variant={hasApprovedRegionImport && regionImportPreview.length ? "default" : "outline"}>
                  {hasApprovedRegionImport && regionImportPreview.length ? "Importálásra kész" : "Jóváhagyás szükséges"}
                </Badge>
              </div>

              {regionImportError && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 whitespace-pre-line">
                  {regionImportError}
                </div>
              )}

              {regionImportPreview.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Tölts fel egy CSV fájlt a régiókhoz. A sorok előnézetben jelennek meg, a kiválasztottakat jóváhagyás után tudod importálni.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {regionImportPreview.map((item) => (
                    <div key={item.row} className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="outline">Sor {item.row}</Badge>
                          <Badge variant="secondary">{item.slug}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Switch
                            checked={item.approved}
                            onCheckedChange={(checked) => toggleRegionImportApproval(item.row, checked)}
                          />
                          <span>Jóváhagyva</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{item.nameHu}</h3>
                        {item.nameEn && <p className="text-xs text-muted-foreground">EN: {item.nameEn}</p>}
                      </div>

                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.nameHu} className="h-28 w-full object-cover rounded-md" />
                      ) : (
                        <p className="text-xs text-muted-foreground">Nincs borítókép</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={regionImportFileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleRegionImportInputChange}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CSV import</p>
                  <h2 className="text-lg font-semibold">Régiók és szervezetek betöltése</h2>
                  <p className="text-sm text-muted-foreground">
                    A feltöltés előtt minden jelenlegi régió törlődik. A CSV-ben legyen benne a Név, Melyik régióhoz tartozik?,
                    Rövid bemutatkozó szöveg, Leírás (EN), E-mail cím, Logó, weboldal és közösségi linkek.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => toggleAllImportApprovals(true)}
                    disabled={!importPreview.length}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" /> Összes jóváhagyása
                  </Button>
                  <Button
                    onClick={handleImportSubmit}
                    type="button"
                    disabled={!hasApprovedImport || importSaving || importing || !importPreview.length}
                    className="gap-2"
                  >
                    {importSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Importálás
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => importFileInputRef.current?.click()}
                    disabled={importing}
                  >
                    {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} CSV feltöltés
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Jóváhagyva: {approvedImportCount}/{importPreview.length || 0}. Legalább egy sort jóvá kell hagynod az importáláshoz.
                </div>
                <Badge variant={hasApprovedImport && importPreview.length ? "default" : "outline"}>
                  {hasApprovedImport && importPreview.length ? "Importálásra kész" : "Jóváhagyás szükséges"}
                </Badge>
              </div>

              {importError && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 whitespace-pre-line">
                  {importError}
                </div>
              )}

              {importPreview.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Tölts fel egy CSV fájlt a Webflow exportból. A sorok előnézetben jelennek meg, a kiválasztottakat jóváhagyás
                  után tudod importálni.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {importPreview.map((item) => (
                    <div key={item.row} className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="outline">Sor {item.row}</Badge>
                          <Badge variant="secondary">{item.regionName}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Switch
                            checked={item.approved}
                            onCheckedChange={(checked) => toggleImportApproval(item.row, checked)}
                          />
                          <span>Jóváhagyva</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{item.orgName}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {item.orgDescription || "Nincs leírás megadva"}
                        </p>
                        {item.orgDescriptionEn && (
                          <p className="text-xs text-muted-foreground">EN: {item.orgDescriptionEn}</p>
                        )}
                      </div>

                      {item.logoUrl ? (
                        <img src={item.logoUrl} alt={item.orgName} className="h-24 w-full object-contain bg-white rounded-md" />
                      ) : (
                        <p className="text-xs text-muted-foreground">Nincs logó</p>
                      )}

                      <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                        {item.email && <span>Email: {item.email}</span>}
                        {item.website && <span>Web: {item.website}</span>}
                        {item.facebookUrl && <span>Facebook: {item.facebookUrl}</span>}
                        {item.instagramUrl && <span>Instagram: {item.instagramUrl}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={importFileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportInputChange}
              />
            </Card>
          </>
        ) : (
          <Card className="p-6 border-dashed border-amber-200 bg-amber-50/50 text-amber-900">
            <h2 className="text-lg font-semibold mb-2">CSV import kikapcsolva</h2>
            <p className="text-sm">
              A régiók CSV importálása jelenleg tiltva van a Beállítások menüben. Kapcsold be a "Régió CSV import" kapcsolót a használathoz.
            </p>
          </Card>
        )}

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

                  {form.organizations.length === 0 && (
                    <Card className="p-4 border-dashed flex items-center justify-between">
                      <div>
                        <p className="font-medium">Nincs szervezet rögzítve</p>
                        <p className="text-sm text-muted-foreground">Adj hozzá egy új szervezetet a régióhoz.</p>
                      </div>
                      <Button size="sm" onClick={addOrganization}>
                        <Plus className="h-4 w-4 mr-1" /> Új szervezet
                      </Button>
                    </Card>
                  )}

                  {form.organizations.map((org, index) => (
                    <Card key={index} className="p-4 space-y-3 border-dashed">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Szervezet #{index + 1}</p>
                        <Button size="icon" variant="ghost" onClick={() => removeOrganization(index)}>
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
                            value={org.email || ""}
                            onChange={(event) => handleOrgChange(index, "email", event.target.value)}
                            placeholder="kapcsolat@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Weboldal</Label>
                          <Input
                            value={org.website || ""}
                            onChange={(event) => handleOrgChange(index, "website", event.target.value)}
                            placeholder="https://"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Facebook</Label>
                          <Input
                            value={org.facebookUrl || ""}
                            onChange={(event) => handleOrgChange(index, "facebookUrl", event.target.value)}
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Instagram</Label>
                          <Input
                            value={org.instagramUrl || ""}
                            onChange={(event) => handleOrgChange(index, "instagramUrl", event.target.value)}
                            placeholder="https://instagram.com/..."
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
                    .filter((item) => (item.name || "").toLowerCase().includes(browserSearch.toLowerCase()))
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
