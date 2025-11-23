import { withCsrfHeader } from '@/utils/csrf';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export type Session = {
  email: string;
  mfaEnabled?: boolean;
};

export class AuthError extends Error {
  requiresMfa?: boolean;
  resetRequired?: boolean;
  lockedUntil?: string;
  remainingAttempts?: number;

  constructor(message: string, meta: Partial<AuthError> = {}) {
    super(message);
    Object.assign(this, meta);
  }
}

let cachedSession: Session | null = null;

async function handleResponse(response: Response) {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    // Ignore JSON parse errors and fall back to generic messages
  }

  if (!response.ok) {
    const message = payload?.message || 'Ismeretlen hiba történt';
    throw new Error(message);
  }

  return payload as { user: Session };
}

export async function login(
  email: string,
  password: string,
  options?: { mfaCode?: string; recoveryCode?: string },
): Promise<Session> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password, mfaCode: options?.mfaCode, recoveryCode: options?.recoveryCode }),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch (error) {
    // ignore
  }

  if (!response.ok) {
    const error = new AuthError(payload?.message || 'Ismeretlen hiba történt', {
      requiresMfa: payload?.requiresMfa,
      resetRequired: payload?.resetRequired,
      lockedUntil: payload?.lockedUntil,
      remainingAttempts: payload?.remainingAttempts,
    });
    throw error;
  }

  cachedSession = payload.user as Session;
  return cachedSession;
}

export async function logout(): Promise<void> {
  cachedSession = null;
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: withCsrfHeader(),
  });
}

export async function getSession(): Promise<Session | null> {
  if (cachedSession) return cachedSession;

  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) return refreshed;

    cachedSession = null;
    return null;
  }

  const data = await handleResponse(response);
  cachedSession = data.user as Session;
  return cachedSession;
}

export async function refreshSession(): Promise<Session | null> {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: withCsrfHeader(),
  });

  if (response.status === 401) {
    cachedSession = null;
    return null;
  }

  const data = await handleResponse(response);
  cachedSession = data.user as Session;
  return cachedSession;
}

export async function completeInvite(token: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/complete-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password }),
  });

  await handleResponse(response);
}
