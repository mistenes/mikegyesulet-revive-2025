import { withCsrfHeader } from '@/utils/csrf';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export type SecurityStatus = {
  enabled: boolean;
  recoveryCodesRemaining: number;
};

export type MfaPreparation = {
  secret: string;
  otpauthUrl?: string;
  recoveryCodes: string[];
};

export async function getSecurityStatus(): Promise<SecurityStatus> {
  const response = await fetch(`${API_BASE}/api/admin/security/mfa`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Nem sikerült lekérni a biztonsági beállításokat');
  }

  return response.json();
}

export async function prepareMfa(): Promise<MfaPreparation> {
  const response = await fetch(`${API_BASE}/api/admin/security/mfa/prepare`, {
    method: 'POST',
    credentials: 'include',
    headers: withCsrfHeader(),
  });

  if (!response.ok) {
    throw new Error('Nem sikerült előkészíteni az MFA-t');
  }

  return response.json();
}

export async function confirmMfa(code: string, recoveryCode: string): Promise<{ recoveryCodes: string[] }> {
  const response = await fetch(`${API_BASE}/api/admin/security/mfa/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...withCsrfHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, recoveryCode }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || 'Nem sikerült bekapcsolni az MFA-t');
  }

  return response.json();
}

export async function disableMfa(payload: { code?: string; recoveryCode?: string }): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/security/mfa/disable`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...withCsrfHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Nem sikerült kikapcsolni az MFA-t');
  }
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/security/password`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...withCsrfHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Nem sikerült frissíteni a jelszót');
  }
}
