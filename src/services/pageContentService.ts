import { defaultPageContent } from "@/data/defaultPageContent";
import {
  type LocalizedSectionContent,
  type PageContentMetadata,
  type PageContentResponse,
  type PageContentStore,
} from "@/types/pageContent";
import { withCsrfHeader } from "@/utils/csrf";

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

export async function getAllSections(): Promise<PageContentResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/page-content`, {
      credentials: "include",
    });
    const data = await handleResponse<{ sections?: PageContentStore; metadata?: Record<string, PageContentMetadata> }>(response);
    adminCache = {
      ...defaultPageContent,
      ...(data.sections || {}),
    };
    return { sections: adminCache, metadata: data.metadata || {} };
  } catch (error) {
    adminCache = {
      ...defaultPageContent,
      ...(publicCache || {}),
    };
    return { sections: adminCache, metadata: {} };
  }
}

export async function saveSection(sectionKey: string, content: LocalizedSectionContent) {
  // Extract isVisible to send as separate field, but keep it in content for cache
  const isVisible = content.isVisible;

  const response = await fetch(`${API_BASE}/api/page-content/${encodeURIComponent(sectionKey)}`, {
    method: "PUT",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify({ translations: content, isVisible }),
  });

  const data = await handleResponse<{
    sectionKey: string;
    translations: LocalizedSectionContent;
    metadata?: PageContentMetadata;
  }>(response);

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
  return { translations: data.translations, metadata: data.metadata };
}

export const PAGE_CONTENT_EVENT = STORAGE_EVENT;
