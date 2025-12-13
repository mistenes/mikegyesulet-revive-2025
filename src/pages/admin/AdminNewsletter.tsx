import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  CreateNewsletterCampaignInput,
  createNewsletterCampaign,
  fetchNewsletterOverview,
  type NewsletterCampaign,
  type NewsletterList,
} from "@/services/newsletterService";
import { convertHtmlToMarkdown, renderMarkdown } from "@/utils/markdown";
import { cn } from "@/lib/utils";
import { Loader2, MailCheck, Send, Sparkles, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

function NewsletterRichTextEditor({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [lastValue, setLastValue] = useState(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-5" } },
        codeBlock: { HTMLAttributes: { class: "rounded-md bg-muted/60 p-3 font-mono text-sm" } },
      }),
      Placeholder.configure({ placeholder: placeholder || "Írd meg a hírlevél tartalmát" }),
    ],
    content: value ? renderMarkdown(value) : "",
    editable: !disabled,
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      const { markdown } = convertHtmlToMarkdown(html);
      if (markdown === lastValue) return;
      setLastValue(markdown);
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastValue) return;
    setLastValue(value);
    editor.commands.setContent(value ? renderMarkdown(value) : "", false);
  }, [editor, value, lastValue]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const focusEditor = () => editor?.chain().focus().run();

  const isActive = (name: string, attrs?: Record<string, unknown>) => editor?.isActive(name, attrs);

  return (
    <div
      className="space-y-3"
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button")) return;
        focusEditor();
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="icon"
          variant={isActive("bold") ? "secondary" : "outline"}
          className="h-9 w-9"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor || disabled}
          aria-label="Félkövér"
        >
          <strong className="text-sm">B</strong>
        </Button>
        <Button
          type="button"
          size="icon"
          variant={isActive("italic") ? "secondary" : "outline"}
          className="h-9 w-9 italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor || disabled}
          aria-label="Dőlt"
        >
          I
        </Button>
        <Button
          type="button"
          size="icon"
          variant={isActive("strike") ? "secondary" : "outline"}
          className="h-9 w-9"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={!editor || disabled}
          aria-label="Áthúzott"
        >
          <span className="line-through">S</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant={isActive("bulletList") ? "secondary" : "outline"}
          className="h-9 w-9"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor || disabled}
          aria-label="Listajel"
        >
          •
        </Button>
        <Button
          type="button"
          size="icon"
          variant={isActive("orderedList") ? "secondary" : "outline"}
          className="h-9 w-9"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor || disabled}
          aria-label="Számozott lista"
        >
          1.
        </Button>
        <Button
          type="button"
          size="icon"
          variant={isActive("codeBlock") ? "secondary" : "outline"}
          className="h-9 w-9"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          disabled={!editor || disabled}
          aria-label="Kódrészlet"
        >
          {'</>'}
        </Button>
      </div>
      <div className={cn("rounded-lg border bg-muted/40", disabled ? "opacity-70" : "")}>
        <EditorContent editor={editor} className="min-h-[260px] prose max-w-none px-4 py-3" />
      </div>
    </div>
  );
}

