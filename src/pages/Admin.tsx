import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, FileText, Map } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { useAdminSession } from "@/hooks/useAdminSession";

export default function Admin() {
  const { isLoading } = useAdminSession();

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
              Üdvözöllek az Admin felületen!
            </h1>
            <p className="text-muted-foreground">
              Használd a bal oldali menüt a navigációhoz
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Munkamenet ellenőrzése...</span>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6 space-y-2 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-bold text-foreground">2000+</span>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Aktív tagok</h3>
              </Card>

              <Card className="p-6 space-y-2 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <Map className="h-8 w-8 text-accent" />
                  <span className="text-3xl font-bold text-foreground">10</span>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Régiók</h3>
              </Card>

              <Card className="p-6 space-y-2 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-primary-glow" />
                  <span className="text-3xl font-bold text-foreground">150+</span>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Projektek</h3>
              </Card>
            </div>
          )}

        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
