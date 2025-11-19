const STORAGE_KEY = "mik-admin-session";

const DEFAULT_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@mik.hu";
const DEFAULT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "mik-admin";

type Session = {
  email: string;
  loggedInAt: string;
};

const isBrowser = typeof window !== "undefined";

export function getSession(): Session | null {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getSession());
}

export function login(email: string, password: string) {
  if (email !== DEFAULT_EMAIL || password !== DEFAULT_PASSWORD) {
    throw new Error("Helytelen belépési adatok");
  }

  if (!isBrowser) return;

  const session: Session = {
    email,
    loggedInAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function logout() {
  if (!isBrowser) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
