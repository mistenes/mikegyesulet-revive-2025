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
import { ArrowLeft, Loader2, MapPin, Plus, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { getSectionContent, saveSection } from "@/services/pageContentService";
import { defaultPageContent } from "@/data/defaultPageContent";
import type { LocalizedSectionContent } from "@/types/pageContent";

type Language = "hu" | "en";

type MapPoint = {
  name: string;
  members: string;
  color: string;
  description: string;
  coordinates: [number, number];
};

type CityResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const defaultMapSection = defaultPageContent.map_section as LocalizedSectionContent;

const emptyDraft: Omit<MapPoint, "coordinates"> & { longitude: string; latitude: string } = {
  name: "",
  members: "",
  color: "#FF6B35",
  description: "",
  longitude: "",
  latitude: "",
};

function parsePoints(value: unknown): MapPoint[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const point = item as Record<string, unknown>;
      const coordinates = Array.isArray(point.coordinates) ? point.coordinates : [];
      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      const name = String(point.name || "").trim();
      if (!name || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;

      return {
        name,
        members: String(point.members || "").trim(),
        color: String(point.color || "#FF6B35").trim() || "#FF6B35",
        description: String(point.description || "").trim(),
        coordinates: [lng, lat] as [number, number],
      };
    })
    .filter((point): point is MapPoint => Boolean(point));
}

function toPointsJson(points: MapPoint[]) {
  return JSON.stringify(points, null, 2);
}

export default function AdminMapEditor() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>("hu");
  const [section, setSection] = useState<LocalizedSectionContent>(defaultMapSection);
  const [pointsInput, setPointsInput] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [cityQuery, setCityQuery] = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const [cityResults, setCityResults] = useState<CityResult[]>([]);

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

  const points = useMemo(() => parsePoints(languageContent.points), [languageContent.points]);

  useEffect(() => {
    setPointsInput(toPointsJson(points));
  }, [points]);

  const updateLanguageField = (key: string, value: unknown) => {
    setSection((prev) => ({
      ...prev,
      [activeLanguage]: {
        ...((prev[activeLanguage] || {}) as Record<string, unknown>),
        [key]: value,
      },
    }));
  };

  const applyParsedPoints = (): MapPoint[] | null => {
    try {
      const parsed = JSON.parse(pointsInput);
      const normalized = parsePoints(parsed);
      if (!Array.isArray(parsed)) {
        toast.error("A térképpontok mezőnek JSON tömbnek kell lennie.");
        return null;
      }
      updateLanguageField("points", normalized);
      return normalized;
    } catch {
      toast.error("Érvénytelen JSON formátum a térképpontoknál.");
      return null;
    }
  };

  const handleAddPoint = () => {
    const currentPoints = applyParsedPoints();
    if (!currentPoints) return;

    const lng = Number(draft.longitude);
    const lat = Number(draft.latitude);
    if (!draft.name.trim() || !Number.isFinite(lng) || !Number.isFinite(lat)) {
      toast.error("Add meg a pont nevét és érvényes koordinátákat.");
      return;
    }

    const next: MapPoint[] = [
      ...currentPoints,
      {
        name: draft.name.trim(),
        members: draft.members.trim(),
        color: draft.color.trim() || "#FF6B35",
        description: draft.description.trim(),
        coordinates: [lng, lat],
      },
    ];

    updateLanguageField("points", next);
    setPointsInput(toPointsJson(next));
    setDraft(emptyDraft);
    setCityResults([]);
    setCityQuery("");
  };

  const removePoint = (index: number) => {
    const next = points.filter((_, i) => i !== index);
    updateLanguageField("points", next);
    setPointsInput(toPointsJson(next));
  };

  const handleSearchCity = async () => {
    if (!cityQuery.trim()) return;
    setCityLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(cityQuery.trim())}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Város keresés sikertelen");
      }

      const data = (await response.json()) as CityResult[];
      setCityResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült várost keresni");
    } finally {
      setCityLoading(false);
    }
  };

  const handleSave = async () => {
    const parsed = applyParsedPoints();
    if (!parsed) return;

    setSaving(true);
    try {
      const payload: LocalizedSectionContent = {
        ...section,
        [activeLanguage]: {
          ...((section[activeLanguage] || {}) as Record<string, unknown>),
          points: parsed,
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
            <p className="text-muted-foreground">Szerkeszd a főoldali térkép pontjait vizuálisan vagy JSON-ban.</p>
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
          </div>

          <Card className="p-4 space-y-4 bg-muted/30 border-dashed">
            <h2 className="font-semibold">Új pont hozzáadása (vizuális)</h2>

            <div className="grid md:grid-cols-[1fr_auto] gap-2">
              <Input
                placeholder="Város keresése (pl. Kolozsvár)"
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
              />
              <Button onClick={handleSearchCity} type="button" variant="secondary" className="gap-2" disabled={cityLoading}>
                {cityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Keresés
              </Button>
            </div>

            {cityResults.length > 0 && (
              <div className="rounded-md border bg-background max-h-56 overflow-auto">
                {cityResults.map((result) => (
                  <button
                    key={`${result.lat}-${result.lon}-${result.display_name}`}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-b-0"
                    onClick={() => {
                      setDraft((prev) => ({
                        ...prev,
                        name: prev.name || result.display_name.split(",")[0].trim(),
                        longitude: Number(result.lon).toFixed(6),
                        latitude: Number(result.lat).toFixed(6),
                      }));
                    }}
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Név</Label>
                <Input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Szervezet</Label>
                <Input value={draft.members} onChange={(event) => setDraft((prev) => ({ ...prev, members: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Szín</Label>
                <Input type="color" value={draft.color} onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Hosszúság (lng)</Label>
                <Input value={draft.longitude} onChange={(event) => setDraft((prev) => ({ ...prev, longitude: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Szélesség (lat)</Label>
                <Input value={draft.latitude} onChange={(event) => setDraft((prev) => ({ ...prev, latitude: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Leírás</Label>
                <Textarea rows={2} value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
              </div>
            </div>

            <Button type="button" onClick={handleAddPoint} className="gap-2">
              <Plus className="h-4 w-4" /> Pont hozzáadása
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">Aktuális pontok ({points.length})</h2>
            <div className="space-y-2">
              {points.map((point, index) => (
                <div key={`${point.name}-${index}`} className="flex items-center justify-between gap-3 rounded border p-2">
                  <div className="text-sm">
                    <p className="font-medium">{point.name}</p>
                    <p className="text-muted-foreground">{point.coordinates[0]}, {point.coordinates[1]} • {point.members || "Nincs szervezet"}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePoint(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {points.length === 0 && <p className="text-sm text-muted-foreground">Még nincsenek pontok.</p>}
            </div>
          </Card>

          <div className="space-y-2">
            <Label>Térképpontok (JSON finomhangolás)</Label>
            <Textarea
              rows={16}
              value={pointsInput}
              onChange={(event) => setPointsInput(event.target.value)}
              onBlur={() => {
                const parsed = applyParsedPoints();
                if (parsed) {
                  setPointsInput(toPointsJson(parsed));
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Formátum: [&#123; "name": "Szervezet", "members": "...", "color": "#FF6B35", "description": "...", "coordinates": [19.04, 47.49] &#125;]
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mentés
          </Button>
        </Card>
      </div>
    </AdminLayout>
  );
}
