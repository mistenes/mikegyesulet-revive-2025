import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, MailPlus, ShieldCheck, Clock4, RefreshCw, Trash2, MailX, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  inviteAdminUser,
  listAdminUsers,
  deleteAdminUser,
  deletePendingInvite,
  sendPasswordReset,
  type AdminUser,
  type PendingInvite,
} from '@/services/adminUsersService';
import { useAdminAuthGuard } from '@/hooks/useAdminAuthGuard';

export default function AdminUsers() {
  const { isLoading: authLoading, session } = useAdminAuthGuard();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      try {
        const list = await listAdminUsers();
        setUsers(list.users);
        setInvites(list.invites);
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
      setUsers(list.users);
      setInvites(list.invites);
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
      setUsers(list.users);
      setInvites(list.invites);
    } catch (error) {
      toast.error((error as Error)?.message || 'Nem sikerült frissíteni a listát');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteUser = async (userEmail: string) => {
    setBusyEmail(userEmail);
    try {
      await deleteAdminUser(userEmail);
      toast.success('Felhasználó törölve');
      const list = await listAdminUsers();
      setUsers(list.users);
      setInvites(list.invites);
    } catch (error) {
      toast.error((error as Error)?.message || 'Nem sikerült törölni a felhasználót');
    } finally {
      setBusyEmail(null);
    }
  };

  const handleDeleteInvite = async (inviteEmail: string) => {
    setBusyEmail(inviteEmail);
    try {
      await deletePendingInvite(inviteEmail);
      toast.success('Meghívó törölve');
      const list = await listAdminUsers();
      setUsers(list.users);
      setInvites(list.invites);
    } catch (error) {
      toast.error((error as Error)?.message || 'Nem sikerült törölni a meghívót');
    } finally {
      setBusyEmail(null);
    }
  };

  const handlePasswordReset = async (targetEmail: string) => {
    setBusyEmail(targetEmail);
    try {
      const result = await sendPasswordReset(targetEmail);
      toast.success('Jelszó-visszaállító e-mail elküldve');
      if (result.link) {
        navigator.clipboard?.writeText(result.link).catch(() => null);
      }
    } catch (error) {
      toast.error((error as Error)?.message || 'Nem sikerült elküldeni a jelszó-visszaállítást');
    } finally {
      setBusyEmail(null);
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

        <div className="grid gap-6 lg:grid-cols-2">
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
                <div key={user.email} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
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

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePasswordReset(user.email)}
                      disabled={busyEmail === user.email}
                    >
                      <KeyRound className="h-4 w-4 mr-2" /> Jelszó visszaállítása
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.email)}
                      disabled={busyEmail === user.email}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Felhasználó törlése
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MailX className="h-4 w-4" />
              <span>Függőben lévő meghívók</span>
            </div>

            <div className="divide-y divide-border rounded-md border border-border">
              {invites.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">Nincs függőben lévő meghívó.</div>
              )}
              {invites.map((invite) => (
                <div key={`${invite.email}-${invite.created_at}`} className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Lejár: {invite.expires_at ? new Date(invite.expires_at).toLocaleString('hu-HU') : 'ismeretlen'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.email)}
                      disabled={busyEmail === invite.email}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Meghívó törlése
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
