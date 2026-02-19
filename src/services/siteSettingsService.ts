import { withCsrfHeader } from "@/utils/csrf";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type SiteSettingsPayload = {
  siteFavicon: string;
  siteSearchDescription: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? String(payload.message) : "Ismeretlen hiba történt";
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchPublicSiteSettings(): Promise<SiteSettingsPayload> {
  const response = await fetch(`${API_BASE}/api/public/site-settings`);
  return handleResponse<SiteSettingsPayload>(response);
}

export async function saveSiteSettings(payload: SiteSettingsPayload): Promise<SiteSettingsPayload> {
  const response = await fetch(`${API_BASE}/api/admin/site-settings`, {
    method: "POST",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  return handleResponse<SiteSettingsPayload>(response);
}
