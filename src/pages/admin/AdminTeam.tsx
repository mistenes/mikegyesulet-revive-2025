import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, GripVertical, Pencil, Trash, Save, X, Image as ImageIcon, Crop } from "lucide-react";
import { toast } from "sonner";
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
  type TeamMember,
  type TeamMemberInput,
} from "@/services/teamService";
import { uploadToImageKit } from "@/services/imageKitService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const CROPPER_FRAME_SIZE = 240;

async function createCroppedSquareImage(sourceDataUrl: string, zoom: number, offsetX: number, offsetY: number): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nem sikerült beolvasni a képet"));
    img.src = sourceDataUrl;
  });

  const cropArea = Math.min(image.width, image.height) / zoom;
  const maxX = Math.max(0, image.width - cropArea);
  const maxY = Math.max(0, image.height - cropArea);
  const clampedX = Math.min(Math.max(offsetX, 0), maxX);
  const clampedY = Math.min(Math.max(offsetY, 0), maxY);

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 600;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("A képszerkesztéshez szükséges canvas nem érhető el");
  }

  context.drawImage(image, clampedX, clampedY, cropArea, cropArea, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Nem sikerült elkészíteni a kivágott képet"));
        return;
      }
      resolve(result);
    }, "image/jpeg", 0.92);
  });

  return new File([blob], `team-member-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export default function AdminTeam() {
  const { session } = useAdminAuthGuard();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SectionKey>("leadership");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<TeamMemberInput>(emptyMember);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [rawImageDataUrl, setRawImageDataUrl] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 1, height: 1 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) {
      loadMembers();
    }
  }, [session]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      setMembers(await getTeamMembers());
    } catch {
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
      sort_order: member.sort_order,
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
        setMembers((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
        toast.success("Tag frissítve");
      } else {
        const sectionMembers = members.filter((member) => member.section === formData.section);
        const maxOrder = sectionMembers.length ? Math.max(...sectionMembers.map((member) => member.sort_order)) : 0;
        const created = await createTeamMember({ ...formData, sort_order: maxOrder + 1 });
        setMembers((prev) => [...prev, created]);
        toast.success("Tag létrehozva");
      }
      setIsModalOpen(false);
    } catch {
      toast.error("Mentés sikertelen");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a tagot?")) return;

    try {
      await deleteTeamMember(id);
      setMembers((prev) => prev.filter((member) => member.id !== id));
      toast.success("Törölve");
    } catch {
      toast.error("Törlés sikertelen");
    }
  };

  const resetCropState = () => {
    setRawImageDataUrl("");
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setImageNaturalSize({ width: 1, height: 1 });
  };

  const handleImageSelected = async (file?: File) => {
    if (!file) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Nem sikerült beolvasni a fájlt"));
      reader.readAsDataURL(file);
    }).catch(() => "");

    if (!dataUrl) {
      toast.error("Nem sikerült betölteni a kiválasztott képet");
      return;
    }

    setRawImageDataUrl(dataUrl);
    setIsCropDialogOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropAndUpload = async () => {
    if (!rawImageDataUrl) return;

    setUploading(true);
    try {
      const croppedFile = await createCroppedSquareImage(rawImageDataUrl, cropZoom, cropOffsetX, cropOffsetY);
      const uploaded = await uploadToImageKit(croppedFile);
      setFormData((prev) => ({ ...prev, image_url: uploaded.url }));
      setIsCropDialogOpen(false);
      resetCropState();
      toast.success("Profilkép feltöltve és kivágva");
    } catch (error) {
      console.error(error);
      toast.error("Képfeltöltés vagy vágás sikertelen");
    } finally {
      setUploading(false);
    }
  };

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragOver = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggedMember = members.find((member) => member.id === draggingId);
    const targetMember = members.find((member) => member.id === targetId);

    if (!draggedMember || !targetMember || draggedMember.section !== targetMember.section) return;

    const sectionMembers = members.filter((member) => member.section === activeTab).sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sectionMembers.findIndex((member) => member.id === draggingId);
    const targetIndex = sectionMembers.findIndex((member) => member.id === targetId);
    if (currentIndex === -1 || targetIndex === -1) return;

    const reordered = [...sectionMembers];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const withOrder = reordered.map((member, index) => ({ ...member, sort_order: index + 1 }));
    setMembers((prev) => prev.map((member) => withOrder.find((candidate) => candidate.id === member.id) || member));
  };

  const handleDragEnd = async () => {
    if (!draggingId) return;
    setDraggingId(null);

    const sectionMembers = members.filter((member) => member.section === activeTab).sort((a, b) => a.sort_order - b.sort_order);

    try {
      await reorderTeamMembers(activeTab, sectionMembers.map((member) => member.id));
    } catch {
      toast.error("Sorrend mentése sikertelen");
      loadMembers();
    }
  };

  const activeMembers = useMemo(
    () => members.filter((member) => member.section === activeTab).sort((a, b) => a.sort_order - b.sort_order),
    [members, activeTab],
  );

  if (!session) return null;

  const cropAreaSize = Math.min(imageNaturalSize.width, imageNaturalSize.height) / cropZoom;
  const maxOffsetX = Math.max(0, imageNaturalSize.width - cropAreaSize);
  const maxOffsetY = Math.max(0, imageNaturalSize.height - cropAreaSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Csapat kezelése</h1>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Új tag
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SectionKey)}>
          <TabsList className="flex flex-wrap h-auto">
            {(Object.keys(SECTIONS) as SectionKey[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {SECTIONS[key]}
                <Badge variant="secondary" className="ml-2">
                  {members.filter((member) => member.section === key).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(SECTIONS) as SectionKey[]).map((sectionKey) => (
            <TabsContent key={sectionKey} value={sectionKey}>
              <Card className="p-4 md:p-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeMembers.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">Nincs tag ebben a szekcióban.</div>
                    ) : (
                      activeMembers.map((member) => (
                        <div
                          key={member.id}
                          draggable
                          onDragStart={() => handleDragStart(member.id)}
                          onDragOver={(event) => handleDragOver(event, member.id)}
                          onDragEnd={handleDragEnd}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/40 transition-colors"
                        >
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

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
          ))}
        </Tabs>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Tag szerkesztése" : "Új tag hozzáadása"}</DialogTitle>
              <DialogDescription>{SECTIONS[activeTab]} szekcióba</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                    {formData.image_url ? <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? <Loader2 className="animate-spin text-white" /> : <Pencil className="text-white" />}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(event) => handleImageSelected(event.target.files?.[0])}
                  />
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">Kép kiválasztása után nagyítás + körkivágás előnézet jelenik meg.</p>

              <div className="space-y-2">
                <Label>Név</Label>
                <Input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Pozíció</Label>
                <Input value={formData.position} onChange={(event) => setFormData({ ...formData, position: event.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Mégse
              </Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Mentés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isCropDialogOpen}
          onOpenChange={(open) => {
            setIsCropDialogOpen(open);
            if (!open) resetCropState();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crop className="h-5 w-5" /> Kép kivágása
              </DialogTitle>
              <DialogDescription>Állítsd be a kivágást, így látod pontosan mi jelenik meg a tag profilképén.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="mx-auto relative rounded-full overflow-hidden border" style={{ width: CROPPER_FRAME_SIZE, height: CROPPER_FRAME_SIZE }}>
                {rawImageDataUrl && (
                  <img
                    src={rawImageDataUrl}
                    alt="Crop source"
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      setImageNaturalSize({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
                    }}
                    style={{
                      width: `${((imageNaturalSize.width / cropAreaSize) * CROPPER_FRAME_SIZE).toFixed(2)}px`,
                      height: `${((imageNaturalSize.height / cropAreaSize) * CROPPER_FRAME_SIZE).toFixed(2)}px`,
                      transform: `translate(${-((cropOffsetX / cropAreaSize) * CROPPER_FRAME_SIZE).toFixed(2)}px, ${-((cropOffsetY / cropAreaSize) * CROPPER_FRAME_SIZE).toFixed(2)}px)`,
                      transformOrigin: "top left",
                      maxWidth: "none",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Nagyítás ({cropZoom.toFixed(2)}x)</Label>
                <Slider value={[cropZoom]} min={1} max={3} step={0.01} onValueChange={(value) => setCropZoom(value[0] ?? 1)} />
              </div>

              <div className="space-y-2">
                <Label>Vízszintes pozíció</Label>
                <Slider value={[cropOffsetX]} min={0} max={maxOffsetX || 0} step={1} onValueChange={(value) => setCropOffsetX(value[0] ?? 0)} />
              </div>

              <div className="space-y-2">
                <Label>Függőleges pozíció</Label>
                <Slider value={[cropOffsetY]} min={0} max={maxOffsetY || 0} step={1} onValueChange={(value) => setCropOffsetY(value[0] ?? 0)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCropDialogOpen(false)} disabled={uploading}>
                <X className="h-4 w-4 mr-2" /> Mégse
              </Button>
              <Button onClick={handleCropAndUpload} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Kivágás és feltöltés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
