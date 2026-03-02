import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_ROBOTS = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /`;

export default function AdminSeoRobots() {
  const [content, setContent] = useState("");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    try {
      const { data, error } = await supabase
        .from("seo_robots_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      setContent(data.robots_content);
      setRecordId(data.id);
    } catch (error) {
      console.error("Error fetching robots:", error);
      setContent(DEFAULT_ROBOTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (recordId) {
        const { error } = await supabase
          .from("seo_robots_settings")
          .update({ robots_content: content })
          .eq("id", recordId);
        if (error) throw error;
      }
      toast.success("Robots.txt beállítások mentve!");
    } catch (error) {
      console.error("Error saving:", error);
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
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Robots.txt
            </h1>
            <p className="text-muted-foreground">
              Keresőmotorok hozzáférésének szabályozása
            </p>
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
              placeholder="User-agent: *&#10;Allow: /"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Mentés...</>
                ) : (
                  <><Save className="h-4 w-4" /> Mentés</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setContent(DEFAULT_ROBOTS)}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Alapértelmezett
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong>Tipp:</strong> A robots.txt fájl szabályozza, hogy a keresőmotorok melyik oldalakat indexelhetik. 
            Az "Allow: /" engedélyezi az összes oldal indexelését, a "Disallow: /admin" pedig letiltja az admin oldalak indexelését.
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
}
