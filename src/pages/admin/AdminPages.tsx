import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Trash2, Save, Type, Link2, BarChart3, Info, Loader2, CheckCircle2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ImageKit configuration type
type ImageKitConfig = {
  publicKey: string;
  urlEndpoint: string;
};

type PageSection = {
  id: string;
  section_key: string;
  section_name: string;
  content: any;
};

export default function AdminPages() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .order("section_name");

      if (error) throw error;
      setSections(data || []);
      if (data && data.length > 0 && !activeTab) {
        setActiveTab(data[0].section_key);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Hiba a szekciók betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sectionKey: string, content: any) => {
    setSaving(sectionKey);
    try {
      const { error } = await supabase
        .from("page_content")
        .update({ content })
        .eq("section_key", sectionKey);

      if (error) throw error;
      
      // Show success animation
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Változások sikeresen mentve!");
      fetchSections();
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Hiba a mentés során");
    } finally {
      setSaving(null);
    }
  };

  const renderEditor = (section: PageSection) => {
    const content = section.content;
    const isSaving = saving === section.section_key;

    switch (section.section_key) {
      case "hero_stats":
        return <HeroStatsEditor content={content} onSave={(c) => handleSave(section.section_key, c)} isSaving={isSaving} />;
      case "hero_content":
        return <HeroContentEditor content={content} onSave={(c) => handleSave(section.section_key, c)} isSaving={isSaving} />;
      case "about_section":
      case "regions_section":
      case "news_section":
        return <GenericSectionEditor content={content} onSave={(c) => handleSave(section.section_key, c)} isSaving={isSaving} sectionKey={section.section_key} />;
      default:
        return <div className="text-center py-8 text-muted-foreground">Nincs szerkesztő ehhez a szekcióhoz</div>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Betöltés...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Oldal tartalmak
            </h1>
            <p className="text-muted-foreground">
              Szerkeszd az oldal különböző szekcióit valós időben
            </p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {sections.length} szekció
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-muted/50">
            {sections.map((section) => (
              <TabsTrigger 
                key={section.section_key} 
                value={section.section_key}
                className="data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
              >
                {section.section_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.section_key} value={section.section_key} className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" />
                  <h2 className="text-xl font-semibold text-foreground">{section.section_name}</h2>
                </div>
                {renderEditor(section)}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Hero Stats Editor
function HeroStatsEditor({ content, onSave, isSaving }: { content: any; onSave: (content: any) => void; isSaving: boolean }) {
  const [stats, setStats] = useState(content.stats || []);

  const addStat = () => {
    setStats([...stats, { value: "", label: "" }]);
  };

  const removeStat = (index: number) => {
    setStats(stats.filter((_: any, i: number) => i !== index));
  };

  const updateStat = (index: number, field: string, value: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setStats(newStats);
  };

  const handleSave = () => {
    onSave({ stats });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Statisztikák</h3>
        </div>
        <Button onClick={addStat} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Új stat
        </Button>
      </div>

      <Separator />

      <div className="grid gap-4">
        {stats.map((stat: any, index: number) => (
          <Card key={index} className="p-4 bg-gradient-to-br from-background to-muted/30 border-2 hover:border-primary/50 transition-colors">
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <Type className="h-3 w-3" />
                  Érték
                </Label>
                <Input
                  value={stat.value}
                  onChange={(e) => updateStat(index, "value", e.target.value)}
                  placeholder="pl. 2000+"
                  className="font-semibold"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <Info className="h-3 w-3" />
                  Címke
                </Label>
                <Input
                  value={stat.label}
                  onChange={(e) => updateStat(index, "label", e.target.value)}
                  placeholder="pl. Tagok"
                />
              </div>
              <Button variant="destructive" size="icon" onClick={() => removeStat(index)} className="shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button 
        onClick={handleSave} 
        className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mentés...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Mentés
          </>
        )}
      </Button>
    </div>
  );
}

// Hero Content Editor
function HeroContentEditor({ content, onSave, isSaving }: { content: any; onSave: (content: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    title: content.title || "",
    description: content.description || "",
    primaryButtonText: content.primaryButtonText || "",
    primaryButtonUrl: content.primaryButtonUrl || "",
    secondaryButtonText: content.secondaryButtonText || "",
    backgroundImage: content.backgroundImage || "",
  });

  const handleSave = () => {
    onSave(formData);
  };

  const handleImageUpload = async (file: File) => {
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
          body: { file: base64data, folder: 'pages' },
        });

        if (error) throw error;

        setFormData({ ...formData, backgroundImage: data.url });
        toast.success('Kép feltöltve!');
      };
    } catch (error) {
      console.error('ImageKit error:', error);
      toast.error('Hiba a kép feltöltése során');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Főcím
          </Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="text-lg font-semibold"
            placeholder="Add meg a főcímet..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Leírás
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Add meg a leírást..."
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Elsődleges gomb</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Type className="h-3 w-3" />
              Gomb szöveg
            </Label>
            <Input
              value={formData.primaryButtonText}
              onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
              placeholder="pl. CSATLAKOZZ"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Link2 className="h-3 w-3" />
              Gomb URL
            </Label>
            <Input
              value={formData.primaryButtonUrl}
              onChange={(e) => setFormData({ ...formData, primaryButtonUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Másodlagos gomb</h4>
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-2">
            <Type className="h-3 w-3" />
            Gomb szöveg
          </Label>
          <Input
            value={formData.secondaryButtonText}
            onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
            placeholder="pl. TUDJ MEG TÖBBET"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Háttérkép</h4>
        <div className="flex gap-2">
          <Input
            value={formData.backgroundImage}
            onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
            placeholder="Kép URL"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('hero-image-upload')?.click()}
            className="gap-2"
          >
            <Image className="h-4 w-4" />
            Feltöltés
          </Button>
          <input
            id="hero-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
        </div>
        {formData.backgroundImage && (
          <div className="space-y-2">
            <img 
              src={formData.backgroundImage} 
              alt="Background preview" 
              className="w-full h-32 object-cover rounded-md border"
            />
          </div>
        )}
      </div>

      <Button
        onClick={handleSave} 
        className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mentés...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Változások mentése
          </>
        )}
      </Button>
    </div>
  );
}

// Generic Section Editor
function GenericSectionEditor({ content, onSave, isSaving, sectionKey }: { content: any; onSave: (content: any) => void; isSaving: boolean; sectionKey: string }) {
  const [formData, setFormData] = useState({ ...content });

  const handleSave = () => {
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageUpload = async (field: string, file: File) => {
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
          body: { file: base64data, folder: 'pages' },
        });

        if (error) throw error;

        setFormData({ ...formData, [field]: data.url });
        toast.success('Kép feltöltve!');
      };
    } catch (error) {
      console.error('ImageKit error:', error);
      toast.error('Hiba a kép feltöltése során');
    }
  };

  const getFieldIcon = (key: string) => {
    if (key.includes('title')) return Type;
    if (key.includes('button')) return Link2;
    if (key.includes('url') || key.includes('image')) return Link2;
    return Info;
  };

  const isImageField = (key: string) => {
    return key.toLowerCase().includes('image') || key.toLowerCase().includes('url');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {Object.keys(formData).map((key, index) => {
          const Icon = getFieldIcon(key);
          const isLongText = typeof formData[key] === 'string' && formData[key].length > 100;
          const isImage = isImageField(key);
          
          return (
            <div key={key} className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2 capitalize">
                <Icon className="h-4 w-4 text-primary" />
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              {isLongText ? (
                <Textarea
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder={`Add meg a(z) ${key}...`}
                />
              ) : isImage ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={formData[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="Kép URL"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById(`${key}-upload`)?.click()}
                      className="gap-2"
                    >
                      <Image className="h-4 w-4" />
                      Feltöltés
                    </Button>
                    <input
                      id={`${key}-upload`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(key, file);
                      }}
                    />
                  </div>
                  {formData[key] && (
                    <img 
                      src={formData[key]} 
                      alt={`${key} preview`} 
                      className="w-full h-32 object-cover rounded-md border"
                    />
                  )}
                </div>
              ) : (
                <Input
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={`Add meg a(z) ${key}...`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Separator />

      <Button 
        onClick={handleSave} 
        className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mentés folyamatban...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Változások mentése
          </>
        )}
      </Button>
    </div>
  );
}
