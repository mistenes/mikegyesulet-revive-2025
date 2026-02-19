import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { getSectionContent, saveSection } from "@/services/pageContentService";
import { defaultPageContent } from "@/data/defaultPageContent";
import type { LocalizedSectionContent } from "@/types/pageContent";

type Language = "hu" | "en";

const defaultMapSection = defaultPageContent.map_section as LocalizedSectionContent;

export default function AdminMapEditor() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>("hu");
  const [section, setSection] = useState<LocalizedSectionContent>(defaultMapSection);
  const [pointsInput, setPointsInput] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getSectionContent("map_section");
        const merged = {
          hu: { ...(defaultMapSection.hu || {}), ...(data.hu || {}) },
          en: { ...(defaultMapSection.en || {}), ...(data.en || {}) },
          isVisible: data.isVisible ?? true,
        };
        setSection(merged);
        const initialPoints = ((merged["hu"] as Record<string, unknown>)?.points || []);
        setPointsInput(JSON.stringify(initialPoints, null, 2));
      } catch (error) {
        console.error(error);
        toast.error("Nem sikerült betölteni a térkép tartalmát");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      load();
    }
  }, [session]);

  const languageContent = useMemo(() => {
    return (section[activeLanguage] || {}) as Record<string, unknown>;
  }, [activeLanguage, section]);


  useEffect(() => {
    const points = (languageContent.points as unknown[]) || [];
    setPointsInput(JSON.stringify(Array.isArray(points) ? points : [], null, 2));
  }, [languageContent.points]);

  const updateLanguageField = (key: string, value: unknown) => {
    setSection((prev) => ({
      ...prev,
      [activeLanguage]: {
        ...((prev[activeLanguage] || {}) as Record<string, unknown>),
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedPoints: unknown[] = [];
      try {
        const parsed = JSON.parse(pointsInput);
        if (!Array.isArray(parsed)) {
          toast.error("A térképpontok mezőnek JSON tömbnek kell lennie.");
          setSaving(false);
          return;
        }
        parsedPoints = parsed;
      } catch {
        toast.error("Érvénytelen JSON formátum a térképpontoknál.");
        setSaving(false);
        return;
      }

      const payload: LocalizedSectionContent = {
        ...section,
        [activeLanguage]: {
          ...((section[activeLanguage] || {}) as Record<string, unknown>),
          points: parsedPoints,
        },
      };

      setSection(payload);
      await saveSection("map_section", payload);
      toast.success("Térkép tartalom mentve");
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Nem sikerült menteni a térképet");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!session) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
              <MapPin className="h-7 w-7 text-primary" /> Térkép szerkesztő
            </h1>
            <p className="text-muted-foreground">Szerkeszd a főoldali térkép pontjait (szervezet, szín, koordináták) külön oldalon.</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/pages/fooldal">
              <ArrowLeft className="h-4 w-4" /> Vissza az oldal tartalmakhoz
            </Link>
          </Button>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Szekció láthatósága</Label>
              <p className="text-sm text-muted-foreground">Kapcsold ki, ha nem szeretnéd megjeleníteni a térképet a főoldalon.</p>
            </div>
            <Switch
              checked={section.isVisible !== false}
              onCheckedChange={(checked) => setSection((prev) => ({ ...prev, isVisible: checked }))}
            />
          </div>

          <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as Language)}>
            <TabsList>
              <TabsTrigger value="hu">Magyar</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cím</Label>
              <Input
                value={(languageContent.title as string) || ""}
                onChange={(event) => updateLanguageField("title", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Leírás</Label>
              <Textarea
                rows={3}
                value={(languageContent.description as string) || ""}
                onChange={(event) => updateLanguageField("description", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Térképpontok (JSON)</Label>
              <Textarea
                rows={16}
                value={pointsInput}
                onChange={(event) => setPointsInput(event.target.value)}
                onBlur={() => {
                  try {
                    const parsed = JSON.parse(pointsInput);
                    if (!Array.isArray(parsed)) {
                      toast.error("A térképpontok mezőnek JSON tömbnek kell lennie.");
                      return;
                    }
                    updateLanguageField("points", parsed);
                  } catch {
                    toast.error("Érvénytelen JSON formátum a térképpontoknál.");
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Formátum: [&#123; "name": "Szervezet", "members": "...", "color": "#FF6B35", "description": "...", "coordinates": [19.04, 47.49] &#125;]
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mentés
          </Button>
        </Card>
      </div>
    </AdminLayout>
  );
}
