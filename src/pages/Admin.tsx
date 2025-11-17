import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Users, FileText, Map } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = localStorage.getItem("adminAuth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "true");
      setIsAuthenticated(true);
      toast.success("Bejelentkezés sikeres!");
    } else {
      toast.error("Helytelen jelszó!");
      setPassword("");
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              Admin bejelentkezés
            </h1>
            <p className="text-muted-foreground">
              Add meg az admin jelszót a folytatáshoz
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Jelszó</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin jelszó"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Bejelentkezés
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground"
            >
              Vissza a főoldalra
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
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

        <Card className="p-6 bg-destructive/5 border-destructive/20">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Biztonsági figyelmeztetés</h3>
              <p className="text-sm text-muted-foreground">
                Ez az admin oldal jelenleg egyszerű jelszóval védett. Éles környezetben használj
                megfelelő felhasználói szerepkör alapú hitelesítést adatbázissal a biztonság érdekében.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
