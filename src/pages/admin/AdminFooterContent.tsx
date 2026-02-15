import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link as LinkIcon, Plus, Save, Trash2, Globe2, Facebook, Instagram, Twitter, Youtube, Music2, Linkedin } from "lucide-react";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { createEmptyLink, getFooterContent, saveFooterContent } from "@/services/footerContentService";
import type { SocialLink, SocialPlatform } from "@/types/footer";

const platformOptions: { value: SocialPlatform; label: string; description?: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "twitter", label: "Twitter / X", icon: Twitter },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "tiktok", label: "TikTok", icon: Music2 },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "custom", label: "Egyedi", description: "Egyéb link vagy alternatív hálózat", icon: Globe2 },
];

export default function AdminFooterContent() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const content = getFooterContent();
    setLinks(content.socialLinks);
  }, []);

  const defaultLabelMap = useMemo(
    () =>
      platformOptions.reduce<Record<SocialPlatform, string>>((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {} as Record<SocialPlatform, string>),
    []
  );

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

  const updateLink = (id: string, update: Partial<SocialLink>) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...update } : link)));
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleAddLink = () => {
    setLinks((prev) => [...prev, createEmptyLink()]);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const normalized = links.map((link) => ({
        ...link,
        url: link.url.trim(),
        label: link.label?.trim() || undefined,
      }));
      saveFooterContent({ socialLinks: normalized });
      toast.success("Lábléc hivatkozások frissítve");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült menteni a lábléc tartalmat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              Lábléc tartalom
            </h1>
            <p className="text-muted-foreground">
              Kezeld a közösségi média hivatkozásokat, adj alternatívákat vagy rejts el egyes linkeket.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleAddLink}>
              <Plus className="h-4 w-4" /> Új link
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Save className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Mentés
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          {links.length === 0 ? (
            <div className="text-muted-foreground text-sm">Nincs megjeleníthető hivatkozás. Adj hozzá egy újat!</div>
          ) : (
            <div className="space-y-4">
              {links.map((link) => {
                const option = platformOptions.find((item) => item.value === link.type);
                const Icon = option?.icon || LinkIcon;
                const isCustom = link.type === "custom";

                return (
                  <div key={link.id} className="border border-border/60 rounded-lg p-4 space-y-4 bg-background/60">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/60">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Közösségi csatorna</Label>
                          <p className="text-xs text-muted-foreground">Válaszd ki a megjelenített platformot.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.enabled}
                          onCheckedChange={(checked) => updateLink(link.id, { enabled: checked })}
                          aria-label="Link megjelenítése"
                        />
                        <span className="text-sm text-muted-foreground">Megjelenítés</span>
                        <Button variant="ghost" size="icon" onClick={() => removeLink(link.id)} aria-label="Link törlése">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <Select
                          value={link.type}
                          onValueChange={(value) => {
                            const nextType = value as SocialPlatform;
                            updateLink(link.id, {
                              type: nextType,
                              label:
                                link.label && link.label.length > 0
                                  ? link.label
                                  : defaultLabelMap[nextType] || link.label,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz platformot" />
                          </SelectTrigger>
                          <SelectContent>
                            {platformOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  <div className="flex flex-col text-left">
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">{option.description}</span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hivatkozás</Label>
                        <Input
                          type="url"
                          placeholder="https://"
                          value={link.url}
                          onChange={(event) => updateLink(link.id, { url: event.target.value })}
                        />
                      </div>
                    </div>

                    {isCustom && (
                      <div className="space-y-2">
                        <Label>Egyedi megnevezés</Label>
                        <Input
                          placeholder="Pl. Hírlevél"
                          value={link.label || ""}
                          onChange={(event) => updateLink(link.id, { label: event.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Ez a név kerül felhasználásra akadálymentesítéshez és ikon nélküli linkekhez.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
