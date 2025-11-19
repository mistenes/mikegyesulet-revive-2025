import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Key, Save, Loader2, Map, Database } from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSetting } from "@/services/settingsService";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";

export default function AdminApiSettings() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    const initial: Record<string, string> = {};
    Object.entries(settings.integrations).forEach(([key, setting]) => {
      initial[key] = setting.value;
    });
    setFormData(initial);
    setLoading(false);
  }, []);

  if (authLoading) {
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

  const handleSave = async () => {
    setSaving(true);
    try {
      Object.entries(formData).forEach(([key, value]) => {
        updateSetting("integrations", key, value);
      });
      toast.success("Integrációs adatok mentve!");
    } catch (error) {
      console.error(error);
      toast.error("Hiba a mentés során");
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl">
            <Key className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              API és Render beállítások
            </h1>
            <p className="text-muted-foreground">
              Állítsd be a Mapbox, Render és Postgres kapcsolatokat.
            </p>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Map className="h-5 w-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Mapbox token</h3>
              <p className="text-sm text-muted-foreground">
                A token szükséges a térképes megjelenítéshez. A Render API szolgáltatás környezeti változójába is felvehető.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Token</Label>
            <Input
              type="password"
              value={formData.mapbox_token || ""}
              onChange={(e) => setFormData({ ...formData, mapbox_token: e.target.value })}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Render szolgáltatások</h3>
              <p className="text-sm text-muted-foreground">
                Ezek az adatok kerülnek a <code>render.yaml</code> fájlba és a Render környezeti változóiba.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Szolgáltatás neve</Label>
            <Input
              value={formData.render_service_name || ""}
              onChange={(e) => setFormData({ ...formData, render_service_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>API alap URL</Label>
            <Input
              value={formData.render_api_base_url || ""}
              onChange={(e) => setFormData({ ...formData, render_api_base_url: e.target.value })}
              placeholder="https://mik-api.onrender.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Postgres kapcsolat</Label>
            <Input
              type="password"
              value={formData.postgres_connection_url || ""}
              onChange={(e) => setFormData({ ...formData, postgres_connection_url: e.target.value })}
              placeholder="postgres://..."
            />
          </div>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Mentés...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Beállítások mentése
            </>
          )}
        </Button>
      </div>
    </AdminLayout>
  );
}
