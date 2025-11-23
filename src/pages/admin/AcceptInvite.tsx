import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { completeInvite } from '@/services/authService';

const schema = z
  .object({
    password: z
      .string()
      .min(12, 'Legalább 12 karakter')
      .regex(/[A-Z]/, 'Legalább egy nagybetű szükséges')
      .regex(/[a-z]/, 'Legalább egy kisbetű szükséges')
      .regex(/[0-9]/, 'Legalább egy számjegy szükséges')
      .regex(/[!@#$%^&*(),.?":{}|<>\-_=+\[\];'/\\`~]/, 'Legalább egy speciális karakter szükséges'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'A jelszavaknak egyezniük kell',
  });

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = params.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Hiányzó meghívó token');
      navigate('/auth');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = schema.safeParse({ password, confirm });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    try {
      await completeInvite(token, password);
      toast.success('Jelszó beállítva. Jelentkezz be az új adatokkal.');
      navigate('/auth');
    } catch (error) {
      const message = (error as Error)?.message || 'Nem sikerült elfogadni a meghívót';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            Meghívó elfogadása
          </h1>
          <p className="text-muted-foreground">Állíts be egy erős jelszót a belépéshez.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Új jelszó</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="Erős jelszó..."
              minLength={12}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 12 karakter, kis- és nagybetű, szám és speciális karakter.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Jelszó megerősítése</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Mentés...' : 'Jelszó beállítása'}
          </Button>
        </form>

        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p>Javasolt rögtön bekapcsolni a kétlépcsős azonosítást a belépés után.</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p>A meghívó 7 napig érvényes.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
