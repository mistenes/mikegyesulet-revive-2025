import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// ImageKit configuration type
type ImageKitConfig = {
  publicKey: string;
  urlEndpoint: string;
};

const newsSchema = z.object({
  title: z.string().min(1, "A cím kötelező").max(200, "A cím maximum 200 karakter"),
  slug: z.string().min(1, "A slug kötelező").max(200, "A slug maximum 200 karakter"),
  excerpt: z.string().min(1, "A kivonat kötelező").max(500, "A kivonat maximum 500 karakter"),
  content: z.string().min(1, "A tartalom kötelező"),
  category: z.string().min(1, "A kategória kötelező"),
  image_url: z.string().url("Érvényes URL-t adj meg").optional().or(z.literal("")),
});

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  category: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export default function AdminNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image_url: "",
    category: "",
    published: false,
  });

  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchArticles();
    }
  }, [isAuthorized]);

  const checkSession = async () => {
    setIsCheckingSession(true);
    setAuthError(null);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        setAuthError("Be kell jelentkezned a hírek kezeléséhez.");
        return;
      }

      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roles) {
        await supabase.auth.signOut();
        setAuthError("Nincs admin jogosultságod a hírek kezeléséhez.");
        toast.error("Nincs admin jogosultságod");
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Session check error:", error);
      toast.error("Hiba történt a jogosultság ellenőrzésekor");
      setAuthError("Nem sikerült ellenőrizni a jogosultságot. Próbáld újra.");
    } finally {
      setIsCheckingSession(false);
    }
  };

  const fetchArticles = async () => {
    setIsFetching(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setArticles(data || []);
    } catch (error) {
      toast.error("Hiba a hírek betöltésekor");
      console.error(error);
      setFetchError("Nem sikerült betölteni a híreket. Frissítsd az oldalt vagy próbáld újra később.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      newsSchema.parse(formData);

      const articleData = {
        ...formData,
        published_at: formData.published ? new Date().toISOString() : null,
      };

      if (editingArticle) {
        const { error } = await supabase
          .from("news_articles")
          .update(articleData)
          .eq("id", editingArticle.id);

        if (error) throw error;
        toast.success("Hír frissítve!");
      } else {
        const { error } = await supabase
          .from("news_articles")
          .insert([articleData]);

        if (error) throw error;
        toast.success("Hír létrehozva!");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchArticles();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Hiba történt a mentés során");
        console.error(error);
      }
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      image_url: article.image_url || "",
      category: article.category,
      published: article.published,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a hírt?")) return;

    const { error } = await supabase
      .from("news_articles")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Hiba a törlés során");
      console.error(error);
    } else {
      toast.success("Hír törölve!");
      fetchArticles();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      image_url: "",
      category: "",
      published: false,
    });
    setEditingArticle(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájlokat lehet feltölteni');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A kép maximum 5MB lehet');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64File = reader.result;

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('Nem vagy bejelentkezve');
          setIsUploading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('upload-to-imagekit', {
          body: { file: base64File, folder: 'news' },
        });

        if (error) {
          console.error('Upload error:', error);
          toast.error('Hiba a képfeltöltés során');
        } else {
          setFormData({ ...formData, image_url: data.url });
          toast.success('Kép sikeresen feltöltve!');
        }

        setIsUploading(false);
      };

      reader.onerror = () => {
        toast.error('Hiba a fájl olvasása során');
        setIsUploading(false);
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Hiba a képfeltöltés során');
      setIsUploading(false);
    }
  };

  const renderUnauthorizedState = () => (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            {authError || "Bejelentkezés szükséges"}
          </h2>
          <p className="text-muted-foreground">
            Jelentkezz be az admin felületre, hogy szerkeszthesd a híreket. A gomb a bejelentkezési oldalra
            visz.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => {
              if (hasNavigatedRef.current) return;
              hasNavigatedRef.current = true;
              navigate("/auth");
            }}
            className="flex-1"
          >
            Ugrás a bejelentkezéshez
          </Button>
          <Button variant="outline" onClick={checkSession} className="flex-1">
            Újrapróbálás
          </Button>
        </div>
      </Card>
    </div>
  );

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Jogosultság ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return renderUnauthorizedState();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            Hírek kezelése
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Új hír
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? "Hír szerkesztése" : "Új hír létrehozása"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Cím *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategória *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="pl. MIK Hírek, Projektek, Események"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Kivonat *</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Tartalom *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Kép feltöltése</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="flex-1"
                    />
                  </div>
                  {isUploading && (
                    <p className="text-sm text-muted-foreground">Képfeltöltés...</p>
                  )}
                  {formData.image_url && (
                    <div className="space-y-2">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full max-w-xs rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                      >
                        Kép eltávolítása
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, published: checked })
                    }
                  />
                  <Label htmlFor="published">Publikálva</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingArticle ? "Frissítés" : "Létrehozás"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Mégse
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {fetchError && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <p className="text-destructive font-medium">{fetchError}</p>
            </Card>
          )}
          {isFetching && !articles.length && (
            <Card className="p-4">
              <p className="text-muted-foreground">Hírek betöltése folyamatban...</p>
            </Card>
          )}
          {articles.map((article) => (
            <Card key={article.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      {article.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        article.published
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {article.published ? "Publikálva" : "Vázlat"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(article.created_at).toLocaleDateString("hu-HU")}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(article)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