export default function AdminNewsletter() {
  const { isLoading, session } = useAdminAuthGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [lists, setLists] = useState<NewsletterList[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [form, setForm] = useState<Omit<CreateNewsletterCampaignInput, "html" | "text"> & { content: string }>(
    () => ({
      subject: "",
      name: "",
      preheader: "",
      listIds: [],
      sendNow: true,
      content: "",
    }),
  );

  useEffect(() => {
    if (!session && !isLoading) return;
    if (!session) return;
    void loadOverview();
  }, [session, isLoading]);

  useEffect(() => {
    if (!lists.length || form.listIds?.length) return;
    const defaultListId = lists[0]?.id;
    if (defaultListId) {
      setForm((prev) => ({ ...prev, listIds: [defaultListId] }));
    }
  }, [lists, form.listIds]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const overview = await fetchNewsletterOverview();
      setConfigured(overview.configured);
      setStatusMessage(overview.message);
      setLists(overview.lists || []);
      setCampaigns(overview.campaigns || []);
      if (!form.listIds?.length && (overview.defaultListId || overview.lists?.length)) {
        const defaultListId = overview.defaultListId || overview.lists[0]?.id;
        if (defaultListId) {
          setForm((prev) => ({ ...prev, listIds: [defaultListId] }));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült lekérni a hírlevél adatokat";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (sendNow: boolean) => {
    if (!form.subject.trim() || !form.content.trim()) {
      toast.error("Add meg a tárgyat és a tartalmat");
      return;
    }

    setSaving(true);
    try {
      const html = renderMarkdown(form.content);
      const { text } = convertHtmlToMarkdown(html);
      const payload: CreateNewsletterCampaignInput = {
        subject: form.subject,
        name: form.name,
        preheader: form.preheader,
        listIds: form.listIds,
        html,
        text,
        sendNow,
      };

      const campaign = await createNewsletterCampaign(payload);
      toast.success(sendNow ? "Hírlevél elküldve" : "Vázlat elmentve");
      setCampaigns((prev) => [campaign, ...prev].slice(0, 12));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült menteni a hírlevelet";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const headerDescription = useMemo(() => {
    if (!configured) return statusMessage || "Állítsd be a Listmonk hitelesítést a hírlevél kezeléséhez.";
    return "Készíts és küldj hírleveleket a Listmonk fiókoddal.";
  }, [configured, statusMessage]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            <MailCheck className="h-6 w-6 text-primary" /> Hírlevél
          </h1>
          <p className="text-muted-foreground">{headerDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadOverview()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Frissítés"}
          </Button>
        </div>
      </div>

      {!configured ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Beállítás szükséges</CardTitle>
            <CardDescription>
              Add meg a Listmonk elérhetőségét és hitelesítést a környezeti változók között, majd válaszd ki az alapértelmezett
              listát.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Új hírlevél</CardTitle>
              <CardDescription>Írd meg a tárgyat, válassz listát és szerkeszd a tartalmat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Tárgy</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Havi hírlevél"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Belső név</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Áprilisi kiadás"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preheader">Előnézet szöveg</Label>
                <Input
                  id="preheader"
                  value={form.preheader}
                  onChange={(e) => setForm((prev) => ({ ...prev, preheader: e.target.value }))}
                  placeholder="Rövid bevezető az e-mail listához"
                />
              </div>

              <div className="space-y-2">
                <Label>Listák</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {lists.map((list) => {
                    const checked = form.listIds?.includes(list.id) ?? false;
                    return (
                      <label
                        key={list.id}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer",
                          checked ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(state) => {
                                setForm((prev) => {
                                  const current = new Set(prev.listIds || []);
                                  if (state) {
                                    current.add(list.id);
                                  } else {
                                    current.delete(list.id);
                                  }
                                  return { ...prev, listIds: Array.from(current) };
                                });
                              }}
                            />
                            <span className="font-medium">{list.name}</span>
                          </div>
                          {list.subscriber_count !== undefined ? (
                            <p className="text-xs text-muted-foreground">{list.subscriber_count} feliratkozó</p>
                          ) : null}
                        </div>
                        <Badge variant="outline">ID: {list.id}</Badge>
                      </label>
                    );
                  })}
                  {!lists.length ? <p className="text-sm text-muted-foreground">Nincs elérhető lista</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-base">Tartalom</Label>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" /> Formázott szerkesztő
                  </Badge>
                </div>
                <NewsletterRichTextEditor
                  value={form.content}
                  onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                  disabled={saving}
                  placeholder="Írd be a hírlevél tartalmát, címsorokkal és listákkal."
                />
              </div>

              <Separator />
              <div className="flex flex-wrap gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={saving || loading}
                  className="gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SquarePen className="h-4 w-4" />} Vázlat
                  mentése
                </Button>
                <Button type="button" onClick={() => handleSubmit(true)} disabled={saving || loading} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Hírlevél
                  küldése
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legutóbbi kampányok</CardTitle>
              <CardDescription>A legfrissebb kampányok és státuszuk.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Betöltés...
                </div>
              ) : campaigns.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Név</TableHead>
                      <TableHead>Tárgy</TableHead>
                      <TableHead>Státusz</TableHead>
                      <TableHead>Dátum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name || campaign.subject}</TableCell>
                        <TableCell>{campaign.subject}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "running" ? "default" : "outline"}>{campaign.status || "-"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {campaign.updated_at?.slice(0, 10) || campaign.created_at?.slice(0, 10) || ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Még nincs kampány mentve.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
