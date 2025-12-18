import { withCsrfHeader } from '@/utils/csrf';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export type AdminUser = {
  email: string;
  created_at?: string;
  last_login_at?: string | null;
  mfa_enabled?: boolean;
  must_reset_password?: boolean;
  is_active?: boolean;
};

export type PendingInvite = { email: string; expires_at?: string; created_at?: string };

export async function listAdminUsers(): Promise<{ users: AdminUser[]; invites: PendingInvite[] }> {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Nem sikerült lekérni a felhasználókat');
  }

  const payload = await response.json();
  return { users: payload.users as AdminUser[], invites: (payload.invites as PendingInvite[]) || [] };
}

export async function inviteAdminUser(email: string): Promise<{ inviteExpiresAt: string; link?: string }> {
  const response = await fetch(`${API_BASE}/api/admin/users/invite`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...withCsrfHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || 'Nem sikerült elküldeni a meghívót');
  }

  return response.json();
}

export async function deleteAdminUser(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: withCsrfHeader(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || 'Nem sikerült törölni a felhasználót');
  }
}

export async function deletePendingInvite(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/users/invite`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { ...withCsrfHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || 'Nem sikerült törölni a meghívót');
  }
}

export async function sendPasswordReset(email: string): Promise<{ resetExpiresAt: string; link?: string }> {
  const response = await fetch(`${API_BASE}/api/admin/users/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...withCsrfHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || 'Nem sikerült elküldeni a jelszó emlékeztetőt');
  }

  return response.json();
}
