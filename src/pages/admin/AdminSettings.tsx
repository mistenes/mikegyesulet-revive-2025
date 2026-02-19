import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Loader2, ShieldCheck, KeyRound, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSetting } from "@/services/settingsService";
import { fetchPublicSiteSettings, saveSiteSettings } from "@/services/siteSettingsService";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  getSecurityStatus,
  prepareMfa,
  confirmMfa,
  disableMfa,
  updatePassword,
  type SecurityStatus,
  type MfaPreparation,
} from "@/services/securityService";

export default function AdminSettings() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [security, setSecurity] = useState<SecurityStatus | null>(null);
  const [mfaSetup, setMfaSetup] = useState<MfaPreparation | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const mfaInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [mfaStep, setMfaStep] = useState<number | null>(null);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableRecovery, setDisableRecovery] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);
  const [siteSearchDescription, setSiteSearchDescription] = useState("");

  useEffect(() => {
    const settings = getSettings();
    const initial: Record<string, string | boolean> = {};
    Object.entries(settings.general).forEach(([key, setting]) => {
      initial[key] = setting.value;
    });

    const fallbackDescription = typeof initial.site_name === "string" && initial.site_name.trim()
      ? `${initial.site_name} – hivatalos weboldal`
      : "Magyar Ifjúsági Konferencia – hivatalos weboldal";

    fetchPublicSiteSettings()
      .then((siteSettings) => {
        setFormData((prev) => ({ ...prev, site_favicon: siteSettings.siteFavicon || prev.site_favicon || "" }));
        setSiteSearchDescription(siteSettings.siteSearchDescription || fallbackDescription);
      })
      .catch(() => {
        setSiteSearchDescription(fallbackDescription);
      })
      .finally(() => {
        setLoading(false);
      });

    setFormData(initial);
  }, []);

  useEffect(() => {
    async function loadSecurity() {
      try {
        const status = await getSecurityStatus();
        setSecurity(status);
      } catch (error) {
        toast.error((error as Error)?.message || "Nem sikerült lekérni a biztonsági adatokat");
      }
    }

    if (session) {
      loadSecurity();
    }
  }, [session]);

  useEffect(() => {
    setMfaCode("");
    setRecoveryCodeInput("");
    setRecoveryAcknowledged(false);
    setMfaStep(mfaSetup ? 1 : null);
  }, [mfaSetup]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      Object.entries(formData).forEach(([key, value]) => {
        updateSetting("general", key, value);
      });

      await saveSiteSettings({
        siteFavicon: String(formData.site_favicon || "").trim(),
        siteSearchDescription: siteSearchDescription.trim(),
      });

      toast.success("Beállítások elmentve!");
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Hiba a mentés során");
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (key: "site_logo" | "site_favicon", files?: FileList | null) => {
    if (!files || !files.length) return;
    const [file] = files;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [key]: reader.result as string }));
      if (fileInputRefs.current[key]) {
        fileInputRefs.current[key]!.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const handlePrepareMfa = async () => {
    try {
      const setup = await prepareMfa();
      setMfaSetup(setup);
      setMfaCode("");
      setRecoveryAcknowledged(false);
      setRecoveryCodeInput("");
      setMfaStep(1);
      toast.message("Olvasd be a QR-kódot, jegyezd fel a helyreállító kódokat, majd írd be a kódot a mentéshez");
    } catch (error) {
      toast.error((error as Error)?.message || "Nem sikerült előkészíteni az MFA-t");
    }
  };

  const handleConfirmMfa = async () => {
    if (!mfaSetup) {
      toast.error("Indítsd újra a beállítást");
      return;
    }

    if (!recoveryAcknowledged) {
      toast.error("Erősítsd meg, hogy elmentetted a helyreállító kódokat");
      return;
    }

    const normalizedRecovery = recoveryCodeInput.replace(/\s+/g, "").toUpperCase();
    const recoveryIsValid = mfaSetup.recoveryCodes.some(
      (code) => code.replace(/\s+/g, "").toUpperCase() === normalizedRecovery,
    );

    if (!recoveryIsValid) {
      toast.error("Írd be a megjelenített helyreállító kódok egyikét");
      return;
    }

    if (!mfaCode || mfaCode.length < 6) {
      toast.error("Add meg a 6 jegyű ellenőrző kódot");
      return;
    }

    setSecuritySaving(true);
    try {
      const result = await confirmMfa(mfaCode, normalizedRecovery);
      setSecurity((prev) => (prev ? { ...prev, enabled: true, recoveryCodesRemaining: result.recoveryCodes.length } : prev));
      setMfaSetup(null);
      setMfaStep(null);
      setMfaCode("");
      setRecoveryCodeInput("");
      setRecoveryAcknowledged(false);
      toast.success("MFA bekapcsolva. Mentsd el a helyreállító kódokat!");
    } catch (error) {
      toast.error((error as Error)?.message || "Nem sikerült megerősíteni az MFA-t");
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleDisableMfa = async () => {
    setSecuritySaving(true);
    try {
      await disableMfa({ code: disableCode, recoveryCode: disableRecovery });
      setSecurity((prev) => (prev ? { ...prev, enabled: false, recoveryCodesRemaining: 0 } : prev));
      setDisableCode("");
      setDisableRecovery("");
      toast.success("MFA kikapcsolva");
    } catch (error) {
      toast.error((error as Error)?.message || "Nem sikerült kikapcsolni az MFA-t");
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleClearImage = (key: "site_logo" | "site_favicon") => {
    setFormData((prev) => ({ ...prev, [key]: "" }));
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Tölts ki minden mezőt");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A jelszavak nem egyeznek");
      return;
    }

    setSecuritySaving(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Jelszó frissítve és munkamenet megújítva");
    } catch (error) {
      toast.error((error as Error)?.message || "Nem sikerült frissíteni a jelszót");
    } finally {
      setSecuritySaving(false);
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
            <Settings className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Általános beállítások
            </h1>
            <p className="text-muted-foreground">
              Weboldal neve, kulcsszavak és logó kezelése
            </p>
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/60 p-4">
              <div className="space-y-1">
                <Label className="text-base">Fejlesztési figyelmeztetés</Label>
                <p className="text-sm text-muted-foreground">
                  Kapcsolja ki, ha nem szeretné megjeleníteni az „A weboldal fejlesztés alatt áll.” fejléc sávot.
                </p>
              </div>
              <Switch
                checked={Boolean(formData.dev_banner_enabled ?? true)}
                onCheckedChange={(checked) => setFormData({ ...formData, dev_banner_enabled: checked })}
                aria-label="Fejlesztési figyelmeztetés bekapcsolása"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="space-y-1">
                  <Label className="text-base">Dokumentum CSV import</Label>
                  <p className="text-sm text-muted-foreground">
                    Engedélyezd, hogy a dokumentumok oldalán megjelenjen a CSV importáló szakasz.
                  </p>
                </div>
                <Switch
                  checked={Boolean(formData.documents_importer_enabled ?? true)}
                  onCheckedChange={(checked) => setFormData({ ...formData, documents_importer_enabled: checked })}
                  aria-label="Dokumentum CSV import bekapcsolása"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="space-y-1">
                  <Label className="text-base">Hír CSV import</Label>
                  <p className="text-sm text-muted-foreground">
                    Engedélyezd, hogy a hírek oldalán megjelenjen a Webflow CSV importáló szakasz.
                  </p>
                </div>
                <Switch
                  checked={Boolean(formData.news_importer_enabled ?? true)}
                  onCheckedChange={(checked) => setFormData({ ...formData, news_importer_enabled: checked })}
                  aria-label="Hír CSV import bekapcsolása"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="space-y-1">
                  <Label className="text-base">Régió CSV import</Label>
                  <p className="text-sm text-muted-foreground">
                    Engedélyezd, hogy a régiók kezelésénél megjelenjenek a CSV importálási szakaszok.
                  </p>
                </div>
                <Switch
                  checked={Boolean(formData.regions_importer_enabled ?? true)}
                  onCheckedChange={(checked) => setFormData({ ...formData, regions_importer_enabled: checked })}
                  aria-label="Régió CSV import bekapcsolása"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Oldal neve</Label>
              <Input
                value={formData.site_name || ""}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Kulcsszavak</Label>
              <Textarea
                value={formData.site_keywords || ""}
                onChange={(e) => setFormData({ ...formData, site_keywords: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-base">Logó kép</Label>
                    <p className="text-xs text-muted-foreground">
                      Ez jelenik meg a fejlécben és a legtöbb helyen, ahol logóra van szükség.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-background to-muted/40">
                    {formData.site_logo ? (
                      <img src={formData.site_logo.toString()} alt="Logó előnézet" className="h-full w-full object-contain" />
                    ) : (
                      <p className="text-sm text-muted-foreground">Nincs kiválasztva logó</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => fileInputRefs.current.site_logo?.click()}
                  >
                    <Upload className="h-4 w-4" /> Kép kiválasztása
                  </Button>
                  {formData.site_logo && (
                    <Button type="button" variant="ghost" className="gap-2" onClick={() => handleClearImage("site_logo")}>
                      <Trash2 className="h-4 w-4" /> Kép eltávolítása
                    </Button>
                  )}
                  <input
                    ref={(el) => (fileInputRefs.current.site_logo = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageSelect("site_logo", event.target.files)}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-base">Favicon</Label>
                    <p className="text-xs text-muted-foreground">
                      Négyzetes ikon a böngészőfülhöz; ha üres, a logó kerül felhasználásra.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-background to-muted/40">
                    {formData.site_favicon ? (
                      <img
                        src={formData.site_favicon.toString()}
                        alt="Favicon előnézet"
                        className="h-20 w-20 rounded object-contain"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Nincs kiválasztva favicon</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => fileInputRefs.current.site_favicon?.click()}
                  >
                    <Upload className="h-4 w-4" /> Ikon kiválasztása
                  </Button>
                  {formData.site_favicon && (
                    <Button type="button" variant="ghost" className="gap-2" onClick={() => handleClearImage("site_favicon")}>
                      <Trash2 className="h-4 w-4" /> Ikon eltávolítása
                    </Button>
                  )}
                  <input
                    ref={(el) => (fileInputRefs.current.site_favicon = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageSelect("site_favicon", event.target.files)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Google keresési leírás</Label>
                  <Textarea
                    value={siteSearchDescription}
                    onChange={(event) => setSiteSearchDescription(event.target.value)}
                    rows={4}
                    placeholder="Ez a szöveg jelenhet meg a Google találatokban a webhely címe alatt."
                  />
                  <p className="text-xs text-muted-foreground">
                    Ez a meta leírás a nyitóoldalnál jelenik meg a keresőkben. Ajánlott hossz: 140-160 karakter.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mentés...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Változások mentése
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Biztonság</h2>
              <p className="text-muted-foreground text-sm">Kétlépcsős azonosítás és jelszókezelés</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Kétlépcsős azonosítás</p>
                  <p className="text-sm text-muted-foreground">
                    {security?.enabled
                      ? `Aktív • ${security.recoveryCodesRemaining} helyreállító kód maradt`
                      : 'Még nincs bekapcsolva'}
                  </p>
                </div>
                {!security?.enabled ? (
                  <Button variant="outline" onClick={handlePrepareMfa} disabled={securitySaving}>
                    Bekapcsolás
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleDisableMfa} disabled={securitySaving}>
                    Kikapcsolás
                  </Button>
                )}
              </div>

              {mfaSetup && (
                <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex items-center gap-2 rounded-full px-3 py-1 border text-sm ${mfaStep === step ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}
                      >
                        <span className="h-6 w-6 rounded-full bg-background border flex items-center justify-center font-semibold">
                          {step}
                        </span>
                        {step === 1 && 'Hitelesítő app'}
                        {step === 2 && 'Helyreállító kódok'}
                        {step === 3 && 'Kód megadása'}
                        {step === 4 && 'Megerősítés'}
                      </div>
                    ))}
                  </div>

                  {mfaStep === 1 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Olvasd be a kódot a hitelesítő appban.</p>
                      {mfaSetup.otpauthUrl && (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="bg-white p-3 rounded-md border shadow-sm inline-flex">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mfaSetup.otpauthUrl)}`}
                              alt="Authenticator QR kód"
                              className="h-48 w-48 object-contain"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Szkenneld be a QR-kódot a választott hitelesítő alkalmazással.</p>
                            <p>Ha nem tudsz szkennelni, használd a lenti URL-t vagy titkos kulcsot.</p>
                          </div>
                        </div>
                      )}
                      <div className="bg-muted p-3 rounded-md space-y-2">
                        <p className="font-mono text-sm break-all">{mfaSetup.otpauthUrl}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => mfaSetup.otpauthUrl && navigator.clipboard?.writeText(mfaSetup.otpauthUrl)}
                        >
                          URL másolása
                        </Button>
                        <p className="font-mono text-sm break-all">Titkos kulcs: {mfaSetup.secret}</p>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => setMfaStep(2)} variant="secondary">
                          Tovább a helyreállító kódokra
                        </Button>
                      </div>
                    </div>
                  )}

                  {mfaStep === 2 && (
                    <div className="space-y-3">
                      <div className="bg-amber-50 text-amber-900 border border-amber-200 p-3 rounded-md text-sm">
                        Jegyezd fel biztonságos helyre a helyreállító kódokat. Ezek nélkül nem tudod visszakapcsolni a fiókodat, ha
                        elveszíted a hozzáférést.
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Helyreállító kódok</p>
                        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                          {mfaSetup.recoveryCodes.map((code) => (
                            <span key={code}>{code}</span>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={recoveryAcknowledged}
                          onChange={(e) => setRecoveryAcknowledged(e.target.checked)}
                        />
                        Feljegyeztem a helyreállító kódokat biztonságos helyre.
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <Button variant="ghost" onClick={() => setMfaStep(1)}>
                          Vissza
                        </Button>
                        <Button
                          onClick={() => {
                            if (!recoveryAcknowledged) {
                              toast.error('Erősítsd meg, hogy elmentetted a kódokat');
                              return;
                            }

                            setMfaStep(3);
                          }}
                        >
                          Tovább a helyreállító kód megadásához
                        </Button>
                      </div>
                    </div>
                  )}

                  {mfaStep === 3 && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Helyreállító kód megadása</Label>
                        <Input
                          value={recoveryCodeInput}
                          onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                          placeholder="Pl.: ABC123..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Írd be a fenti kódok egyikét, hogy megerősítsd a mentést. Ha nem írod be, nem engedjük aktiválni a 2FA-t.
                        </p>
                        {!recoveryAcknowledged && (
                          <p className="text-xs text-amber-600">Kérjük erősítsd meg, hogy elmentetted a kódokat.</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Button variant="ghost" onClick={() => setMfaStep(2)}>
                          Vissza
                        </Button>
                        <Button
                          onClick={() => {
                            if (!recoveryAcknowledged) {
                              toast.error('Erősítsd meg, hogy elmentetted a kódokat');
                              return;
                            }

                            const normalizedRecovery = recoveryCodeInput.replace(/\s+/g, '').toUpperCase();
                            const recoveryIsValid = mfaSetup.recoveryCodes.some(
                              (code) => code.replace(/\s+/g, '').toUpperCase() === normalizedRecovery,
                            );

                            if (!recoveryIsValid) {
                              toast.error('Írd be a megjelenített helyreállító kódok egyikét');
                              return;
                            }

                            setMfaStep(4);
                          }}
                        >
                          Tovább a hitelesítő kódhoz
                        </Button>
                      </div>
                    </div>
                  )}

                  {mfaStep === 4 && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Megadott helyreállító kód</Label>
                        <Input
                          value={recoveryCodeInput}
                          onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                          placeholder="Helyreállító kód megerősítése"
                        />
                        {!recoveryAcknowledged && (
                          <p className="text-xs text-amber-600">Kérjük erősítsd meg, hogy elmentetted a kódokat.</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Egyszer használható kód</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {[0, 1, 2, 3, 4, 5].map((idx) => (
                            <Input
                              key={idx}
                              maxLength={1}
                              value={mfaCode[idx] || ''}
                              ref={(el) => {
                                mfaInputRefs.current[idx] = el;
                              }}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "");
                                setMfaCode((prev) => {
                                  const next = Array.from({ length: 6 }, (_, i) => prev[i] || "");
                                  let position = idx;

                                  if (digits.length === 0) {
                                    next[idx] = "";
                                  } else {
                                    for (const digit of digits.slice(0, 6 - idx)) {
                                      next[position] = digit;
                                      position += 1;
                                    }
                                  }

                                  return next.join("").trimEnd();
                                });

                                if (digits.length > 0) {
                                  const nextIndex = Math.min(idx + digits.length, 5);
                                  const target = mfaInputRefs.current[nextIndex];
                                  target?.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !mfaCode[idx] && idx > 0) {
                                  const target = mfaInputRefs.current[idx - 1];
                                  target?.focus();
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Button variant="ghost" onClick={() => setMfaStep(3)}>
                          Vissza
                        </Button>
                        <Button onClick={handleConfirmMfa} disabled={securitySaving || mfaCode.length < 6} className="w-full">
                          Kód megerősítése
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {security?.enabled && !mfaSetup && (
                <div className="space-y-2">
                  <Label>Helyreállítás vagy kikapcsolás</Label>
                  <Input
                    placeholder="Hitelesítő app kód"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    disabled={securitySaving}
                  />
                  <Input
                    placeholder="Helyreállító kód"
                    value={disableRecovery}
                    onChange={(e) => setDisableRecovery(e.target.value)}
                    disabled={securitySaving}
                  />
                  <Button variant="outline" onClick={handleDisableMfa} disabled={securitySaving} className="w-full">
                    MFA kikapcsolása
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Jelszó csere</p>
                  <p className="text-sm text-muted-foreground">Erős jelszó és új munkamenet szükséges</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Jelenlegi jelszó</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={securitySaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Új jelszó</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={securitySaving}
                    minLength={12}
                  />
                  <p className="text-xs text-muted-foreground">Legalább 12 karakter, kis- és nagybetű, szám és speciális karakter.</p>
                </div>
                <div className="space-y-2">
                  <Label>Új jelszó ismét</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={securitySaving}
                  />
                </div>
                <Button onClick={handlePasswordChange} disabled={securitySaving} className="w-full">
                  {securitySaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Mentés...
                    </>
                  ) : (
                    'Jelszó frissítése'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
