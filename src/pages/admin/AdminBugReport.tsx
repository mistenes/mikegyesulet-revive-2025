import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { submitBugReport } from "@/services/bugReportService";
import { AlertTriangle, Mail } from "lucide-react";
import { toast } from "sonner";

export default function AdminBugReport() {
  const { isLoading, session } = useAdminAuthGuard();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedResult: "",
    actualResult: "",
    severity: "Magas",
  });

  if (isLoading) {
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

  const handleChange = (key: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submitBugReport(form);
      toast.success("Hibajelentés elküldve");
      setForm({
        title: "",
        description: "",
        stepsToReproduce: "",
        expectedResult: "",
        actualResult: "",
        severity: "Magas",
      });
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Nem sikerült elküldeni a hibajelentést");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              Hibajelentő
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Oszd meg a hibákat a csapattal. A beküldött jelentések azonnal továbbításra kerülnek a mistenes@me.com címre
              "URGENT - bug report" tárggyal.
            </p>
          </div>
        </div>

        <Alert className="bg-amber-50 border-amber-200 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fontos</AlertTitle>
          <AlertDescription>
            A jelentések a megadott e-mail címre kerülnek kiküldésre. Kérjük, adj meg minél több részletet és csatolj lépéseket a
            hiba reprodukálásához.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Hibajelentés küldése</CardTitle>
              <CardDescription>Töltsd ki az űrlapot, hogy a csapat gyorsan reagálhasson.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>mistenes@me.com</span>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Cím*</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={(event) => handleChange("title")(event.target.value)}
                  placeholder="Röviden foglald össze a hibát"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Leírás*</Label>
                <Textarea
                  id="description"
                  required
                  value={form.description}
                  onChange={(event) => handleChange("description")(event.target.value)}
                  placeholder="Mi a hiba? Mikor jelentkezik?"
                  className="min-h-[140px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="steps">Lépések a reprodukáláshoz</Label>
                  <Textarea
                    id="steps"
                    value={form.stepsToReproduce}
                    onChange={(event) => handleChange("stepsToReproduce")(event.target.value)}
                    placeholder="1. ...\n2. ...\n3. ..."
                    className="min-h-[140px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected">Várt eredmény</Label>
                  <Textarea
                    id="expected"
                    value={form.expectedResult}
                    onChange={(event) => handleChange("expectedResult")(event.target.value)}
                    placeholder="Mit vártál volna, hogy történjen?"
                    className="min-h-[68px]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="actual">Kapott eredmény</Label>
                  <Textarea
                    id="actual"
                    value={form.actualResult}
                    onChange={(event) => handleChange("actualResult")(event.target.value)}
                    placeholder="Mi történt valójában?"
                    className="min-h-[68px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Súlyosság</Label>
                  <select
                    id="severity"
                    value={form.severity}
                    onChange={(event) => handleChange("severity")(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Alacsony">Alacsony</option>
                    <option value="Közepes">Közepes</option>
                    <option value="Magas">Magas</option>
                    <option value="Kritikus">Kritikus</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Küldés..." : "Jelentés elküldése"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
