import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { logout } from "@/services/authService";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Admin() {
  const navigate = useNavigate();
  const { isLoading, session } = useAdminAuthGuard();

  const handleLogout = () => {
    logout();
    toast.success('Sikeres kijelentkezés');
    navigate('/');
  };

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
              Üdvözöllek az Admin felületen!
            </h1>
            <p className="text-muted-foreground">
              Használd a bal oldali menüt a navigációhoz
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Kijelentkezés
          </Button>
        </div>

        {!session.mfaEnabled && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Kétlépcsős azonosítás ajánlott</AlertTitle>
            <AlertDescription>
              A fiókod jelenleg nem védett 2FA-val. Kapcsold be a Biztonság menüpontban, hogy megakadályozd az illetéktelen
              hozzáférést.
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Kezdés</h2>
          <p className="text-sm text-muted-foreground">
            Válaszd ki a bal oldali menüből a szerkeszteni kívánt tartalmat, vagy látogasd meg a Biztonság menüpontot az
            adminisztrációs fiók védelmének erősítéséhez.
          </p>
        </Card>

      </div>
    </AdminLayout>
  );
}
