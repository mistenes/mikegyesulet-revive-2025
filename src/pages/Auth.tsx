import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { isAuthenticated, login } from "@/services/authService";

const authSchema = z.object({
  email: z.string().email("Érvényes e-mail címet adj meg"),
  password: z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Sikeres bejelentkezés!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Helytelen belépési adatok");
    } finally {
      setIsLoading(false);
    }
  };

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
            Add meg az admin fiók adatait a folytatáshoz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail cím</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mik.hu"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Jelszó</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Folyamatban..." : "Bejelentkezés"}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground text-center">
          Az alapértelmezett belépési adatokat a projekt gyökerében található <code>.env.example</code> fájl tartalmazza.
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground block w-full"
          disabled={isLoading}
        >
          Vissza a főoldalra
        </Button>
      </Card>
    </div>
  );
}
