import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { getSession, login, AuthError } from "@/services/authService";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

const authSchema = z.object({
  email: z.string().email("Érvényes e-mail címet adj meg"),
  password: z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function redirectIfAuthed() {
      try {
        const session = await getSession();
        if (!active) return;

        if (session) {
          navigate("/admin");
        }
      } catch (error) {
        // ignore validation errors during initial load
      }
    }

    redirectIfAuthed();

    return () => {
      active = false;
    };
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
      await login(email, password, requiresMfa ? { mfaCode: otp, recoveryCode } : undefined);
      toast.success("Sikeres bejelentkezés!");
      navigate("/admin");
    } catch (error: unknown) {
      if (error instanceof AuthError && error.requiresMfa) {
        setRequiresMfa(true);
        toast.message("Kérjük add meg a hitelesítő kódot a belépéshez");
        return;
      }

      if (error instanceof AuthError && error.resetRequired) {
        toast.error("Új jelszó beállítása szükséges. Ellenőrizd az e-mailedet.");
        return;
      }

      const message = error instanceof Error ? error.message : "Helytelen belépési adatok";
      toast.error(message);
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
                disabled={isLoading || requiresMfa}
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
                disabled={isLoading || requiresMfa}
                minLength={6}
              />
            </div>
          </div>

          {requiresMfa && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="otp">Hitelesítő kód</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recovery">Vagy helyreállító kód</Label>
                <Input
                  id="recovery"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="XXXXX-XXXXX"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Használhatod, ha nincs kéznél a TOTP alkalmazás.</p>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Folyamatban..." : requiresMfa ? "Kód megerősítése" : "Bejelentkezés"}
          </Button>

          {requiresMfa && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setRequiresMfa(false);
                setOtp("");
                setRecoveryCode("");
              }}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Vissza a jelszóhoz
            </Button>
          )}
        </form>

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
