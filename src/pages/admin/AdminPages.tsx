import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Languages,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Upload,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getAllSections, saveSection } from "@/services/pageContentService";
import type { LanguageCode } from "@/types/language";
import type { LocalizedSectionContent, PageContentMetadata, SectionContent } from "@/types/pageContent";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { defaultPageContent } from "@/data/defaultPageContent";
import { listImageKitFiles, uploadToImageKit, type ImageKitItem } from "@/services/imageKitService";
import { cn } from "@/lib/utils";

const PAGE_CONTENT_FOLDER = "page-content";

const sectionGroups = {
  fooldal: [
    { key: "hero_content", label: "Hero Szekció" },
    { key: "about_section", label: "Rólunk Röviden" },
    { key: "hero_stats", label: "Statisztikák" },
    { key: "news_section", label: "Hírek Szekció" },
    { key: "regions_section", label: "Régiók Szekció" },
  ],
  regiok: [
    { key: "regions_intro", label: "Bevezető Szekció" },
    { key: "regions_map", label: "Térkép Szekció" },
    { key: "regions_list", label: "Régiók Lista" },
  ],
  rolunk: [
    { key: "about_section", label: "Bevezető" },
  ],
  galeria: [
    { key: "gallery_intro", label: "Bevezető Szekció" },
    { key: "gallery_images", label: "Galéria Képek" },
  ],
} as const;

const liveTabPaths: Record<keyof typeof sectionGroups, string> = {
  fooldal: "/",
  regiok: "/regiok",
  rolunk: "/rolunk",
  galeria: "/galeria",
};

const pageDefinitions: Record<keyof typeof sectionGroups, { title: string; description: string }> = {
  fooldal: {
    title: "Főoldal",
    description: "Hero, rólunk röviden, statisztikák és kiemelt szekciók szerkesztése",
  },
  regiok: {
    title: "Régiók",
    description: "Régiós bevezető, térkép és lista tartalmak kezelése",
  },
  rolunk: {
    title: "Rólunk",
    description: "Szervezet bemutatása, alcímek és képek szerkesztése",
  },
  galeria: {
    title: "Galéria",
    description: "Bevezető és képek leírásainak módosítása",
  },
};

const sectionDefinitions: Record<
  string,
  {
    fields: Array<{
      key: string;
      label: string;
      type?: "text" | "textarea" | "json" | "image";
      placeholder?: string;
      description?: string;
    }>;
  }
> = {
  hero_content: {
    fields: [
      { key: "title", label: "Cím", type: "textarea" },
      { key: "description", label: "Leírás", type: "textarea", placeholder: "Vázold fel a hős szekció szövegét" },
      { key: "primaryButtonText", label: "Elsődleges gomb szövege" },
      { key: "primaryButtonUrl", label: "Elsődleges gomb link" },
      { key: "secondaryButtonText", label: "Másodlagos gomb szövege" },
      { key: "imageUrl", label: "Háttérkép / fotó", type: "image", description: "Válaszd ki a hero képet az ImageKitből" },
    ],
  },
  hero_stats: {
    fields: [
      {
        key: "stats",
        label: "Statisztikák",
        type: "json",
        description: "JSON tömb, pl. [{ value: '2000+', label: 'Aktív tag' }]",
      },
    ],
  },
  news_section: {
    fields: [
      { key: "subtitle", label: "Felső címke" },
      { key: "title", label: "Cím", type: "textarea" },
      { key: "description", label: "Leírás", type: "textarea" },
      { key: "buttonText", label: "Gomb szöveg" },
    ],
  },
  regions_section: {
    fields: [
      { key: "eyebrow", label: "Felső címke" },
      { key: "title", label: "Cím", type: "textarea" },
      { key: "description", label: "Leírás", type: "textarea" },
      { key: "buttonText", label: "Gomb szöveg" },
      {
        key: "chips",
        label: "Kiemelt régiók",
        type: "json",
        description: "JSON tömb régió nevekkel",
      },
    ],
  },
  about_section: {
    fields: [
      { key: "badge", label: "Badge" },
      { key: "title", label: "Cím", type: "textarea" },
      { key: "subtitle", label: "Alcím" },
      { key: "description", label: "Leírás", type: "textarea" },
      { key: "buttonText", label: "Gomb szöveg" },
      { key: "ctaBadge", label: "CTA badge" },
      { key: "ctaTitle", label: "CTA cím" },
      { key: "ctaDescription", label: "CTA leírás", type: "textarea" },
      { key: "ctaButton", label: "CTA gomb szöveg" },
      { key: "imageUrl", label: "Kép", type: "image", description: "Rólunk kép kiválasztása" },
    ],
  },
  regions_intro: {
    fields: [
      { key: "eyebrow", label: "Felső címke" },
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
      { key: "imageUrl", label: "Borítókép", type: "image" },
    ],
  },
  regions_map: {
    fields: [
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
    ],
  },
  regions_list: {
    fields: [
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
    ],
  },
  gallery_intro: {
    fields: [
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
      { key: "imageUrl", label: "Borítókép", type: "image" },
    ],
  },
  gallery_images: {
    fields: [
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
    ],
  },
};

