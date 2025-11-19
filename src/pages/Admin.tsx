import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, FileText, Map, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { isAuthenticated, logout } from "@/services/authService";

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    setIsAdmin(true);
    setIsLoading(false);
  }, [navigate]);

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

  if (!isAdmin) {
    return null;
  }

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

      </div>
    </AdminLayout>
  );
}
