import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Save, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fetchPublicSiteSettings, getSitemapUrl, saveSiteSettings } from "@/services/siteSettingsService";
import { getSettings } from "@/services/settingsService";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";

type LogoSource = "siteLogo" | "favicon" | "custom";

export default function AdminSeoTools() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteSearchTitle, setSiteSearchTitle] = useState("");
  const [siteSearchDescription, setSiteSearchDescription] = useState("");
  const [siteFavicon, setSiteFavicon] = useState("");
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [logoSource, setLogoSource] = useState<LogoSource>("siteLogo");

  const settings = getSettings();
  const siteLogo = String(settings.general.site_logo?.value || "").trim();

  const effectiveLogo = useMemo(() => {
    if (logoSource === "favicon") return siteFavicon.trim();
    if (logoSource === "custom") return customLogoUrl.trim();
    return siteLogo;
  }, [customLogoUrl, logoSource, siteFavicon, siteLogo]);

  useEffect(() => {
    fetchPublicSiteSettings()
      .then((siteSettings) => {
        setSiteSearchTitle(siteSettings.siteSearchTitle || "");
        setSiteSearchDescription(siteSettings.siteSearchDescription || "");
        setSiteFavicon(siteSettings.siteFavicon || "");

        const savedLogo = siteSettings.siteSearchLogo || "";
        if (savedLogo && savedLogo === siteSettings.siteFavicon) {
          setLogoSource("favicon");
          setCustomLogoUrl("");
        } else if (savedLogo && savedLogo === siteLogo) {
          setLogoSource("siteLogo");
          setCustomLogoUrl("");
        } else if (savedLogo) {
          setLogoSource("custom");
          setCustomLogoUrl(savedLogo);
        }
      })
      .catch((error) => {
        toast.error((error as Error).message || "Nem sikerült betölteni az SEO beállításokat");
      })
      .finally(() => setLoading(false));
  }, [siteLogo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteSettings({
        siteFavicon: siteFavicon.trim(),
        siteSearchTitle: siteSearchTitle.trim(),
        siteSearchDescription: siteSearchDescription.trim(),
        siteSearchLogo: effectiveLogo,
      });
      toast.success("SEO beállítások mentve");
    } catch (error) {
      toast.error((error as Error).message || "Sikertelen mentés");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const sitemapUrl = getSitemapUrl();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">SEO eszközök</h1>
            <p className="text-muted-foreground">Google snippet előnézet, crawl logó kiválasztás és sitemap generálás.</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mentés
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Alap SEO beállítások</h2>
          <div className="space-y-2">
            <Label>Google találati cím</Label>
            <Input value={siteSearchTitle} onChange={(event) => setSiteSearchTitle(event.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>Google találati leírás</Label>
            <Textarea value={siteSearchDescription} onChange={(event) => setSiteSearchDescription(event.target.value)} maxLength={320} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Favicon URL</Label>
            <Input value={siteFavicon} onChange={(event) => setSiteFavicon(event.target.value)} placeholder="https://..." />
          </div>
          <p className="text-sm text-muted-foreground">Ezek a mezők a kereső találati cím/leírás meta tagjeit és a favicon forrását vezérlik.</p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Keresőmotor által beolvasott logó</h2>
          <RadioGroup value={logoSource} onValueChange={(value) => setLogoSource(value as LogoSource)} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="siteLogo" id="seo-logo-site" />
              <Label htmlFor="seo-logo-site">Webhely logó (Beállítások / Oldal logó)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="favicon" id="seo-logo-favicon" />
              <Label htmlFor="seo-logo-favicon">Favicon használata</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="seo-logo-custom" />
              <Label htmlFor="seo-logo-custom">Egyedi URL</Label>
            </div>
          </RadioGroup>

          {logoSource === "custom" && (
            <div className="space-y-2">
              <Label>Egyedi logó URL</Label>
              <Input value={customLogoUrl} onChange={(event) => setCustomLogoUrl(event.target.value)} placeholder="https://..." />
            </div>
          )}

          <div className="rounded-md border p-4 bg-muted/20">
            <p className="text-sm text-muted-foreground mb-2">Aktív crawl logó előnézet:</p>
            {effectiveLogo ? <img src={effectiveLogo} alt="SEO logo" className="h-16 w-16 object-contain border rounded bg-white" /> : <p className="text-sm">Nincs kiválasztott logó.</p>}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Search className="h-5 w-5" /> Keresési találat előnézet</h2>
          <div className="rounded-lg border p-4 bg-white max-w-2xl">
            <p className="text-xs text-muted-foreground">{window.location.origin.replace(/^https?:\/\//, "")}</p>
            <p className="text-xl text-[#1a0dab] leading-snug">{siteSearchTitle || "Cím előnézet"}</p>
            <p className="text-sm text-[#4d5156]">{siteSearchDescription || "Leírás előnézet"}</p>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Sitemap generátor</h2>
          <p className="text-sm text-muted-foreground">A sitemap automatikusan generálódik a publikált hírekből, projektekből és galériából.</p>
          <div className="flex gap-3 flex-wrap">
            <Button asChild variant="outline" className="gap-2">
              <a href={sitemapUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Sitemap megnyitása
              </a>
            </Button>
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/admin/settings">
                <Sparkles className="h-4 w-4" /> Beállítások oldal
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
