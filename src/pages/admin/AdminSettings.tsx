import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Loader2, Image as ImageIcon, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type SettingItem = {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_label: string;
  setting_type: string;
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("setting_key", ["site_name", "site_keywords", "site_logo"])
        .order("setting_label");

      if (error) throw error;

      setSettings(data || []);
      
      const initialData: Record<string, string> = {};
      data?.forEach((setting) => {
        initialData[setting.setting_key] = setting.setting_value || "";
      });
      setFormData(initialData);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Hiba a beállítások betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: formData[setting.setting_key] || "" })
          .eq("id", setting.id);

        if (error) throw error;
      }

      toast.success("Beállítások sikeresen mentve!");
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Hiba a mentés során");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, key: string) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Jelentkezz be a kép feltöltéséhez');
          return;
        }

        const { data, error } = await supabase.functions.invoke('upload-to-imagekit', {
          body: { file: base64data, folder: 'site' },
        });

        if (error) throw error;

        setFormData({ ...formData, [key]: data.url });
        toast.success('Kép feltöltve!');
      };
    } catch (error) {
      console.error('ImageKit error:', error);
      toast.error('Hiba a kép feltöltése során');
    }
  };

  const handleSelectFromLibrary = (key: string, url: string) => {
    setFormData({ ...formData, [key]: url });
    toast.success('Kép kiválasztva!');
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
            {settings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label className="text-sm font-medium">{setting.setting_label}</Label>
                
                {setting.setting_type === "image" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={formData[setting.setting_key] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [setting.setting_key]: e.target.value })
                        }
                        placeholder="Kép URL"
                        className="flex-1"
                      />
                      <ImageKitMediaBrowser 
                        onSelect={(url) => handleSelectFromLibrary(setting.setting_key, url)} 
                        folder="site" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById(`${setting.setting_key}-upload`)?.click()}
                        className="gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Feltöltés
                      </Button>
                      <input
                        id={`${setting.setting_key}-upload`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, setting.setting_key);
                        }}
                      />
                    </div>
                    {formData[setting.setting_key] && (
                      <img
                        src={formData[setting.setting_key]}
                        alt="Logo preview"
                        className="h-24 w-auto object-contain rounded-md border p-2 bg-white"
                      />
                    )}
                  </div>
                ) : setting.setting_key === "site_keywords" ? (
                  <Textarea
                    value={formData[setting.setting_key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [setting.setting_key]: e.target.value })
                    }
                    placeholder="kulcsszó1, kulcsszó2, kulcsszó3"
                    rows={3}
                  />
                ) : (
                  <Input
                    type="text"
                    value={formData[setting.setting_key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [setting.setting_key]: e.target.value })
                    }
                    placeholder={`Add meg a ${setting.setting_label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mentés...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Változások mentése
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

// ImageKit Media Browser Component
function ImageKitMediaBrowser({ onSelect, folder }: { onSelect: (url: string) => void; folder?: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Jelentkezz be a képek böngészéséhez');
        return;
      }

      const { data, error } = await supabase.functions.invoke('list-imagekit-files', {
        body: { folder, limit: 50 },
      });

      if (error) throw error;

      setImages(data.files || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Hiba a képek betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && images.length === 0) {
      fetchImages();
    }
  };

  const handleSelectImage = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Images className="h-4 w-4" />
          Böngészés
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>ImageKit Médiatár</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[60vh]">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Images className="h-12 w-12 mb-2 opacity-50" />
                <p>Nincsenek feltöltött képek</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4">
                {images.map((image) => (
                  <button
                    key={image.fileId}
                    onClick={() => handleSelectImage(image.url)}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-pointer"
                  >
                    <img
                      src={image.thumbnail || image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Save className="h-8 w-8 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
