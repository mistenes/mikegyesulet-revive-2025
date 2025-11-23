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

export async function listAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Nem sikerült lekérni a felhasználókat');
  }

  const payload = await response.json();
  return payload.users as AdminUser[];
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
