const CSRF_COOKIE_NAME = 'mik_admin_csrf';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!value) return null;
  return decodeURIComponent(value.split('=')[1] || '');
}

export function getCsrfToken(): string | null {
  return getCookie(CSRF_COOKIE_NAME);
}

export function withCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  if (!token) return headers;

  if (headers instanceof Headers) {
    headers.set('X-CSRF-Token', token);
    return headers;
  }

  return { ...headers, 'X-CSRF-Token': token } as HeadersInit;
}
