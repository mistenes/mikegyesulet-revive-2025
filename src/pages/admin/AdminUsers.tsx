import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, MailPlus, ShieldCheck, Clock4, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { inviteAdminUser, listAdminUsers, type AdminUser } from '@/services/adminUsersService';
import { useAdminAuthGuard } from '@/hooks/useAdminAuthGuard';

export default function AdminUsers() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      try {
        const list = await listAdminUsers();
        setUsers(list);
      } catch (error) {
        toast.error((error as Error)?.message || 'Nem sikerült betölteni a felhasználókat');
      }
    };

    load();
  }, [session]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const result = await inviteAdminUser(email);
      toast.success('Meghívó elküldve');
      if (result.link) {
        toast.message('Meghívó link másolva a vágólapra');
        navigator.clipboard?.writeText(result.link).catch(() => null);
      }
      const list = await listAdminUsers();
      setUsers(list);
      setEmail('');
    } catch (error) {
      toast.error((error as Error)?.message || 'Nem sikerült elküldeni a meghívót');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const list = await listAdminUsers();
      setUsers(list);
    } catch (error) {
      toast.error((error as Error)?.message || 'Nem sikerült frissíteni a listát');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (authLoading) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                Admin felhasználók
              </h1>
              <p className="text-muted-foreground">Meghívások küldése és hozzáférések követése</p>
            </div>
          </div>
          <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw className="h-4 w-4 mr-2" /> Frissítés
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MailPlus className="h-4 w-4" />
            <span>Új meghívó küldése e-mail címre</span>
          </div>
          <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">E-mail cím</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uj.admin@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="md:w-48">
              {isSubmitting ? 'Küldés...' : 'Meghívó küldése'}
            </Button>
          </form>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Aktív admin fiókok</span>
          </div>

          <div className="divide-y divide-border rounded-md border border-border">
            {users.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Még nincs admin felhasználó.</div>
            )}
            {users.map((user) => (
              <div key={user.email} className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock4 className="h-3 w-3" />
                    Utolsó belépés: {user.last_login_at ? new Date(user.last_login_at).toLocaleString('hu-HU') : 'még nincs'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.must_reset_password && <Badge variant="secondary">Jelszó beállításra vár</Badge>}
                  {user.mfa_enabled ? (
                    <Badge variant="default">MFA bekapcsolva</Badge>
                  ) : (
                    <Badge variant="outline">MFA nincs bekapcsolva</Badge>
                  )}
                  {!user.is_active && <Badge variant="destructive">Letiltva</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
