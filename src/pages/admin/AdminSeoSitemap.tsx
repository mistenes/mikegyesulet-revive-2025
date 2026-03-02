import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapIcon, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const PAGES = [
  { path: "/", name: "Főoldal", priority: "1.0", changefreq: "weekly" },
  { path: "/rolunk", name: "Rólunk", priority: "0.8", changefreq: "monthly" },
  { path: "/regiok", name: "Régiók", priority: "0.8", changefreq: "monthly" },
  { path: "/kapcsolat", name: "Kapcsolat", priority: "0.7", changefreq: "monthly" },
  { path: "/dokumentumok", name: "Dokumentumok", priority: "0.6", changefreq: "monthly" },
  { path: "/projektek", name: "Projektek", priority: "0.7", changefreq: "weekly" },
  { path: "/galeria", name: "Galéria", priority: "0.6", changefreq: "weekly" },
];

export default function AdminSeoSitemap() {
  const [baseUrl, setBaseUrl] = useState("https://mikegyesulet-revive-2025.lovable.app");
  const [pages, setPages] = useState(PAGES);
  const [copied, setCopied] = useState(false);

  const updatePage = (index: number, field: string, value: string) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const generateSitemap = () => {
    const urls = pages
      .map(
        (p) => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateSitemap());
    setCopied(true);
    toast.success("Sitemap vágólapra másolva!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateSitemap()], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sitemap letöltve!");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl">
            <MapIcon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Sitemap generátor
            </h1>
            <p className="text-muted-foreground">
              XML sitemap generálása a keresőmotorok számára
            </p>
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alap URL</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-3">
              <Label>Oldalak</Label>
              {pages.map((page, i) => (
                <div key={page.path} className="grid grid-cols-4 gap-2 items-center">
                  <div className="flex items-center gap-2 col-span-1">
                    <span className="text-sm font-medium text-foreground truncate">{page.name}</span>
                    <span className="text-xs text-muted-foreground">{page.path}</span>
                  </div>
                  <Select value={page.priority} onValueChange={(v) => updatePage(i, "priority", v)}>
                    <SelectTrigger className="col-span-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={page.changefreq} onValueChange={(v) => updatePage(i, "changefreq", v)}>
                    <SelectTrigger className="col-span-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Label className="mb-2 block">Előnézet</Label>
          <pre className="bg-muted/50 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto text-foreground">
            {generateSitemap()}
          </pre>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleCopy} variant="outline" className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Másolva!" : "Másolás"}
            </Button>
            <Button onClick={handleDownload} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Download className="h-4 w-4" /> Letöltés (sitemap.xml)
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
