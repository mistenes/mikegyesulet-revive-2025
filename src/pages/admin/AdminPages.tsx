import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Save, Loader2, Languages, Eye, Search, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { getAllSections, saveSection } from "@/services/pageContentService";
import type { LanguageCode } from "@/types/language";
import type { LocalizedSectionContent, SectionContent } from "@/types/pageContent";
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<keyof typeof sectionGroups>("fooldal");
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
    if (!session) return;

    let active = true;

    const loadSections = async () => {
      try {
        const sections = await getAllSections();
        if (!active) return;
        setPageContent(sections);
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
  }, [session]);

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

  const ensureSection = (sectionKey: SectionKey): LocalizedSectionContent => {
    const existing = pageContent[sectionKey];
    if (existing) return existing;

    return defaultPageContent[sectionKey] || { hu: {}, en: {} };
  };

  const getContentForLanguage = (sectionKey: SectionKey) => {
    const section = ensureSection(sectionKey);
    return (section[activeLanguage] || section.hu || {}) as SectionContent;
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

  const focusFromPreview = (sectionKey: SectionKey, fieldKey: string) => {
    const targetTab = sectionTabMap[sectionKey];
    if (targetTab) setActiveTab(targetTab);
    setSelectedField({ sectionKey, fieldKey });
    setTimeout(() => scrollToField(sectionKey, fieldKey), 50);
  };

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
        [sectionKey]: saved,
      }));
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

  const previewContent = {
    hero: getContentForLanguage("hero_content") as SectionContent,
    heroStats: getContentForLanguage("hero_stats") as SectionContent,
    about: getContentForLanguage("about_section") as SectionContent,
    news: getContentForLanguage("news_section") as SectionContent,
    regions: getContentForLanguage("regions_section") as SectionContent,
    regionsIntro: getContentForLanguage("regions_intro") as SectionContent,
    galleryIntro: getContentForLanguage("gallery_intro") as SectionContent,
  };

  const PreviewEditable = ({ sectionKey, fieldKey, children }: { sectionKey: SectionKey; fieldKey: string; children: React.ReactNode }) => (
    <div
      className={cn(
        "relative group cursor-pointer",
        selectedField?.sectionKey === sectionKey && selectedField?.fieldKey === fieldKey
          ? "ring-2 ring-primary rounded-lg"
          : "hover:ring-1 hover:ring-primary/50 rounded-lg",
      )}
      onClick={() => focusFromPreview(sectionKey, fieldKey)}
    >
      {children}
      <div className="absolute right-2 top-2 text-[10px] uppercase tracking-wide text-primary bg-background/80 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition">
        Kattints a szerkesztéshez
      </div>
    </div>
  );

  const renderPreview = () => {
    const heroStats = Array.isArray((previewContent.heroStats as { stats?: Array<{ value: string; label: string }> }).stats)
      ? ((previewContent.heroStats as { stats?: Array<{ value: string; label: string }> }).stats as Array<{ value: string; label: string }>)
      : [];
    const regionsChips = Array.isArray((previewContent.regions as { chips?: string[] }).chips)
      ? ((previewContent.regions as { chips?: string[] }).chips as string[])
      : [];

    return (
      <Card className="p-4 lg:p-6 space-y-6 sticky top-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Élő előnézet</p>
              <p className="text-xs text-muted-foreground">Kattints az elemekre a gyors szerkesztéshez</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Nyelv: {activeLanguage === "hu" ? "Magyar" : "English"}</div>
        </div>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border">
          <div className="grid md:grid-cols-2 gap-6 p-6 items-center">
            <div className="space-y-4">
              <PreviewEditable sectionKey="hero_content" fieldKey="title">
                <h2 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {(previewContent.hero as Record<string, unknown>).title as string}
                </h2>
              </PreviewEditable>
              <PreviewEditable sectionKey="hero_content" fieldKey="description">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {(previewContent.hero as Record<string, unknown>).description as string}
                </p>
              </PreviewEditable>
              <div className="flex flex-wrap gap-3">
                <PreviewEditable sectionKey="hero_content" fieldKey="primaryButtonText">
                  <Button size="sm" className="gap-2">
                    {(previewContent.hero as Record<string, unknown>).primaryButtonText as string}
                  </Button>
                </PreviewEditable>
                <PreviewEditable sectionKey="hero_content" fieldKey="secondaryButtonText">
                  <Button size="sm" variant="outline">
                    {(previewContent.hero as Record<string, unknown>).secondaryButtonText as string}
                  </Button>
                </PreviewEditable>
              </div>
            </div>
            <PreviewEditable sectionKey="hero_content" fieldKey="imageUrl">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={((previewContent.hero as Record<string, unknown>).imageUrl as string) || (defaultPageContent.hero_content[activeLanguage]?.imageUrl as string) || (defaultPageContent.hero_content.hu?.imageUrl as string)}
                  alt="Hero"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
              </div>
            </PreviewEditable>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t px-6 py-4 bg-background/60">
            {heroStats.map((stat, index) => (
              <PreviewEditable key={index} sectionKey="hero_stats" fieldKey="stats">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </PreviewEditable>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="grid lg:grid-cols-2 gap-4 items-center">
          <div className="space-y-3">
            <PreviewEditable sectionKey="about_section" fieldKey="badge">
              <p className="text-xs uppercase tracking-widest text-primary font-semibold">
                {(previewContent.about as Record<string, unknown>).badge as string}
              </p>
            </PreviewEditable>
            <PreviewEditable sectionKey="about_section" fieldKey="title">
              <h3 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                {(previewContent.about as Record<string, unknown>).title as string}
              </h3>
            </PreviewEditable>
            <PreviewEditable sectionKey="about_section" fieldKey="description">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {(previewContent.about as Record<string, unknown>).description as string}
              </p>
            </PreviewEditable>
            <PreviewEditable sectionKey="about_section" fieldKey="buttonText">
              <Button variant="outline" size="sm">
                {(previewContent.about as Record<string, unknown>).buttonText as string}
              </Button>
            </PreviewEditable>
          </div>
          <PreviewEditable sectionKey="about_section" fieldKey="imageUrl">
            <div className="rounded-xl overflow-hidden border">
              <img
                src={((previewContent.about as Record<string, unknown>).imageUrl as string) || (defaultPageContent.about_section[activeLanguage]?.imageUrl as string) || (defaultPageContent.about_section.hu?.imageUrl as string)}
                alt="About"
                className="w-full h-64 object-cover"
              />
            </div>
          </PreviewEditable>
        </div>

        {/* News */}
        <div className="rounded-2xl border p-4 space-y-3 bg-muted/30">
          <PreviewEditable sectionKey="news_section" fieldKey="subtitle">
            <p className="text-xs uppercase tracking-wide text-primary font-semibold">
              {(previewContent.news as Record<string, unknown>).subtitle as string}
            </p>
          </PreviewEditable>
          <PreviewEditable sectionKey="news_section" fieldKey="title">
            <h3 className="text-xl font-semibold">{(previewContent.news as Record<string, unknown>).title as string}</h3>
          </PreviewEditable>
          <PreviewEditable sectionKey="news_section" fieldKey="description">
            <p className="text-sm text-muted-foreground">{(previewContent.news as Record<string, unknown>).description as string}</p>
          </PreviewEditable>
          <PreviewEditable sectionKey="news_section" fieldKey="buttonText">
            <Button size="sm" variant="secondary">
              {(previewContent.news as Record<string, unknown>).buttonText as string}
            </Button>
          </PreviewEditable>
        </div>

        {/* Regions */}
        <div className="rounded-2xl border p-4 space-y-3">
          <PreviewEditable sectionKey="regions_section" fieldKey="eyebrow">
            <p className="text-xs uppercase tracking-wide text-primary font-semibold">
              {(previewContent.regions as Record<string, unknown>).eyebrow as string}
            </p>
          </PreviewEditable>
          <PreviewEditable sectionKey="regions_section" fieldKey="title">
            <h3 className="text-xl font-semibold">{(previewContent.regions as Record<string, unknown>).title as string}</h3>
          </PreviewEditable>
          <PreviewEditable sectionKey="regions_section" fieldKey="description">
            <p className="text-sm text-muted-foreground">{(previewContent.regions as Record<string, unknown>).description as string}</p>
          </PreviewEditable>
          <div className="flex flex-wrap gap-2">
            {regionsChips.map((chip, index) => (
              <PreviewEditable key={index} sectionKey="regions_section" fieldKey="chips">
                <span className="px-3 py-1 rounded-full bg-muted text-xs">{chip}</span>
              </PreviewEditable>
            ))}
          </div>
          <PreviewEditable sectionKey="regions_section" fieldKey="buttonText">
            <Button size="sm" variant="outline">
              {(previewContent.regions as Record<string, unknown>).buttonText as string}
            </Button>
          </PreviewEditable>
        </div>

        {/* Regions intro & Gallery */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" /> Régiók oldal
            </div>
            <PreviewEditable sectionKey="regions_intro" fieldKey="title">
              <h4 className="text-lg font-semibold">{(previewContent.regionsIntro as Record<string, unknown>).title as string}</h4>
            </PreviewEditable>
            <PreviewEditable sectionKey="regions_intro" fieldKey="description">
              <p className="text-sm text-muted-foreground">
                {(previewContent.regionsIntro as Record<string, unknown>).description as string}
              </p>
            </PreviewEditable>
          </div>
          <div className="rounded-2xl border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" /> Galéria oldal
            </div>
            <PreviewEditable sectionKey="gallery_intro" fieldKey="title">
              <h4 className="text-lg font-semibold">{(previewContent.galleryIntro as Record<string, unknown>).title as string}</h4>
            </PreviewEditable>
            <PreviewEditable sectionKey="gallery_intro" fieldKey="description">
              <p className="text-sm text-muted-foreground">
                {(previewContent.galleryIntro as Record<string, unknown>).description as string}
              </p>
            </PreviewEditable>
          </div>
        </div>
      </Card>
    );
  };

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
            <p className="text-muted-foreground">Kétpaneles szerkesztő élő előnézettel és kattintható elemekkel.</p>
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

        <div className="grid xl:grid-cols-[1.1fr,0.9fr] gap-6 items-start">
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as keyof typeof sectionGroups)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="fooldal">Főoldal</TabsTrigger>
                <TabsTrigger value="regiok">Régiók</TabsTrigger>
                <TabsTrigger value="rolunk">Rólunk</TabsTrigger>
                <TabsTrigger value="galeria">Galéria</TabsTrigger>
              </TabsList>

              {(Object.keys(sectionGroups) as Array<keyof typeof sectionGroups>).map((tabKey) => (
                <TabsContent key={tabKey} value={tabKey} className="space-y-6 mt-6">
                  {sectionGroups[tabKey].map((section) => (
                    <div key={section.key} className="space-y-3">
                      <h3 className="text-lg font-semibold">{section.label}</h3>
                      {renderSectionEditor(section.key)}
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {renderPreview()}
        </div>
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
