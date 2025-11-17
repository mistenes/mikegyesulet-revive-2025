import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Érvényes e-mail címet adj meg"),
  password: z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated and redirect if so
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();
        
        if (roles) {
          navigate('/admin');
        } else {
          toast.error('Nincs admin jogosultságod');
          await supabase.auth.signOut();
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user has admin role
        const { data: roles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .single();

        if (roleError || !roles) {
          await supabase.auth.signOut();
          toast.error('Nincs admin jogosultságod');
          return;
        }

        toast.success("Sikeres bejelentkezés!");
        navigate('/admin');
      } else {
        // Signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });

        if (error) throw error;

        toast.success("Regisztráció sikeres! Kérj admin jogosultságot a rendszergazdától.");
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Helytelen e-mail cím vagy jelszó');
      } else if (error.message.includes('User already registered')) {
        toast.error('Ez az e-mail cím már regisztrálva van');
      } else {
        toast.error(error.message || 'Hiba történt a művelet során');
      }
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
            {isLogin ? 'Admin bejelentkezés' : 'Regisztráció'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? 'Add meg az admin fiók adatait a folytatáshoz' 
              : 'Hozz létre egy új fiókot'}
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
                placeholder="admin@example.com"
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
            {isLoading ? 'Folyamatban...' : (isLogin ? 'Bejelentkezés' : 'Regisztráció')}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm"
            disabled={isLoading}
          >
            {isLogin ? 'Még nincs fiókod? Regisztrálj' : 'Van már fiókod? Jelentkezz be'}
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground block w-full"
            disabled={isLoading}
          >
            Vissza a főoldalra
          </Button>
        </div>
      </Card>
    </div>
  );
}