type SectionKey = string;

type FieldTarget = {
  sectionKey: SectionKey;
  fieldKey: string;
};

export default function AdminPages() {
  const { isLoading, session } = useAdminAuthGuard();
  const [pageContent, setPageContent] = useState<Record<SectionKey, LocalizedSectionContent>>({});
  const [pageMetadata, setPageMetadata] = useState<Partial<Record<keyof typeof sectionGroups, PageContentMetadata>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<keyof typeof sectionGroups | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>("hu");
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldTarget | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  const [imageBrowserOpen, setImageBrowserOpen] = useState(false);
  const [imageBrowserItems, setImageBrowserItems] = useState<ImageKitItem[]>([]);
  const [imageBrowserLoading, setImageBrowserLoading] = useState(false);
  const [imageBrowserSearch, setImageBrowserSearch] = useState("");
  const [imageBrowserPath, setImageBrowserPath] = useState<string | null>(null);
  const [imageBrowserBasePath, setImageBrowserBasePath] = useState<string | null>(null);
  const [imageTarget, setImageTarget] = useState<FieldTarget | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<FieldTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [livePreviewKey, setLivePreviewKey] = useState(() => Date.now().toString());

  const sectionTabMap = useMemo(() => {
    const map: Record<string, keyof typeof sectionGroups> = {};
    (Object.keys(sectionGroups) as Array<keyof typeof sectionGroups>).forEach((tab) => {
      sectionGroups[tab].forEach((item) => {
        map[item.key] = tab;
      });
    });
    return map;
  }, []);

  const normalizePageMetadata = useCallback(
    (metadata?: Record<string, PageContentMetadata>) => {
      const result: Partial<Record<keyof typeof sectionGroups, PageContentMetadata>> = {};
      if (!metadata) return result;

      Object.entries(metadata).forEach(([key, meta]) => {
        const pageKey = (sectionTabMap[key] as keyof typeof sectionGroups | undefined) || (key as keyof typeof sectionGroups);
        if (!pageKey) return;

        const current = result[pageKey];
        const currentTime = current?.lastEditedAt ? new Date(current.lastEditedAt).getTime() : null;
        const incomingTime = meta.lastEditedAt ? new Date(meta.lastEditedAt).getTime() : null;

        if (currentTime && incomingTime && incomingTime < currentTime) return;
        result[pageKey] = meta;
      });

      return result;
    },
    [sectionTabMap],
  );

  useEffect(() => {
    if (!session) return;

    let active = true;

    const loadSections = async () => {
      try {
        const { sections, metadata } = await getAllSections();
        if (!active) return;
        setPageContent(sections);
        setPageMetadata(normalizePageMetadata(metadata));
      } catch (error) {
        console.error("Failed to load page content", error);
        toast.error("Nem sikerült betölteni az oldal tartalmait");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSections();

    return () => {
      active = false;
    };
  }, [normalizePageMetadata, session]);

  const ensureSection = (sectionKey: SectionKey): LocalizedSectionContent => {
    const existing = pageContent[sectionKey];
    if (existing) return existing;

    return defaultPageContent[sectionKey] || { hu: {}, en: {} };
  };

  const registerFieldRef = (sectionKey: SectionKey, fieldKey: string) => (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    fieldRefs.current[`${sectionKey}.${fieldKey}`] = el;
  };

  const scrollToField = (sectionKey: SectionKey, fieldKey: string) => {
    const ref = fieldRefs.current[`${sectionKey}.${fieldKey}`];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.focus();
    }
  };

  const focusFromPreview = useCallback(
    (sectionKey: SectionKey, fieldKey: string) => {
      const targetTab = sectionTabMap[sectionKey];
      if (targetTab) {
        setSelectedPage(targetTab);
      }
      setSelectedField({ sectionKey, fieldKey });
      setTimeout(() => scrollToField(sectionKey, fieldKey), 50);
    },
    [sectionTabMap],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== "object") return;

      const { type, sectionKey, fieldKey } = event.data as {
        type?: string;
        sectionKey?: SectionKey;
        fieldKey?: string;
      };

      if (type === "page-edit-focus" && sectionKey && fieldKey) {
        focusFromPreview(sectionKey, fieldKey);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [focusFromPreview]);

  const handleFieldChange = (sectionKey: SectionKey, field: string, value: unknown) => {
    setSelectedField({ sectionKey, fieldKey: field });
    setPageContent((prev) => {
      const section = ensureSection(sectionKey);
      const updatedLanguageContent: SectionContent = {
        ...(section[activeLanguage] || {}),
        [field]: value,
      };

      return {
        ...prev,
        [sectionKey]: {
          ...section,
          [activeLanguage]: updatedLanguageContent,
        },
      };
    });
  };

  const handleSave = async (sectionKey: SectionKey) => {
    const section = pageContent[sectionKey] || ensureSection(sectionKey);
    setSavingSection(sectionKey);

    try {
      const saved = await saveSection(sectionKey, section);
      setPageContent((prev) => ({
        ...prev,
        [sectionKey]: saved.translations,
      }));
      const pageKey = sectionTabMap[sectionKey];
      if (pageKey) {
        const metadata: PageContentMetadata =
          saved.metadata || ({
            lastEditedAt: new Date().toISOString(),
            lastEditedBy: session ? { email: session.email } : undefined,
          } as PageContentMetadata);
        setPageMetadata((prev) => {
          const current = prev[pageKey];
          const currentTime = current?.lastEditedAt ? new Date(current.lastEditedAt).getTime() : null;
          const incomingTime = metadata.lastEditedAt ? new Date(metadata.lastEditedAt).getTime() : null;

          if (currentTime && incomingTime && incomingTime <= currentTime) return prev;
          return {
            ...prev,
            [pageKey]: metadata,
          };
        });
      }
      toast.success("Változások mentve!");
    } catch (error) {
      console.error(error);
      toast.error("Hiba történt a mentés során");
    } finally {
      setSavingSection(null);
    }
  };

  const loadImageKitFiles = async (term?: string, path?: string) => {
    setImageBrowserLoading(true);
    try {
      const { items, folder, baseFolder } = await listImageKitFiles(term, path || imageBrowserPath || undefined);
      setImageBrowserItems(items);
      setImageBrowserPath(folder);
      setImageBrowserBasePath(baseFolder);
      if (!items.length) {
        toast.info("Nincs találat az ImageKitben");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült lekérni az ImageKit fájlokat";
      toast.error(message);
    } finally {
      setImageBrowserLoading(false);
    }
  };

  const openImageBrowser = (target: FieldTarget) => {
    setImageTarget(target);
    setImageBrowserOpen(true);
    void loadImageKitFiles();
  };

  const handlePickImage = (item: ImageKitItem) => {
    if (!imageTarget) return;
    const url = item.url || item.thumbnailUrl || "";
    if (!url) {
      toast.error("Ehhez az elemhez nem tartozik URL");
      return;
    }

    handleFieldChange(imageTarget.sectionKey, imageTarget.fieldKey, url);
    toast.success("Kép kiválasztva az ImageKitből");
    setImageBrowserOpen(false);
  };

  const handleOpenFolder = (item: ImageKitItem) => {
    if (!item.isFolder) return;
    void loadImageKitFiles(undefined, item.path);
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadTarget) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setImageUploading(true);
      const uploadedUrl = await uploadToImageKit(file, PAGE_CONTENT_FOLDER);
      handleFieldChange(uploadTarget.sectionKey, uploadTarget.fieldKey, uploadedUrl);
      toast.success("Kép feltöltve és hozzárendelve");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült feltölteni a képet";
      toast.error(message);
    } finally {
      setImageUploading(false);
      setUploadTarget(null);
    }
  };

  const formatEditorName = (meta?: PageContentMetadata) => {
    if (!meta?.lastEditedBy) return "Ismeretlen";
    if (typeof meta.lastEditedBy === "string") return meta.lastEditedBy;
    return meta.lastEditedBy.name || meta.lastEditedBy.email || meta.lastEditedBy.id || "Ismeretlen";
  };

  const formatEditedAt = (meta?: PageContentMetadata) => {
    if (!meta?.lastEditedAt) return "Még nincs mentve";
    const date = new Date(meta.lastEditedAt);
    if (Number.isNaN(date.getTime())) return "Ismeretlen dátum";
    return date.toLocaleString("hu-HU");
  };

  const handleSelectPage = (pageKey: keyof typeof sectionGroups) => {
    setSelectedPage(pageKey);
    setLivePreviewKey(Date.now().toString());
  };

  const handleBackToList = () => {
    setSelectedPage(null);
    setSelectedField(null);
  };

  const handleUploadClick = (target: FieldTarget) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const renderImageBrowserDialog = () => (
    <Dialog open={imageBrowserOpen} onOpenChange={(open) => setImageBrowserOpen(open)}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>ImageKit böngészése</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative max-w-md w-full">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Keresés az ImageKitben"
                value={imageBrowserSearch}
                onChange={(e) => setImageBrowserSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => loadImageKitFiles(imageBrowserSearch)} disabled={imageBrowserLoading} className="gap-2">
              {imageBrowserLoading && <Loader2 className="h-4 w-4 animate-spin" />} Keresés
            </Button>
            {imageBrowserPath && imageBrowserBasePath && imageBrowserPath !== imageBrowserBasePath && (
              <Button
                variant="ghost"
                onClick={() => loadImageKitFiles(undefined, imageBrowserBasePath || undefined)}
                disabled={imageBrowserLoading}
              >
                Vissza a gyökérhez
              </Button>
            )}
          </div>

          {imageBrowserLoading ? (
            <div className="py-10 text-center text-muted-foreground">Fájlok betöltése az ImageKitből...</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-2">
              {imageBrowserItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 space-y-3 hover:shadow-sm transition cursor-pointer"
                  onClick={() => (item.isFolder ? handleOpenFolder(item) : handlePickImage(item))}
                >
                  <div className="aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center">
                    {item.isFolder ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Mappa</span>
                      </div>
                    ) : item.thumbnailUrl || item.url ? (
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm">Nincs előnézet</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.path}</p>
                  </div>
                  {!item.isFolder && (
                    <Button className="w-full" variant="secondary" onClick={() => handlePickImage(item)}>
                      Kép kiválasztása
                    </Button>
                  )}
                </div>
              ))}

              {!imageBrowserItems.length && !imageBrowserLoading && (
                <div className="col-span-full py-6 text-center text-muted-foreground">Nincs megjeleníthető elem</div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setImageBrowserOpen(false)}>
            Bezárás
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderFieldInput = (sectionKey: SectionKey, fieldKey: string, value: unknown, type: string | undefined, description?: string) => {
    const commonFocus = () => setSelectedField({ sectionKey, fieldKey });

    if (type === "textarea") {
      return (
        <Textarea
          ref={registerFieldRef(sectionKey, fieldKey)}
          value={(value as string) || ""}
          onChange={(e) => handleFieldChange(sectionKey, fieldKey, e.target.value)}
          rows={4}
          onFocus={commonFocus}
        />
      );
    }

    if (type === "json") {
      const displayValue = typeof value === "string" ? value : JSON.stringify(value ?? "", null, 2);
      return (
        <Textarea
          ref={registerFieldRef(sectionKey, fieldKey)}
          className="font-mono text-sm"
          value={displayValue}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value || "null");
              handleFieldChange(sectionKey, fieldKey, parsed);
            } catch {
              handleFieldChange(sectionKey, fieldKey, e.target.value);
            }
          }}
          rows={5}
          onFocus={commonFocus}
        />
      );
    }

    if (type === "image") {
      const imageUrl = typeof value === "string" ? value : "";
      return (
        <div className="space-y-3">
          <Input
            ref={registerFieldRef(sectionKey, fieldKey)}
            value={imageUrl}
            onChange={(e) => handleFieldChange(sectionKey, fieldKey, e.target.value)}
            placeholder="ImageKit URL"
            onFocus={commonFocus}
          />
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="secondary" className="gap-2" onClick={() => openImageBrowser({ sectionKey, fieldKey })}>
              <Search className="h-4 w-4" /> Kiválasztás az ImageKitből
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={imageUploading && uploadTarget?.sectionKey === sectionKey && uploadTarget?.fieldKey === fieldKey}
              onClick={() => handleUploadClick({ sectionKey, fieldKey })}
            >
              {imageUploading && uploadTarget?.sectionKey === sectionKey && uploadTarget?.fieldKey === fieldKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Kép feltöltése
            </Button>
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {imageUrl && (
            <div className="rounded-md overflow-hidden border bg-muted/30">
              <img src={imageUrl} alt="Előnézet" className="w-full h-48 object-cover" />
            </div>
          )}
        </div>
      );
    }

    return (
      <Input
        ref={registerFieldRef(sectionKey, fieldKey)}
        value={(value as string) || ""}
        onChange={(e) => handleFieldChange(sectionKey, fieldKey, e.target.value)}
        onFocus={commonFocus}
      />
    );
  };

  const renderPageList = () => (
    <div className="space-y-4">
      <p className="text-muted-foreground">Válaszd ki, melyik publikus oldal tartalmát szeretnéd szerkeszteni.</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(Object.keys(sectionGroups) as Array<keyof typeof sectionGroups>).map((pageKey) => {
          const meta = pageMetadata[pageKey];
          return (
            <Card key={pageKey} className="p-4 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{liveTabPaths[pageKey]}</p>
                    <h3 className="text-lg font-semibold">{pageDefinitions[pageKey].title}</h3>
                    <p className="text-sm text-muted-foreground">{pageDefinitions[pageKey].description}</p>
                  </div>
                  <Button size="sm" variant="secondary" className="gap-2" onClick={() => handleSelectPage(pageKey)}>
                    <FileText className="h-4 w-4" />
                    Szerkesztés
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {formatEditedAt(meta)}
                </div>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" /> {formatEditorName(meta)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderSectionEditor = (sectionKey: SectionKey) => {
    const section = ensureSection(sectionKey);
    const content = section[activeLanguage] || {};
    const isSaving = savingSection === sectionKey;
    const definition = sectionDefinitions[sectionKey];
    const fields = definition?.fields || Object.keys(content).map((key) => ({ key, label: key, type: typeof content[key] === "string" ? "text" : "json" }));

    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className={cn("space-y-2", selectedField?.sectionKey === sectionKey && selectedField?.fieldKey === field.key && "ring-1 ring-primary rounded-md p-2")}
            >
              <Label>{field.label}</Label>
              {renderFieldInput(sectionKey, field.key, (content as Record<string, unknown>)[field.key], field.type, field.description)}
            </div>
          ))}
        </div>

        <Button onClick={() => handleSave(sectionKey)} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mentés...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Változások mentése
            </>
          )}
        </Button>
      </Card>
    );
  };


  const renderPreview = () => {
    if (!selectedPage) return null;
    const livePreviewUrl = `${liveTabPaths[selectedPage]}?adminPreview=1`;

    return (
      <Card className="p-4 lg:p-6 space-y-6 sticky top-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Publikus oldal</p>
                <p className="text-xs text-muted-foreground">A látogatók által látott verzió az aktuális fül alapján</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLivePreviewKey(Date.now().toString())}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Újratöltés
              </Button>
              <Button asChild size="sm" variant="secondary" className="gap-2">
                <a href={livePreviewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Megnyitás
                </a>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border overflow-hidden bg-muted/20">
            <iframe
              key={`${selectedPage}-${livePreviewKey}`}
              src={livePreviewUrl}
              title="Publikus oldal előnézete"
              className="w-full h-[520px] bg-background"
            />
          </div>
        </div>
      </Card>
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Oldal Tartalmak
            </h1>
            <p className="text-muted-foreground">Válaszd ki a publikus oldalt, nézd meg ki és mikor módosította, majd szerkeszd tartalmát élő előnézet mellett.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Tabs value={activeLanguage} onValueChange={(val) => setActiveLanguage(val as LanguageCode)}>
            <TabsList>
              <TabsTrigger value="hu">Magyar</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {!selectedPage ? (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Válassz szerkesztendő oldalt</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A publikus oldalhoz tartozó utolsó módosítás és szerkesztő is megjelenik itt.
                </p>
              </div>
              <div className="p-6">{renderPageList()}</div>
            </div>
          </div>
        ) : (
          <div className="grid xl:grid-cols-[1.1fr,0.9fr] gap-6 items-start">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <Button variant="ghost" className="gap-2" onClick={handleBackToList}>
                  <ChevronLeft className="h-4 w-4" /> Vissza a listához
                </Button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {formatEditedAt(pageMetadata[selectedPage])}
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /> {formatEditorName(pageMetadata[selectedPage])}
                  </div>
                </div>
              </div>

              <Card className="p-4 bg-muted/40 border-dashed">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Publikus útvonal</p>
                    <p className="font-semibold text-lg">{liveTabPaths[selectedPage]}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pageDefinitions[selectedPage].description}</p>
                  </div>
                  <Button size="sm" variant="secondary" className="gap-2" onClick={() => setLivePreviewKey(Date.now().toString())}>
                    <RefreshCw className="h-4 w-4" /> Oldal frissítése
                  </Button>
                </div>
              </Card>

              <div className="space-y-6">
                {sectionGroups[selectedPage].map((section) => (
                  <div key={section.key} className="space-y-3">
                    <h3 className="text-lg font-semibold">{section.label}</h3>
                    {renderSectionEditor(section.key)}
                  </div>
                ))}
              </div>
            </div>

            {renderPreview()}
          </div>
        )}
      </div>

      {renderImageBrowserDialog()}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </AdminLayout>
  );
}
