import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Beállítások
            </h1>
            <p className="text-muted-foreground">
              Általános oldal beállítások kezelése
            </p>
          </div>
        </div>

        <Card className="p-6">
          <p className="text-muted-foreground">
            Ez a szekció hamarosan elérhető lesz a weboldal általános beállításainak kezeléséhez.
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
}
