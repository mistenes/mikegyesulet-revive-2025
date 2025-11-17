import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    try {
      const { error } = await supabase
        .from("page_content")
        .update({ content })
        .eq("section_key", sectionKey);

      if (error) throw error;
      toast.success("Változások mentve!");
      fetchSections();
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Hiba a mentés során");
    }
  };

  const renderEditor = (section: PageSection) => {
    const content = section.content;

    switch (section.section_key) {
      case "hero_stats":
        return <HeroStatsEditor content={content} onSave={(c) => handleSave(section.section_key, c)} />;
      case "hero_content":
        return <HeroContentEditor content={content} onSave={(c) => handleSave(section.section_key, c)} />;
      case "about_section":
      case "regions_section":
      case "news_section":
        return <GenericSectionEditor content={content} onSave={(c) => handleSave(section.section_key, c)} />;
      default:
        return <div>Nincs szerkesztő ehhez a szekcióhoz</div>;
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
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Oldal tartalmak
            </h1>
            <p className="text-muted-foreground">
              Szerkeszd az oldal különböző szekcióit
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            {sections.map((section) => (
              <TabsTrigger key={section.section_key} value={section.section_key}>
                {section.section_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.section_key} value={section.section_key}>
              <Card className="p-6">
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
function HeroStatsEditor({ content, onSave }: { content: any; onSave: (content: any) => void }) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statisztikák</h3>
        <Button onClick={addStat} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Új stat
        </Button>
      </div>

      {stats.map((stat: any, index: number) => (
        <Card key={index} className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Érték</Label>
              <Input
                value={stat.value}
                onChange={(e) => updateStat(index, "value", e.target.value)}
                placeholder="pl. 2000+"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Címke</Label>
              <Input
                value={stat.label}
                onChange={(e) => updateStat(index, "label", e.target.value)}
                placeholder="pl. Tagok"
              />
            </div>
            <Button variant="destructive" size="icon" onClick={() => removeStat(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Button onClick={handleSave} className="w-full">
        Mentés
      </Button>
    </div>
  );
}

// Hero Content Editor
function HeroContentEditor({ content, onSave }: { content: any; onSave: (content: any) => void }) {
  const [formData, setFormData] = useState({
    title: content.title || "",
    description: content.description || "",
    primaryButtonText: content.primaryButtonText || "",
    primaryButtonUrl: content.primaryButtonUrl || "",
    secondaryButtonText: content.secondaryButtonText || "",
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Főcím</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Leírás</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Elsődleges gomb szöveg</Label>
          <Input
            value={formData.primaryButtonText}
            onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Elsődleges gomb URL</Label>
          <Input
            value={formData.primaryButtonUrl}
            onChange={(e) => setFormData({ ...formData, primaryButtonUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Másodlagos gomb szöveg</Label>
        <Input
          value={formData.secondaryButtonText}
          onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
        />
      </div>

      <Button onClick={handleSave} className="w-full">
        Mentés
      </Button>
    </div>
  );
}

// Generic Section Editor
function GenericSectionEditor({ content, onSave }: { content: any; onSave: (content: any) => void }) {
  const [formData, setFormData] = useState({ ...content });

  const handleSave = () => {
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      {Object.keys(formData).map((key) => (
        <div key={key} className="space-y-2">
          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
          {typeof formData[key] === 'string' && formData[key].length > 100 ? (
            <Textarea
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          )}
        </div>
      ))}

      <Button onClick={handleSave} className="w-full">
        Mentés
      </Button>
    </div>
  );
}
