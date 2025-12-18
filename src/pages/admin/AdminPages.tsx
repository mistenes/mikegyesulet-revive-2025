import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Languages,
  Layout,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
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
    { key: "hero_stats", label: "Statisztikák" },
    { key: "impact_section", label: "Hatás Szekció" },
    { key: "news_section", label: "Hírek Szekció" },
    { key: "regions_section", label: "Régiók Szekció" },
    { key: "map_section", label: "Térkép Szekció" },
    { key: "about_section", label: "Rólunk Röviden" },
    { key: "testimonials_section", label: "Visszajelzések" },
    { key: "closing_section", label: "Zárónyilatkozatok" },
    { key: "contact_section", label: "Kapcsolat" },
  ],
  regiok: [
    { key: "regions_intro", label: "Bevezető Szekció" },
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
    description: "Hero, hatás, rólunk, statisztikák, hírek, régiók, visszajelzések és kapcsolat szekciók szerkesztése",
  },
  regiok: {
    title: "Régiók",
    description: "Régiós bevezető tartalmak kezelése",
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
      type?: "text" | "textarea" | "json" | "image" | "imageList";
      placeholder?: string;
      description?: string;
    }>;
  }
> = {
  impact_section: {
    fields: [
      { key: "badge", label: "Badge" },
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
      {
        key: "stats",
        label: "Statisztikák",
        type: "json",
        description: "JSON tömb, pl. [{ value: '1000+', label: 'Tag', description: 'Rövid leírás' }]",
      },
    ],
  },
  hero_content: {
    fields: [
      { key: "title", label: "Cím", type: "textarea" },
      { key: "description", label: "Leírás", type: "textarea", placeholder: "Vázold fel a hős szekció szövegét" },
      { key: "primaryButtonText", label: "Elsődleges gomb szövege" },
      { key: "primaryButtonUrl", label: "Elsődleges gomb link" },
      { key: "secondaryButtonText", label: "Másodlagos gomb szövege" },
      { key: "secondaryButtonUrl", label: "Másodlagos gomb link" },
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
      { key: "buttonUrl", label: "Gomb link" },
    ],
  },
  regions_section: {
    fields: [
      { key: "eyebrow", label: "Felső címke" },
      { key: "title", label: "Cím", type: "textarea" },
      { key: "description", label: "Leírás", type: "textarea" },
      { key: "buttonText", label: "Gomb szöveg" },
      { key: "buttonUrl", label: "Gomb link" },
      {
        key: "chips",
        label: "Kiemelt régiók",
        type: "json",
        description: "JSON tömb régió nevekkel",
      },
      {
        key: "scrollImages",
        label: "Mozgó képek a régióknál",
        type: "imageList",
        description: "Válaszd ki vagy töltsd fel a gördülő képeket a régiós szekcióhoz",
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
      { key: "buttonUrl", label: "Gomb link" },
      { key: "ctaBadge", label: "CTA badge" },
      { key: "ctaTitle", label: "CTA cím" },
      { key: "ctaDescription", label: "CTA leírás", type: "textarea" },
      { key: "ctaButton", label: "CTA gomb szöveg" },
      { key: "ctaButtonUrl", label: "CTA gomb link" },
      { key: "imageUrl", label: "Kép", type: "image", description: "Rólunk kép kiválasztása" },
    ],
  },
  map_section: {
    fields: [
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
    ],
  },
  regions_intro: {
    fields: [
      { key: "eyebrow", label: "Felső címke" },
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
  testimonials_section: {
    fields: [
      { key: "badge", label: "Badge" },
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
      {
        key: "testimonials",
        label: "Visszajelzések",
        type: "json",
        description:
          "JSON tömb, pl. [{ quote: 'idézet', author: 'Név', role: 'Szerep', region: 'Régió', image: 'https://...' }]",
      },
    ],
  },
  closing_section: {
    fields: [
      { key: "badge", label: "Badge" },
      { key: "title", label: "Cím", type: "textarea" },
      { key: "description", label: "Leírás", type: "textarea" },
      { key: "buttonText", label: "Gomb szöveg" },
      { key: "buttonUrl", label: "Gomb link" },
      { key: "imageUrl", label: "Kép", type: "image" },
    ],
  },
  contact_section: {
    fields: [
      { key: "badge", label: "Badge" },
      { key: "title", label: "Cím" },
      { key: "description", label: "Leírás", type: "textarea" },
      {
        key: "offices",
        label: "Irodák",
        type: "json",
        description: "JSON tömb, pl. [{ name: 'Iroda', address: 'Cím', hours: ['H-Cs: 8:30-16:00'] }]",
      },
    ],
  },
};

type SectionKey = string;
type SectionVisibility = { isVisible?: boolean };

type FieldTarget = {
  sectionKey: SectionKey;
  fieldKey: string;
  itemIndex?: number;
};

export default function AdminPages() {
  const { isLoading, session } = useAdminAuthGuard();
  const navigate = useNavigate();
  const { pageSlug } = useParams<{ pageSlug?: string }>();
  const [pageContent, setPageContent] = useState<Record<SectionKey, LocalizedSectionContent>>({});
  const [pageMetadata, setPageMetadata] = useState<Partial<Record<keyof typeof sectionGroups, PageContentMetadata>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<keyof typeof sectionGroups | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>("hu");
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldTarget | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const pageKeys = useMemo(() => Object.keys(sectionGroups) as Array<keyof typeof sectionGroups>, []);

  const sectionTabMap = useMemo(() => {
    const map: Record<string, keyof typeof sectionGroups> = {};
    (Object.keys(sectionGroups) as Array<keyof typeof sectionGroups>).forEach((tab) => {
      sectionGroups[tab].forEach((item) => {
        map[item.key] = tab;
      });
    });
    return map;
  }, []);

  useEffect(() => {
    if (!pageSlug) {
      setSelectedPage(null);
      setSelectedField(null);
      return;
    }

    if (pageKeys.includes(pageSlug as keyof typeof sectionGroups)) {
      setSelectedPage(pageSlug as keyof typeof sectionGroups);
      setLivePreviewKey(Date.now().toString());
      setSelectedField(null);
      return;
    }

    navigate("/admin/pages", { replace: true });
  }, [navigate, pageKeys, pageSlug]);

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

  const registerSectionRef = (sectionKey: SectionKey) => (el: HTMLDivElement | null) => {
    sectionRefs.current[sectionKey] = el;
  };

  const scrollToField = (sectionKey: SectionKey, fieldKey: string) => {
    const ref = fieldRefs.current[`${sectionKey}.${fieldKey}`];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.focus();
    }
  };

  const scrollToSection = (sectionKey: SectionKey) => {
    const ref = sectionRefs.current[sectionKey];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFieldSelect = (sectionKey: SectionKey, fieldKey: string) => {
    setSelectedField({ sectionKey, fieldKey });
    scrollToSection(sectionKey);
    setTimeout(() => scrollToField(sectionKey, fieldKey), 100);
  };

  const focusFromPreview = useCallback(
    (sectionKey: SectionKey, fieldKey: string) => {
      const targetTab = sectionTabMap[sectionKey];
      if (targetTab) {
        navigate(`/admin/pages/${targetTab}`);
      }
      setSelectedField({ sectionKey, fieldKey });
      setTimeout(() => {
        scrollToSection(sectionKey);
        scrollToField(sectionKey, fieldKey);
      }, 50);
    },
    [navigate, sectionTabMap],
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

  const applyImageValue = (target: FieldTarget, imageUrl: string) => {
    const { sectionKey, fieldKey, itemIndex } = target;
    if (typeof itemIndex !== "number") {
      handleFieldChange(sectionKey, fieldKey, imageUrl);
      return;
    }

    const section = ensureSection(sectionKey);
    const currentLanguageContent = (section[activeLanguage] || {}) as SectionContent;
    const currentImages = Array.isArray(currentLanguageContent[fieldKey])
      ? [...(currentLanguageContent[fieldKey] as Array<{ imageUrl?: string; alt?: string }>)]
      : [];

    currentImages[itemIndex] = { ...(currentImages[itemIndex] || {}), imageUrl };
    handleFieldChange(sectionKey, fieldKey, currentImages);
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

    applyImageValue(imageTarget, url);
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
      applyImageValue(uploadTarget, uploadedUrl);
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
    navigate(`/admin/pages/${pageKey}`);
  };

  const handleBackToList = () => {
    setSelectedField(null);
    navigate("/admin/pages");
  };

  const handleUploadClick = (target: FieldTarget) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleVisibilityToggle = async (sectionKey: string, isVisible: boolean) => {
    const section = ensureSection(sectionKey);
    const updatedSection = { ...section, isVisible };

    // Update local state first for responsiveness
    setPageContent(prev => ({
      ...prev,
      [sectionKey]: updatedSection
    }));

    try {
      setSavingSection(sectionKey);
      await saveSection(sectionKey, updatedSection);
      toast.success(isVisible ? "Szekció bekapcsolva" : "Szekció kikapcsolva");
    } catch (e) {
      console.error(e);
      toast.error("Hiba a mentés során");
      // Revert on error
      setPageContent(prev => ({
        ...prev,
        [sectionKey]: section
      }));
    } finally {
      setSavingSection(null);
    }
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

    if (type === "imageList") {
      const images = Array.isArray(value)
        ? (value as Array<{ imageUrl?: string; alt?: string }>)
        : [];

      const updateImages = (updater: (current: Array<{ imageUrl?: string; alt?: string }>) => Array<{ imageUrl?: string; alt?: string }>) => {
        const nextValue = updater(images);
        handleFieldChange(sectionKey, fieldKey, nextValue);
      };

      return (
        <div className="space-y-3">
          <input
            ref={registerFieldRef(sectionKey, fieldKey)}
            value=""
            readOnly
            className="sr-only"
            aria-hidden
          />

          <div className="grid gap-3">
            {images.map((image, index) => {
              const imageUrl = image?.imageUrl || "";
              const isUploadingTarget =
                imageUploading &&
                uploadTarget?.sectionKey === sectionKey &&
                uploadTarget?.fieldKey === fieldKey &&
                uploadTarget?.itemIndex === index;

              return (
                <div key={index} className="border rounded-lg bg-muted/30 p-3 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <div
                      className={cn(
                        "w-full sm:w-1/2 rounded-lg border border-dashed bg-background/60 overflow-hidden cursor-pointer transition hover:border-primary/60",
                        imageUrl ? "p-0" : "p-6 flex items-center justify-center",
                      )}
                      onClick={() => {
                        commonFocus();
                        openImageBrowser({ sectionKey, fieldKey, itemIndex: index });
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={image?.alt || "Kép"} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="text-center space-y-2 text-muted-foreground">
                          <ImageIcon className="h-6 w-6 mx-auto" />
                          <p className="text-sm">Kattints egy kép kiválasztásához vagy feltöltéséhez</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-1/2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => {
                          commonFocus();
                          openImageBrowser({ sectionKey, fieldKey, itemIndex: index });
                        }}
                      >
                        <Search className="h-4 w-4" /> Kép kiválasztása
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={isUploadingTarget}
                        onClick={() => {
                          commonFocus();
                          handleUploadClick({ sectionKey, fieldKey, itemIndex: index });
                        }}
                      >
                        {isUploadingTarget ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Kép feltöltése
                      </Button>
                      {imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="gap-2"
                          onClick={() =>
                            updateImages((current) => {
                              const next = [...current];
                              next[index] = { ...next[index], imageUrl: "" };
                              return next;
                            })
                          }
                        >
                          <ChevronLeft className="h-4 w-4" /> Kép törlése
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => updateImages((current) => current.filter((_, i) => i !== index))}
                      >
                        <ChevronLeft className="h-4 w-4" /> Diakép eltávolítása
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`${sectionKey}.${fieldKey}.alt-${index}`}>Alternatív szöveg</Label>
                    <Input
                      id={`${sectionKey}.${fieldKey}.alt-${index}`}
                      placeholder="Pl. Régiók kép"
                      value={image?.alt || ""}
                      onChange={(e) =>
                        updateImages((current) => {
                          const next = [...current];
                          next[index] = { ...next[index], alt: e.target.value };
                          return next;
                        })
                      }
                      onFocus={commonFocus}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              updateImages((current) => [...current, { imageUrl: "", alt: "" }])
            }
          >
            <Upload className="h-4 w-4" /> Új diakép hozzáadása
          </Button>

          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      );
    }

    if (type === "image") {
      const imageUrl = typeof value === "string" ? value : "";
      const isUploadingTarget = imageUploading && uploadTarget?.sectionKey === sectionKey && uploadTarget?.fieldKey === fieldKey;
      return (
        <div className="space-y-3">
          <input
            ref={registerFieldRef(sectionKey, fieldKey)}
            value={imageUrl}
            readOnly
            className="sr-only"
            aria-hidden
          />
          <div
            className={cn(
              "rounded-lg border border-dashed bg-muted/30 overflow-hidden cursor-pointer transition hover:border-primary/60",
              imageUrl ? "p-0" : "p-6 flex items-center justify-center",
            )}
            onClick={() => {
              commonFocus();
              openImageBrowser({ sectionKey, fieldKey });
            }}
            role="button"
            tabIndex={0}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Előnézet" className="w-full h-48 object-cover" />
            ) : (
              <div className="text-center space-y-2 text-muted-foreground">
                <ImageIcon className="h-6 w-6 mx-auto" />
                <p className="text-sm">Kattints egy kép kiválasztásához vagy feltöltéséhez</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="secondary" className="gap-2" onClick={() => openImageBrowser({ sectionKey, fieldKey })}>
              <Search className="h-4 w-4" /> Vizuális választó megnyitása
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isUploadingTarget}
              onClick={() => handleUploadClick({ sectionKey, fieldKey })}
            >
              {isUploadingTarget ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Kép feltöltése
            </Button>
            {imageUrl && (
              <Button type="button" variant="ghost" className="gap-2" onClick={() => handleFieldChange(sectionKey, fieldKey, "")}>
                <ChevronLeft className="h-4 w-4" /> Kép törlése
              </Button>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {imageUrl && <p className="text-xs text-muted-foreground break-all">{imageUrl}</p>}
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

  const renderSectionEditor = (sectionKey: SectionKey, options?: { wrapInCard?: boolean; isActive?: boolean }) => {
    const { wrapInCard = true, isActive = false } = options || {};
    const section = ensureSection(sectionKey);
    const content = (section[activeLanguage] || {}) as SectionContent & SectionVisibility;
    const isSaving = savingSection === sectionKey;
    const definition = sectionDefinitions[sectionKey];
    const fields = definition?.fields || Object.keys(content).map((key) => ({ key, label: key, type: typeof content[key] === "string" ? "text" : "json" }));

    const editorContent = (
      <div className="space-y-6">
        <div className="space-y-4">
          {fields.map((field) => (
            <div
              key={field.key}
              className={cn(
                "space-y-2 rounded-md transition-all",
                selectedField?.sectionKey === sectionKey && selectedField?.fieldKey === field.key
                  ? "ring-2 ring-primary/70 bg-primary/5 p-2"
                  : "hover:bg-muted/40 p-2",
              )}
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
      </div>
    );

    if (!wrapInCard) return editorContent;

    return (
      <Card
        className={cn(
          "p-6 space-y-6 transition-all border-dashed bg-card/70",
          isActive ? "ring-2 ring-primary border-primary shadow-lg" : "hover:border-primary/40",
        )}
      >
        <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              {definition?.label || sectionKey}
            </h3>
            <p className="text-sm text-muted-foreground">
              {definition?.description}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full border border-border/50">
            <Switch
              checked={content.isVisible !== false}
              onCheckedChange={(checked) => handleVisibilityToggle(sectionKey, checked)}
            />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {content.isVisible !== false ? "Látható" : "Rejtett"}
            </span>
          </div>
        </div>
        {editorContent}
      </Card>
    );
  };

  const renderBlockNavigator = () => {
    if (!selectedPage) return null;

    return (
      <Card className="p-4 bg-muted/50 border-dashed">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Blokk navigáció</p>
            <h3 className="font-semibold">Szekciók gyors elérése</h3>
            <p className="text-sm text-muted-foreground">Kattints egy blokkra a bal oldali szerkesztő fókuszálásához.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-4">
          {sectionGroups[selectedPage].map((section, index) => {
            const isActive = selectedField?.sectionKey === section.key;
            const firstField = sectionDefinitions[section.key]?.fields?.[0]?.key;
            const pageSection = pageContent[section.key] as (SectionContent & SectionVisibility) | undefined;
            const isSectionVisible = pageSection?.isVisible !== false;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => {
                  if (firstField) handleFieldSelect(section.key, firstField);
                }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/20"
                    : "bg-background border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex-1 text-left">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Blokk</p>
                  <p className="font-medium leading-tight">{section.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={isSectionVisible}
                      onCheckedChange={(checked) => handleVisibilityToggle(section.key, checked)}
                      className="scale-75"
                    />
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card >
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
                {renderBlockNavigator()}
                {sectionGroups[selectedPage].map((section, index) => {
                  const isActive = selectedField?.sectionKey === section.key;
                  return (
                    <div
                      key={section.key}
                      ref={registerSectionRef(section.key)}
                      className={cn(
                        "rounded-2xl border bg-card/70 shadow-sm transition-all overflow-hidden",
                        isActive ? "ring-2 ring-primary border-primary shadow-lg" : "hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/40">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Blokk</p>
                            <h3 className="text-lg font-semibold">{section.label}</h3>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">Kattints az élő előnézetre a blokk kiemeléséhez</div>
                      </div>
                      <div className="p-4 md:p-6">
                        {renderSectionEditor(section.key, { wrapInCard: false, isActive })}
                      </div>
                    </div>
                  );
                })}
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
