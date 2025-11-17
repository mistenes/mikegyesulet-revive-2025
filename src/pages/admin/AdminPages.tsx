import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type PageContent = {
  id: string;
  section_key: string;
  section_name: string;
  content: any;
  created_at: string;
  updated_at: string;
};

const pageContentSchema = z.object({
  title: z.string().min(1, "A cím kötelező").max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
});

export default function AdminPages() {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fooldal");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .order("section_name");

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Hiba az oldaltartalmak betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sectionKey: string, content: any) => {
    setSaving(sectionKey);
    
    try {
      // Validate content
      if (content.title || content.subtitle || content.description) {
        const validation = pageContentSchema.safeParse(content);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setSaving(null);
          return;
        }
      }

      const existingPage = pages.find(p => p.section_key === sectionKey);

      if (existingPage) {
        // Update existing
        const { error } = await supabase
          .from("page_content")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("section_key", sectionKey);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("page_content")
          .insert({
            section_key: sectionKey,
            section_name: getSectionDisplayName(sectionKey),
            content
          });

        if (error) throw error;
      }

      toast.success("Változások sikeresen mentve!");
      await fetchPages();
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Hiba a mentés során");
    } finally {
      setSaving(null);
    }
  };

  const getSectionDisplayName = (key: string): string => {
    const names: Record<string, string> = {
      hero: "Főoldal - Hero",
      about: "Főoldal - Rólunk röviden",
      stats: "Főoldal - Statisztikák",
      news: "Főoldal - Hírek szekció",
      regions_intro: "Régiók - Bevezető",
      regions_map: "Régiók - Térkép",
      regions_list: "Régiók - Lista",
      about_intro: "Rólunk - Bevezető",
      mission: "Rólunk - Küldetés",
      vision: "Rólunk - Jövőkép",
      team: "Rólunk - Csapat",
      gallery_intro: "Galéria - Bevezető",
      gallery_images: "Galéria - Képek"
    };
    return names[key] || key;
  };

  const getPageContent = (sectionKey: string) => {
    const page = pages.find(p => p.section_key === sectionKey);
    return page?.content || {};
  };

  const updateLocalContent = (sectionKey: string, field: string, value: string) => {
    setPages(prev => {
      const existing = prev.find(p => p.section_key === sectionKey);
      const updatedContent = { ...getPageContent(sectionKey), [field]: value };
      
      if (existing) {
        return prev.map(p => 
          p.section_key === sectionKey 
            ? { ...p, content: updatedContent }
            : p
        );
      }
      
      // If doesn't exist yet, add a temporary entry
      return [...prev, {
        id: '',
        section_key: sectionKey,
        section_name: getSectionDisplayName(sectionKey),
        content: updatedContent,
        created_at: '',
        updated_at: ''
      }];
    });
  };

  const renderSectionEditor = (sectionKey: string) => {
    const content = getPageContent(sectionKey);
    const isSaving = saving === sectionKey;

    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${sectionKey}-title`}>Cím *</Label>
            <Input
              id={`${sectionKey}-title`}
              value={content.title || ""}
              onChange={(e) => updateLocalContent(sectionKey, 'title', e.target.value)}
              placeholder="Add meg a szekció címét"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${sectionKey}-subtitle`}>Alcím (opcionális)</Label>
            <Input
              id={`${sectionKey}-subtitle`}
              value={content.subtitle || ""}
              onChange={(e) => updateLocalContent(sectionKey, 'subtitle', e.target.value)}
              placeholder="Add meg az alcímet"
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${sectionKey}-description`}>Leírás (opcionális)</Label>
            <Textarea
              id={`${sectionKey}-description`}
              value={content.description || ""}
              onChange={(e) => updateLocalContent(sectionKey, 'description', e.target.value)}
              placeholder="Add meg a leírást"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {(content.description || '').length} / 2000 karakter
            </p>
          </div>

          <Button 
            onClick={() => handleSave(sectionKey, content)}
            disabled={isSaving || !content.title}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mentés...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Változások mentése
              </>
            )}
          </Button>
        </div>
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
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Oldal Tartalmak
            </h1>
            <p className="text-muted-foreground">
              Szerkeszd az oldal szöveges tartalmait
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fooldal">Főoldal</TabsTrigger>
            <TabsTrigger value="regiok">Régiók</TabsTrigger>
            <TabsTrigger value="rolunk">Rólunk</TabsTrigger>
            <TabsTrigger value="galeria">Galéria</TabsTrigger>
          </TabsList>

          <TabsContent value="fooldal" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Hero Szekció</h3>
                {renderSectionEditor("hero")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Rólunk Röviden</h3>
                {renderSectionEditor("about")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Statisztikák</h3>
                {renderSectionEditor("stats")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Hírek Szekció</h3>
                {renderSectionEditor("news")}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regiok" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bevezető Szekció</h3>
                {renderSectionEditor("regions_intro")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Térkép Szekció</h3>
                {renderSectionEditor("regions_map")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Régiók Lista</h3>
                {renderSectionEditor("regions_list")}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rolunk" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bevezető</h3>
                {renderSectionEditor("about_intro")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Küldetés</h3>
                {renderSectionEditor("mission")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Jövőkép</h3>
                {renderSectionEditor("vision")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Csapat</h3>
                {renderSectionEditor("team")}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="galeria" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bevezető Szekció</h3>
                {renderSectionEditor("gallery_intro")}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Galéria Képek</h3>
                {renderSectionEditor("gallery_images")}
                <p className="text-sm text-muted-foreground mt-2">
                  Megjegyzés: A képek kezeléséhez később külön galéria kezelő készül
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
