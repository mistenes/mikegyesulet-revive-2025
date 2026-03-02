import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tags, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SeoMetaTag = {
  id: string;
  page_path: string;
  page_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string | null;
  canonical_url: string | null;
  no_index: boolean | null;
  no_follow: boolean | null;
};

export default function AdminSeoMetaTags() {
  const [pages, setPages] = useState<SeoMetaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from("seo_meta_tags")
        .select("*")
        .order("page_name");
      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error("Error fetching SEO tags:", error);
      toast.error("Hiba az SEO adatok betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (id: string, field: string, value: string | boolean) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async (page: SeoMetaTag) => {
    setSaving(page.id);
    try {
      const { error } = await supabase
        .from("seo_meta_tags")
        .update({
          meta_title: page.meta_title,
          meta_description: page.meta_description,
          meta_keywords: page.meta_keywords,
          og_title: page.og_title,
          og_description: page.og_description,
          og_image: page.og_image,
          og_type: page.og_type,
          canonical_url: page.canonical_url,
          no_index: page.no_index,
          no_follow: page.no_follow,
        })
        .eq("id", page.id);
      if (error) throw error;
      toast.success(`${page.page_name} SEO beállítások mentve!`);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Hiba a mentés során");
    } finally {
      setSaving(null);
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
            <Tags className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Meta címkék
            </h1>
            <p className="text-muted-foreground">
              Oldalankénti SEO meta címkék és Open Graph beállítások
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {pages.map((page) => {
            const isExpanded = expandedPage === page.id;
            const titleLen = (page.meta_title || "").length;
            const descLen = (page.meta_description || "").length;

            return (
              <Card key={page.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedPage(isExpanded ? null : page.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{page.page_name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{page.page_path}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 space-y-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Meta cím <span className={`text-xs ${titleLen > 60 ? "text-destructive" : "text-muted-foreground"}`}>({titleLen}/60)</span></Label>
                        <Input
                          value={page.meta_title || ""}
                          onChange={(e) => handleUpdate(page.id, "meta_title", e.target.value)}
                          placeholder="Oldal címe..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Canonical URL</Label>
                        <Input
                          value={page.canonical_url || ""}
                          onChange={(e) => handleUpdate(page.id, "canonical_url", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Meta leírás <span className={`text-xs ${descLen > 160 ? "text-destructive" : "text-muted-foreground"}`}>({descLen}/160)</span></Label>
                      <Textarea
                        value={page.meta_description || ""}
                        onChange={(e) => handleUpdate(page.id, "meta_description", e.target.value)}
                        placeholder="Oldal leírása..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Meta kulcsszavak</Label>
                      <Input
                        value={page.meta_keywords || ""}
                        onChange={(e) => handleUpdate(page.id, "meta_keywords", e.target.value)}
                        placeholder="kulcsszó1, kulcsszó2, kulcsszó3"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-foreground mb-3">Open Graph (közösségi megosztás)</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>OG cím</Label>
                          <Input
                            value={page.og_title || ""}
                            onChange={(e) => handleUpdate(page.id, "og_title", e.target.value)}
                            placeholder="Megosztási cím..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>OG típus</Label>
                          <Input
                            value={page.og_type || "website"}
                            onChange={(e) => handleUpdate(page.id, "og_type", e.target.value)}
                            placeholder="website"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>OG leírás</Label>
                        <Textarea
                          value={page.og_description || ""}
                          onChange={(e) => handleUpdate(page.id, "og_description", e.target.value)}
                          placeholder="Megosztási leírás..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>OG kép URL</Label>
                        <Input
                          value={page.og_image || ""}
                          onChange={(e) => handleUpdate(page.id, "og_image", e.target.value)}
                          placeholder="https://... (1200x630 ajánlott)"
                        />
                        {page.og_image && (
                          <img src={page.og_image} alt="OG preview" className="h-20 w-auto object-cover rounded border mt-1" />
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4 flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={page.no_index || false}
                          onCheckedChange={(v) => handleUpdate(page.id, "no_index", v)}
                        />
                        <Label className="text-sm">noindex</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={page.no_follow || false}
                          onCheckedChange={(v) => handleUpdate(page.id, "no_follow", v)}
                        />
                        <Label className="text-sm">nofollow</Label>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSave(page)}
                      disabled={saving === page.id}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      {saving === page.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Mentés...</>
                      ) : (
                        <><Save className="h-4 w-4" /> Mentés</>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
