import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Save, Loader2, Languages } from "lucide-react";
import { toast } from "sonner";
import { getAllSections, getSectionContent, saveSection } from "@/services/pageContentService";
import type { LanguageCode } from "@/types/language";
import type { LocalizedSectionContent, SectionContent } from "@/types/pageContent";

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
    { key: "about_intro", label: "Bevezető" },
    { key: "mission", label: "Küldetés" },
    { key: "vision", label: "Jövőkép" },
    { key: "team", label: "Csapat" },
  ],
  galeria: [
    { key: "gallery_intro", label: "Bevezető Szekció" },
    { key: "gallery_images", label: "Galéria Képek" },
  ],
} as const;

type SectionKey = string;

export default function AdminPages() {
  const [pageContent, setPageContent] = useState<Record<SectionKey, LocalizedSectionContent>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<keyof typeof sectionGroups>("fooldal");
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>("hu");
  const [savingSection, setSavingSection] = useState<string | null>(null);

  useEffect(() => {
    const sections = getAllSections();
    setPageContent(sections);
    setLoading(false);
  }, []);

  const ensureSection = (sectionKey: SectionKey): LocalizedSectionContent => {
    const existing = pageContent[sectionKey];
    if (existing) return existing;

    const fallback = getSectionContent(sectionKey);
    return fallback;
  };

  const handleFieldChange = (sectionKey: SectionKey, field: string, value: any) => {
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
      saveSection(sectionKey, section);
      toast.success("Változások mentve!");
    } catch (error) {
      console.error(error);
      toast.error("Hiba történt a mentés során");
    } finally {
      setSavingSection(null);
    }
  };

  const renderSectionEditor = (sectionKey: SectionKey) => {
    const section = pageContent[sectionKey] || ensureSection(sectionKey);
    const content = section[activeLanguage] || {};
    const isSaving = savingSection === sectionKey;

    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          {Object.keys(content).length > 0 ? (
            Object.entries(content).map(([key, value]) => {
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="space-y-2">
                    <Label>{key}</Label>
                    <Textarea
                      value={JSON.stringify(value, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleFieldChange(sectionKey, key, parsed);
                        } catch {
                          // ignore invalid JSON
                        }
                      }}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                );
              }

              if (typeof value === "string") {
                const isLongText = value.length > 120;
                const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");

                return (
                  <div key={key} className="space-y-2">
                    <Label>{fieldLabel}</Label>
                    {isLongText ? (
                      <Textarea
                        value={value}
                        onChange={(e) => handleFieldChange(sectionKey, key, e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => handleFieldChange(sectionKey, key, e.target.value)}
                      />
                    )}
                  </div>
                );
              }

              return null;
            })
          ) : (
            <div className="space-y-2">
              <Label>Cím</Label>
              <Input
                value={content.title || ""}
                onChange={(e) => handleFieldChange(sectionKey, "title", e.target.value)}
                placeholder="Add meg a szekció címét"
              />
              <Label>Alcím</Label>
              <Input
                value={content.subtitle || ""}
                onChange={(e) => handleFieldChange(sectionKey, "subtitle", e.target.value)}
                placeholder="Add meg az alcímet"
              />
              <Label>Leírás</Label>
              <Textarea
                value={content.description || ""}
                onChange={(e) => handleFieldChange(sectionKey, "description", e.target.value)}
                rows={4}
                placeholder="Add meg a leírást"
              />
            </div>
          )}
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
            <p className="text-muted-foreground">Szerkeszd az oldal szöveges tartalmait magyarul és angolul.</p>
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
    </AdminLayout>
  );
}
