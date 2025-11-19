export type AdminUser = {
  id: string;
  email?: string;
  role?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8788";
const AUTH_ENDPOINT = `${API_BASE_URL}/api/admin/auth`;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Ismeretlen hiba történt";

    try {
      const error = await response.json();
      if ((error as any)?.message) {
        message = (error as any).message;
      }
    } catch (error) {
      console.error("Failed to parse error response", error);
    }

    if (response.status === 401) {
      throw new Error(message || "A munkamenet lejárt");
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function login(email: string, password: string): Promise<AdminUser> {
  const response = await fetch(`${AUTH_ENDPOINT}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<{ user: AdminUser }>(response);
  return data.user;
}

async function validateSession(): Promise<AdminUser | null> {
  const response = await fetch(`${AUTH_ENDPOINT}/session`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const data = await handleResponse<{ user: AdminUser }>(response);
  return data.user ?? null;
}

async function logout() {
  await fetch(`${AUTH_ENDPOINT}/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export const authService = {
  login,
  validateSession,
  logout,
};
