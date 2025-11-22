const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isBrowser = typeof window !== "undefined";
const defaultBase = API_BASE || (isBrowser ? window.location.origin : "http://localhost");

async function handleResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    // ignore JSON parse errors to surface status text
  }

  if (!response.ok) {
    const message = (payload as { message?: string } | null)?.message || response.statusText || "Ismeretlen hiba";
    throw new Error(message);
  }

  return (payload as T) || ({} as T);
}

export async function translateProjectToEnglish(payload: {
  shortDescriptionHu?: string;
  descriptionHu?: string;
}): Promise<{ shortDescription?: string; description?: string }> {
  const url = new URL("/api/projects/translate", defaultBase);

  const response = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function translateNewsToEnglish(payload: {
  excerptHu?: string;
  contentHu?: string;
}): Promise<{ excerpt?: string; content?: string }> {
  const url = new URL("/api/news/translate", defaultBase);

  const response = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}
