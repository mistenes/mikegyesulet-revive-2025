import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEditor, EditorContent } from '@tiptap/react';
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";
import { getSubscribers, sendNewsletter, type Subscriber, getDraft, saveDraft, listDesignsFromBunny, saveDesignToBunny, loadDesignFromBunny, deleteDesignFromBunny } from "@/services/newsletterService";
import { toast } from "sonner";
import { Loader2, Send, Bold, Italic, List, ListOrdered, Code, Eye, FileCode, Save, Plus, Trash2, FileJson } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import StarterKit from '@tiptap/starter-kit';

export default function AdminNewsletter() {
    const { session } = useAdminAuthGuard();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [subject, setSubject] = useState("");
    const [testEmail, setTestEmail] = useState("");
    const [currentFilename, setCurrentFilename] = useState<string | null>(null);
    const [savedDesigns, setSavedDesigns] = useState<string[]>([]);
    const [loadingDesigns, setLoadingDesigns] = useState(false);
    const [newDesignName, setNewDesignName] = useState("");

    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [savingDraft, setSavingDraft] = useState(false);

    const [mode, setMode] = useState<"visual" | "html" | "builder">("visual");
    const [rawHtml, setRawHtml] = useState("");
    const emailEditorRef = useRef<EditorRef>(null);

    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p>Kedves Feliratkozó!</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none w-full focus:outline-none min-h-[300px] border border-input rounded-md p-4 bg-background',
            },
        },
        onUpdate: ({ editor }) => {
            // Autosave for visual editor
            if (mode === "visual") {
                autoSaveDraft(subject, null, editor.getHTML());
            }
        }
    });

    const autoSaveDraft = useDebouncedCallback(async (currSubject: string, currJson: any, currHtml: string) => {
        setSavingDraft(true);
        try {
            // Priority: Save to Bunny if we have a filename
            if (currentFilename) {
                await saveDesignToBunny(currentFilename, {
                    subject: currSubject,
                    content_json: currJson,
                    content_html: currHtml
                });
            } else {
                // Fallback to old DB draft
                await saveDraft({
                    subject: currSubject,
                    content_json: currJson,
                    content_html: currHtml
                });
            }

            setLastSaved(new Date());
        } catch (err) {
            console.error("Autosave failed", err);
        } finally {
            setSavingDraft(false);
        }
    }, 2000);

    // Update raw HTML when entering HTML mode
    const toggleMode = (value: string) => {
        // Sync logic before switching
        if (mode === "visual") {
            // If going away from visual, maybe capture content?
            // But 'rawHtml' is the source of truth for sending in HTML mode.
            // Visual editor content is in `editor`.
        }

        const newMode = value as "visual" | "html" | "builder";

        if (newMode === "html" && mode === "visual") {
            setRawHtml(editor?.getHTML() || "");
        } else if (newMode === "visual" && mode === "html") {
            editor?.commands.setContent(rawHtml);
        }

        setMode(newMode);
    };

    const [draftJson, setDraftJson] = useState<any>(null);

    const onLoad: EmailEditorProps['onLoad'] = (unlayer) => {
        // Custom branding
        // Primary color: #FF4524 (from hsl(14 100% 57%))
        // Background: #FFFFFF
        // Text: #333333
        // You can customize more here
        unlayer.addEventListener('design:updated', () => {
            unlayer.exportHtml((data) => {
                autoSaveDraft(subject, data.design, data.html); // Also saving HTML preview
            });
        });

        if (draftJson) {
            unlayer.loadDesign(draftJson);
        }
    };

    useEffect(() => {
        if (session) {
            loadSubscribers();
            loadDraft(); // Still load DB draft initially as fallback
            loadDesigns();
        }
    }, [session]);

    const loadDesigns = async () => {
        setLoadingDesigns(true);
        try {
            const list = await listDesignsFromBunny();
            setSavedDesigns(list);
        } catch (e) {
            console.error("Failed to list designs", e);
            toast.error("Nem sikerült betölteni a mentett terveket");
        } finally {
            setLoadingDesigns(false);
        }
    };

    const handleCreateDesign = async () => {
        if (!newDesignName.trim()) return;

        try {
            const filename = newDesignName.trim();
            // Create empty design
            await saveDesignToBunny(filename, {
                subject: "Új hírlevél",
                content_html: "<p>Kezdd el itt...</p>",
                content_json: null
            });

            await loadDesigns();
            setNewDesignName("");
            handleLoadDesign(filename.endsWith('.json') ? filename : `${filename}.json`);
            toast.success("Design létrehozva!");
        } catch (e) {
            toast.error("Hiba a létrehozáskor");
        }
    };

    const handleLoadDesign = async (filename: string) => {
        try {
            const data = await loadDesignFromBunny(filename);
            setCurrentFilename(filename);
            setSubject(data.subject);

            if (data.content_html) {
                setRawHtml(data.content_html);
                editor?.commands.setContent(data.content_html);
            }

            if (data.content_json) {
                setDraftJson(data.content_json);
                // If editor is already loaded, reload design
                if (emailEditorRef.current) {
                    emailEditorRef.current.editor.loadDesign(data.content_json);
                }
            } else {
                setDraftJson(null);
            }

            toast.success(`Betöltve: ${filename}`);
        } catch (e) {
            toast.error("Hiba a betöltéskor");
        }
    };

    const handleDeleteDesign = async (filename: string) => {
        if (!confirm(`Biztosan törölni szeretnéd: ${filename}?`)) return;
        try {
            await deleteDesignFromBunny(filename);
            await loadDesigns();
            if (currentFilename === filename) {
                setCurrentFilename(null);
            }
            toast.success("Törölve");
        } catch (e) {
            toast.error("Hiba a törléskor");
        }
    };

    const loadDraft = async () => {
        try {
            const draft = await getDraft();
            if (draft) {
                if (draft.subject) setSubject(draft.subject);
                if (draft.content_html) {
                    setRawHtml(draft.content_html);
                    editor?.commands.setContent(draft.content_html);
                }
                // If we have JSON content, we can't easily load it into unlayer until unlayer is mounted.
                // We will store it in a ref or state and load it when onLoad fires?
                // For now, let's just keep it in mind.
                // Actually, if we want to restore the builder state, we need to know if the last save was builder.
                // But since we have a unified draft with JSON, we can try to load it if user goes to builder.

                // Let's store the draft JSON in a state to load later
                if (draft.content_json) {
                    // We need a state for this
                    // setDraftJson(draft.content_json);
                    // But I'll just save it to ref for now if needed? No, state is better.
                    // I'll add `draftJson` state in next step or use existing mechanism.
                    // Actually, I can't add state here because `mode` definition is below/above.
                    // I will just use a temp workaround: store it in a ref in the component scope?
                    // Or I can just fetch it again when switching modes? No that's bad.
                    setDraftJson(draft.content_json);
                }
                if (draft.content_json && !draft.content_html) {
                    // If we have JSON but no HTML (or user prefers builder), we might want to switch mode?
                    // For now, let's update mode if JSON exists
                    // setMode("builder"); // Optional: auto-switch to builder if JSON exists
                }
            }
        } catch (e) {
            console.error("Failed to load draft", e);
        }
    };

    const loadSubscribers = async () => {
        setLoading(true);
        try {
            const items = await getSubscribers();
            setSubscribers(items);
        } catch (err) {
            console.error(err);
            toast.error("Hiba a feliratkozók betöltésekor");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = (isTest: boolean) => {
        const targetEmail = isTest ? (testEmail || session?.email) : undefined;

        const proceed = (htmlContent: string) => {
            if (!htmlContent || !htmlContent.trim() || !subject.trim()) {
                toast.error("A tárgy és a tartalom megadása kötelező");
                setSending(false);
                return;
            }

            if (isTest && !targetEmail) {
                toast.error("Teszt email cím megadása kötelező");
                setSending(false);
                return;
            }

            setSending(true);
            sendNewsletter(subject, htmlContent, targetEmail)
                .then((result) => {
                    if (isTest) {
                        toast.success(`Teszt email elküldve ide: ${targetEmail}`);
                    } else {
                        toast.success(`Hírlevél elküldve! Kiküldve: ${result.stats?.sent || 0}, Hiba: ${result.stats?.failed || 0}`);
                    }
                })
                .catch((e: any) => {
                    console.error(e);
                    toast.error(e.message || "Hiba a küldés során");
                })
                .finally(() => {
                    setSending(false);
                });
        };

        if (mode === "builder" && emailEditorRef.current) {
            setSending(true); // Start loading state while exporting
            emailEditorRef.current.editor.exportHtml((data) => {
                proceed(data.html);
            });
        } else if (mode === "html") {
            proceed(rawHtml);
        } else {
            proceed(editor?.getHTML() || "");
        }
    };

    const ToolbarButton = ({ onClick, isActive, children }: any) => (
        <Button
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className="h-8 w-8 p-0"
        >
            {children}
        </Button>
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Hírlevél kezelése
                </h1>

                <Tabs defaultValue="list">
                    <TabsList>
                        <TabsTrigger value="list">Feliratkozók</TabsTrigger>
                        <TabsTrigger value="designs">Mentett Tervek</TabsTrigger>
                        <TabsTrigger value="send">Szerkesztés & Küldés</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-4">
                        <Card className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Feliratkozók listája ({subscribers.length})</h3>
                                <Button variant="outline" size="sm" onClick={loadSubscribers} disabled={loading}>
                                    Frissítés
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Név</TableHead>
                                                <TableHead>Státusz</TableHead>
                                                <TableHead>Feliratkozva</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subscribers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                        Nincs még feliratkozó
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                subscribers.map((sub) => (
                                                    <TableRow key={sub.id}>
                                                        <TableCell className="font-medium">{sub.email}</TableCell>
                                                        <TableCell>{sub.name || "-"}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={sub.verified ? "default" : "secondary"}>
                                                                {sub.verified ? "Megerősítve" : "Függőben"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{new Date(sub.created_at).toLocaleDateString("hu-HU")}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="designs" className="space-y-4">
                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <h3 className="text-xl font-semibold">Mentett Tervek</h3>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Input
                                        placeholder="Új terv neve..."
                                        value={newDesignName}
                                        onChange={e => setNewDesignName(e.target.value)}
                                        className="max-w-[200px]"
                                    />
                                    <Button onClick={handleCreateDesign} disabled={loadingDesigns}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Új Létrehozása
                                    </Button>
                                </div>
                            </div>

                            {loadingDesigns ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {savedDesigns.length === 0 && <p className="text-muted-foreground p-4">Nincs mentett terv.</p>}
                                    {savedDesigns.map(name => (
                                        <div key={name} className={`border rounded-lg p-4 flex justify-between items-center ${currentFilename === name ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-muted p-2 rounded-md">
                                                    <FileJson className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <span className="font-medium truncate" title={name}>{name}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleLoadDesign(name)}>
                                                    Betöltés
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteDesign(name)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="send" className="space-y-4">
                        <Card className="p-6 space-y-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>Tárgy</Label>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {currentFilename ? (
                                                <Badge variant="outline" className="gap-1">
                                                    <FileJson className="h-3 w-3" />
                                                    {currentFilename}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Helyi Piszkozat (DB)</Badge>
                                            )}
                                            {savingDraft ? (
                                                <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Mentés...</span>
                                            ) : (
                                                <span>{lastSaved ? `Mentve: ${lastSaved.toLocaleTimeString()}` : 'Nem mentett'}</span>
                                            )}
                                        </div>
                                    </div>
                                    <Input
                                        placeholder="Hírlevél tárgya..."
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Tartalom</Label>
                                        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                                            <Button
                                                size="sm"
                                                variant={mode === "visual" ? "default" : "ghost"}
                                                onClick={() => toggleMode("visual")}
                                                className="h-7 text-xs"
                                            >
                                                Szöveges (Visual)
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={mode === "html" ? "default" : "ghost"}
                                                onClick={() => toggleMode("html")}
                                                className="h-7 text-xs"
                                            >
                                                HTML Kód
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={mode === "builder" ? "default" : "ghost"}
                                                onClick={() => toggleMode("builder")}
                                                className="h-7 text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                            >
                                                Drag & Drop Designer
                                            </Button>
                                        </div>
                                    </div>

                                    {mode === "visual" && (
                                        <div className="border rounded-md">
                                            <div className="flex items-center gap-1 border-b p-2 bg-muted/40">
                                                <ToolbarButton
                                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                                    isActive={editor?.isActive('bold')}
                                                >
                                                    <Bold className="h-4 w-4" />
                                                </ToolbarButton>
                                                <ToolbarButton
                                                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                                                    isActive={editor?.isActive('italic')}
                                                >
                                                    <Italic className="h-4 w-4" />
                                                </ToolbarButton>
                                                <ToolbarButton
                                                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                                    isActive={editor?.isActive('bulletList')}
                                                >
                                                    <List className="h-4 w-4" />
                                                </ToolbarButton>
                                                <ToolbarButton
                                                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                                    isActive={editor?.isActive('orderedList')}
                                                >
                                                    <ListOrdered className="h-4 w-4" />
                                                </ToolbarButton>
                                            </div>
                                            <EditorContent editor={editor} className="p-0" />
                                        </div>
                                    )}

                                    {mode === "html" && (
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileCode className="h-4 w-4" />
                                                    <span>HTML forráskód</span>
                                                </div>
                                                <Textarea
                                                    value={rawHtml}
                                                    onChange={(e) => setRawHtml(e.target.value)}
                                                    className="font-mono text-xs min-h-[300px]"
                                                    placeholder="<html>...</html>"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Eye className="h-4 w-4" />
                                                    <span>Előnézet</span>
                                                </div>
                                                <div className="border rounded-md p-4 bg-white min-h-[200px] overflow-auto max-h-[500px]">
                                                    <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {mode === "builder" && (
                                        <div className="border rounded-md overflow-hidden min-h-[600px] bg-white">
                                            <EmailEditor
                                                ref={emailEditorRef}
                                                onLoad={onLoad}
                                                minHeight="600px"
                                                options={{
                                                    appearance: {
                                                        theme: "light",
                                                        panels: {
                                                            tools: {
                                                                dock: 'left'
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t">
                                    <div className="flex-1 flex gap-2">
                                        <Input
                                            placeholder="Teszt email cím (üresen a sajátod)"
                                            value={testEmail}
                                            onChange={e => setTestEmail(e.target.value)}
                                        />
                                        <Button variant="secondary" onClick={() => handleSend(true)} disabled={sending}>
                                            {sending ? <Loader2 className="animate-spin h-4 w-4" /> : "Teszt küldése"}
                                        </Button>
                                    </div>
                                    <Button onClick={() => handleSend(false)} disabled={sending} className="md:w-auto w-full">
                                        {sending ? <Loader2 className="animate-spin h-4 w-4 margin-r-2" /> : <Send className="h-4 w-4 mr-2" />}
                                        Küldés mindenkinek
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
