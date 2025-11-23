import { defaultPageContent } from "@/data/defaultPageContent";
import { LocalizedSectionContent, PageContentStore } from "@/types/pageContent";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const STORAGE_EVENT = "page-content-updated";
const isBrowser = typeof window !== "undefined";

let publicCache: PageContentStore | null = null;
let adminCache: PageContentStore | null = null;

async function handleResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    // ignore
  }

  if (!response.ok) {
    const message = payload?.message || "Ismeretlen hiba történt";
    throw new Error(message);
  }

  return payload as T;
}

function broadcastUpdate(sectionKey?: string) {
  if (!isBrowser) return;
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, {
      detail: { sectionKey },
    }),
  );
}

export async function fetchPublicPageContent(): Promise<PageContentStore> {
  if (publicCache) return publicCache;

  try {
    const response = await fetch(`${API_BASE}/api/page-content/public`);
    const data = await handleResponse<{ sections: PageContentStore }>(response);
    publicCache = data.sections || {};
  } catch (error) {
    publicCache = {};
  }

  return publicCache;
}

export async function getSectionContent(sectionKey: string): Promise<LocalizedSectionContent> {
  const store = await fetchPublicPageContent();
  return store[sectionKey] || { hu: {}, en: {} };
}

export async function getAllSections(): Promise<PageContentStore> {
  try {
    const response = await fetch(`${API_BASE}/api/page-content`, {
      credentials: "include",
    });
    const data = await handleResponse<{ sections: PageContentStore }>(response);
    adminCache = {
      ...defaultPageContent,
      ...(data.sections || {}),
    };
  } catch (error) {
    adminCache = {
      ...defaultPageContent,
      ...(publicCache || {}),
    };
  }

  return (
    adminCache || {
      ...defaultPageContent,
    }
  );
}

export async function saveSection(sectionKey: string, content: LocalizedSectionContent) {
  const response = await fetch(`${API_BASE}/api/page-content/${encodeURIComponent(sectionKey)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ translations: content }),
  });

  const data = await handleResponse<{ sectionKey: string; translations: LocalizedSectionContent }>(response);

  if (adminCache) {
    adminCache = {
      ...adminCache,
      [data.sectionKey]: data.translations,
    };
  }

  if (publicCache) {
    publicCache = {
      ...publicCache,
      [data.sectionKey]: data.translations,
    };
  } else {
    publicCache = {
      [data.sectionKey]: data.translations,
    };
  }

  broadcastUpdate(data.sectionKey);
  return data.translations;
}

export const PAGE_CONTENT_EVENT = STORAGE_EVENT;
