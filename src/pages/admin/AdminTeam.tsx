import { useEffect, useState, useRef, type DragEvent } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, GripVertical, Pencil, Trash, Save, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
    getTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    reorderTeamMembers,
    type TeamMember,
    type TeamMemberInput
} from "@/services/teamService";
import { uploadToImageKit } from "@/services/imageKitService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const SECTIONS = {
    leadership: "Elnökség",
    standing_committee: "Állandó Bizottság",
    supervisory_board: "Felügyelőbizottság",
    hyca: "HYCA",
    hyca_supervisory_board: "HYCA Felügyelő Bizottság",
    operational_team: "Operatív Csapat",
};

type SectionKey = keyof typeof SECTIONS;

const emptyMember: TeamMemberInput = {
    name: "",
    position: "",
    email: "",
    section: "leadership",
    image_url: "",
};

export default function AdminTeam() {
    const { session } = useAdminAuthGuard();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SectionKey>("leadership");
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [formData, setFormData] = useState<TeamMemberInput>(emptyMember);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (session) {
            loadMembers();
        }
    }, [session]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const data = await getTeamMembers();
            setMembers(data);
        } catch (e) {
            toast.error("Nem sikerült betölteni a tagokat");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingMember(null);
        setFormData({ ...emptyMember, section: activeTab });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (member: TeamMember) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            position: member.position,
            email: member.email,
            section: member.section,
            image_url: member.image_url,
            sort_order: member.sort_order
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("A név megadása kötelező");
            return;
        }

        setSaving(true);
        try {
            if (editingMember) {
                const updated = await updateTeamMember(editingMember.id, formData);
                setMembers(members.map(m => m.id === updated.id ? updated : m));
                toast.success("Tag frissítve");
            } else {
                // Calculate next sort order for this section
                const sectionMembers = members.filter(m => m.section === formData.section);
                const maxOrder = sectionMembers.length > 0 ? Math.max(...sectionMembers.map(m => m.sort_order)) : 0;

                const created = await createTeamMember({ ...formData, sort_order: maxOrder + 1 });
                setMembers([...members, created]);
                toast.success("Tag létrehozva");
            }
            setIsModalOpen(false);
        } catch (e) {
            toast.error("Mentés sikertelen");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Biztosan törölni szeretnéd ezt a tagot?")) return;
        try {
            await deleteTeamMember(id);
            setMembers(members.filter(m => m.id !== id));
            toast.success("Törölve");
        } catch (e) {
            toast.error("Törlés sikertelen");
        }
    };

    const handleImageUpload = async (file?: File) => {
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadToImageKit(file);
            setFormData(prev => ({ ...prev, image_url: url }));
            toast.success("Kép feltöltve");
        } catch (e) {
            console.error(e);
            toast.error("Képfeltöltés sikertelen");
        } finally {
            setUploading(false);
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (id: string) => setDraggingId(id);

    const handleDragOver = (event: DragEvent<HTMLDivElement>, targetId: string) => {
        event.preventDefault();
        if (!draggingId || draggingId === targetId) return;

        // Only allow sorting within same section
        const draggedMember = members.find(m => m.id === draggingId);
        const targetMember = members.find(m => m.id === targetId);

        if (!draggedMember || !targetMember || draggedMember.section !== targetMember.section) return;

        // Local reorder for visual feedback
        const sectionMembers = members.filter(m => m.section === activeTab).sort((a, b) => a.sort_order - b.sort_order);
        const currentIndex = sectionMembers.findIndex(m => m.id === draggingId);
        const targetIndex = sectionMembers.findIndex(m => m.id === targetId);

        if (currentIndex === -1 || targetIndex === -1) return;

        const newOrder = [...sectionMembers];
        const [moved] = newOrder.splice(currentIndex, 1);
        newOrder.splice(targetIndex, 0, moved);

        // Initial update of sort_order property
        const reorderedSection = newOrder.map((m, idx) => ({ ...m, sort_order: idx + 1 }));

        // Merge back into main list
        const otherMembers = members.filter(m => m.section !== activeTab);
        setMembers([...otherMembers, ...reorderedSection]);
    };

    const handleDrop = async () => {
        if (!draggingId) return;
        setDraggingId(null);

        // Persist to backend
        const sectionMembers = members.filter(m => m.section === activeTab).sort((a, b) => a.sort_order - b.sort_order);
        try {
            await reorderTeamMembers(sectionMembers.map(m => ({ id: m.id, sort_order: m.sort_order })));
            toast.success("Sorrend mentve");
        } catch (e) {
            toast.error("Nem sikerült menteni a sorrendet");
            loadMembers(); // Revert on error
        }
    };

    const filteredMembers = members
        .filter(m => m.section === activeTab)
        .sort((a, b) => a.sort_order - b.sort_order);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                        Csapat kezelése
                    </h1>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Új tag hozzáadása
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SectionKey)}>
                    <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0">
                        {Object.entries(SECTIONS).map(([key, label]) => (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-card"
                            >
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        <Card className="p-6">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredMembers.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">Nincs még tag ebben a szekcióban.</div>
                                    ) : (
                                        filteredMembers.map(member => (
                                            <div
                                                key={member.id}
                                                className={`flex items-center gap-4 p-3 border rounded-lg bg-card hover:shadow-sm transition-all ${draggingId === member.id ? 'opacity-50' : ''}`}
                                                draggable
                                                onDragStart={() => handleDragStart(member.id)}
                                                onDragOver={(e) => handleDragOver(e, member.id)}
                                                onDrop={handleDrop}
                                            >
                                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />

                                                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                                                    {member.image_url ? (
                                                        <img src={member.image_url} alt={member.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground font-bold">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{member.name}</h4>
                                                    <div className="text-sm text-muted-foreground flex gap-3">
                                                        <span>{member.position}</span>
                                                        {member.email && <span>• {member.email}</span>}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(member)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(member.id)}>
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingMember ? "Tag szerkesztése" : "Új tag hozzáadása"}</DialogTitle>
                            <DialogDescription>
                                {SECTIONS[activeTab]} szekcióba
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {uploading ? <Loader2 className="animate-spin text-white" /> : <Pencil className="text-white" />}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files?.[0])}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Név</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Pozíció</Label>
                                <Input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Mégse</Button>
                            <Button onClick={handleSave} disabled={saving || uploading}>
                                {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Mentés
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
