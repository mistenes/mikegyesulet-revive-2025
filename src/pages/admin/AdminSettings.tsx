import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSetting } from "@/services/settingsService";

export default function AdminSettings() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    const initial: Record<string, string> = {};
    Object.entries(settings.general).forEach(([key, setting]) => {
      initial[key] = setting.value;
    });
    setFormData(initial);
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      Object.entries(formData).forEach(([key, value]) => {
        updateSetting("general", key, value);
      });
      toast.success("Beállítások elmentve!");
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
            <Settings className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Általános beállítások
            </h1>
            <p className="text-muted-foreground">
              Weboldal neve, kulcsszavak és logó kezelése
            </p>
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Oldal neve</Label>
              <Input
                value={formData.site_name || ""}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Kulcsszavak</Label>
              <Textarea
                value={formData.site_keywords || ""}
                onChange={(e) => setFormData({ ...formData, site_keywords: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Logó URL</Label>
              <Input
                value={formData.site_logo || ""}
                onChange={(e) => setFormData({ ...formData, site_logo: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mentés...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Változások mentése
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
