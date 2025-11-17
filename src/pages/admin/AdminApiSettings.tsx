import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Key, Eye, EyeOff, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Setting = {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_label: string;
  setting_type: string;
};

export default function AdminApiSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("setting_label");

    if (error) {
      toast.error("Hiba a beállítások betöltésekor");
      console.error(error);
    } else {
      setSettings(data || []);
    }
  };

  const handleSave = async (settingId: string, value: string) => {
    const { error } = await supabase
      .from("site_settings")
      .update({ setting_value: value })
      .eq("id", settingId);

    if (error) {
      toast.error("Hiba a mentés során");
      console.error(error);
    } else {
      toast.success("Beállítás mentve!");
      fetchSettings();
    }
  };

  const toggleVisibility = (settingKey: string) => {
    setShowTokens((prev) => ({
      ...prev,
      [settingKey]: !prev[settingKey],
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              API Kulcsok
            </h1>
            <p className="text-muted-foreground">
              Kezeld az API kulcsokat és integrációkat
            </p>
          </div>
        </div>

        <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Biztonsági információ
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Az itt tárolt API kulcsok titkosítva vannak az adatbázisban. Soha ne oszd meg
                ezeket a kulcsokat senkivel, és győződj meg róla, hogy csak megbízható API
                kulcsokat használsz.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          {settings.map((setting) => (
            <Card key={setting.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {setting.setting_label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    API kulcs: {setting.setting_key}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={setting.setting_key}>API Token</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={setting.setting_key}
                      type={showTokens[setting.setting_key] ? "text" : "password"}
                      defaultValue={setting.setting_value || ""}
                      placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility(setting.setting_key)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showTokens[setting.setting_key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => {
                      const input = document.getElementById(
                        setting.setting_key
                      ) as HTMLInputElement;
                      if (input) {
                        handleSave(setting.id, input.value);
                      }
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Mentés
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A token megváltoztatása után a térkép automatikusan frissül az új kulccsal.
                </p>
              </div>

              {setting.setting_key === "mapbox_token" && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Mapbox token beszerzése:</strong>
                    <br />
                    1. Látogass el a{" "}
                    <a
                      href="https://mapbox.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      mapbox.com
                    </a>{" "}
                    oldalra
                    <br />
                    2. Jelentkezz be vagy hozz létre új fiókot
                    <br />
                    3. Keresd meg a "Tokens" menüpontot a dashboardon
                    <br />
                    4. Másold ki a "Default public token"-t vagy hozz létre újat
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
