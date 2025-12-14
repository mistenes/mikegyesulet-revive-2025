import { useEffect, useState } from "react";
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
import StarterKit from '@tiptap/starter-kit';
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getSubscribers, sendNewsletter, type Subscriber } from "@/services/newsletterService";
import { toast } from "sonner";
import { Loader2, Send, Bold, Italic, List, ListOrdered, Code, Eye, FileCode } from "lucide-react";

export default function AdminNewsletter() {
    const { session } = useAdminAuthGuard();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [subject, setSubject] = useState("");
    const [testEmail, setTestEmail] = useState("");

    const [mode, setMode] = useState<"visual" | "html">("visual");
    const [rawHtml, setRawHtml] = useState("");

    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p>Kedves Feliratkozó!</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none w-full focus:outline-none min-h-[300px] border border-input rounded-md p-4 bg-background',
            },
        },
    });

    // Update raw HTML when entering HTML mode
    const toggleMode = (checked: boolean) => {
        const newMode = checked ? "html" : "visual";
        if (newMode === "html") {
            setRawHtml(editor?.getHTML() || "");
        } else {
            editor?.commands.setContent(rawHtml);
        }
        setMode(newMode);
    };

    useEffect(() => {
        if (session) {
            loadSubscribers();
        }
    }, [session]);

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

    const handleSend = async (isTest: boolean) => {
        const content = mode === "html" ? rawHtml : editor?.getHTML();

        if (!content || !content.trim() || !subject.trim()) {
            toast.error("A tárgy és a tartalom megadása kötelező");
            return;
        }

        if (isTest && !testEmail && !session?.email) {
            toast.error("Teszt email cím megadása kötelező (vagy be kell jelentkezni)");
            return;
        }

        setSending(true);
        try {
            const targetEmail = isTest ? (testEmail || session?.email) : undefined;
            const result = await sendNewsletter(subject, content, targetEmail);

            if (isTest) {
                toast.success(`Teszt email elküldve ide: ${targetEmail}`);
            } else {
                toast.success(`Hírlevél elküldve! Kiküldve: ${result.stats?.sent || 0}, Hiba: ${result.stats?.failed || 0}`);
            }
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Hiba a küldés során");
        } finally {
            setSending(false);
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
                        <TabsTrigger value="send">Hírlevél küldése</TabsTrigger>
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

                    <TabsContent value="send" className="space-y-4">
                        <Card className="p-6 space-y-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Tárgy</Label>
                                    <Input
                                        placeholder="Hírlevél tárgya..."
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Tartalom</Label>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="mode-switch" className="text-sm font-medium cursor-pointer">
                                                {mode === "visual" ? "Vizuális szerkesztő" : "HTML szerkesztő"}
                                            </Label>
                                            <Switch
                                                id="mode-switch"
                                                checked={mode === "html"}
                                                onCheckedChange={toggleMode}
                                            />
                                        </div>
                                    </div>

                                    {mode === "visual" ? (
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
                                    ) : (
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
