import type { NewsArticle, NewsCategory, NewsInput, NewsListResponse } from "@/types/news";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EVENT_NAME = "news-updated";
const isBrowser = typeof window !== "undefined";
const defaultBase = API_BASE || (isBrowser ? window.location.origin : "http://localhost");

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

function broadcastUpdate(id?: string) {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id } }));
}

export async function getAdminNews(params: {
  search?: string;
  status?: "all" | "published" | "draft";
  page?: number;
  pageSize?: number;
  categoryId?: string;
} = {}): Promise<NewsListResponse> {
  const url = new URL("/api/news", defaultBase);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.pageSize) url.searchParams.set("pageSize", String(params.pageSize));
  if (params.categoryId) url.searchParams.set("categoryId", params.categoryId);

  const response = await fetch(url.toString(), {
    credentials: "include",
  });

  return handleResponse<NewsListResponse>(response);
}

export async function getPublishedNews(limit = 6, categoryId?: string): Promise<NewsArticle[]> {
  const url = new URL("/api/news/public", defaultBase);
  url.searchParams.set("limit", String(limit));
  if (categoryId) url.searchParams.set("categoryId", categoryId);

  const response = await fetch(url.toString());
  const data = await handleResponse<{ items: NewsArticle[] }>(response);
  return data.items;
}

export async function getPublishedNewsPage(params: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
} = {}): Promise<NewsListResponse> {
  const url = new URL("/api/news/public", defaultBase);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.pageSize) url.searchParams.set("pageSize", String(params.pageSize));
  if (params.categoryId) url.searchParams.set("categoryId", params.categoryId);

  const response = await fetch(url.toString());
  const data = await handleResponse<Partial<NewsListResponse> & { items: NewsArticle[] }>(response);

  const total = typeof data.total === "number" ? data.total : data.items.length;
  const page = typeof data.page === "number" ? data.page : params.page ?? 1;
  const pageSize = typeof data.pageSize === "number" ? data.pageSize : params.pageSize ?? data.items.length;

  return {
    items: data.items,
    total,
    page,
    pageSize,
  };
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  if (!slug) return null;
  const response = await fetch(`${API_BASE}/api/news/slug/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  return handleResponse<NewsArticle>(response);
}

export async function getNewsCategories(): Promise<NewsCategory[]> {
  const response = await fetch(`${API_BASE}/api/news/categories`, { credentials: "include" });
  const data = await handleResponse<{ items: NewsCategory[] }>(response);
  return data.items;
}

export async function getPublicNewsCategories(): Promise<NewsCategory[]> {
  const response = await fetch(`${API_BASE}/api/news/categories/public`);
  const data = await handleResponse<{ items: NewsCategory[] }>(response);
  return data.items;
}

export async function createNewsCategory(input: { nameHu: string; nameEn: string }): Promise<NewsCategory> {
  const response = await fetch(`${API_BASE}/api/news/categories`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return handleResponse<NewsCategory>(response);
}

export async function updateNewsCategory(
  id: string,
  input: { nameHu: string; nameEn: string },
): Promise<NewsCategory> {
  const response = await fetch(`${API_BASE}/api/news/categories/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return handleResponse<NewsCategory>(response);
}

export async function deleteNewsCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/news/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    await handleResponse(response);
  }
}

export async function createNews(article: NewsInput): Promise<NewsArticle> {
  const response = await fetch(`${API_BASE}/api/news`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  });

  const data = await handleResponse<NewsArticle>(response);
  broadcastUpdate(data.id);
  return data;
}

export async function updateNews(id: string, article: NewsInput): Promise<NewsArticle> {
  const response = await fetch(`${API_BASE}/api/news/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  });

  const data = await handleResponse<NewsArticle>(response);
  broadcastUpdate(id);
  return data;
}

export async function deleteNews(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/news/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    await handleResponse(response);
  }

  broadcastUpdate(id);
}

export const NEWS_EVENT = EVENT_NAME;
