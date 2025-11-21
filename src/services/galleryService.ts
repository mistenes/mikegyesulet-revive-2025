import type { GalleryAlbum, GalleryAlbumInput } from "@/types/gallery";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EVENT_NAME = "gallery-updated";
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
    const message = (payload as { message?: string } | null)?.message || "Ismeretlen hiba történt";
    throw new Error(message);
  }

  return payload as T;
}

function broadcastUpdate() {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export async function getPublicGallery(): Promise<GalleryAlbum[]> {
  const response = await fetch(new URL("/api/gallery/public", defaultBase).toString());
  const data = await handleResponse<{ items: GalleryAlbum[] }>(response);
  return data.items;
}

export async function getAdminGallery(): Promise<GalleryAlbum[]> {
  const response = await fetch(new URL("/api/gallery", defaultBase).toString(), { credentials: "include" });
  const data = await handleResponse<{ items: GalleryAlbum[] }>(response);
  return data.items;
}

export async function createAlbum(payload: GalleryAlbumInput): Promise<GalleryAlbum> {
  const response = await fetch(new URL("/api/gallery", defaultBase).toString(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<GalleryAlbum>(response);
  broadcastUpdate();
  return data;
}

export async function updateAlbum(id: string, payload: GalleryAlbumInput): Promise<GalleryAlbum> {
  const response = await fetch(new URL(`/api/gallery/${id}`, defaultBase).toString(), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<GalleryAlbum>(response);
  broadcastUpdate();
  return data;
}

export async function deleteAlbum(id: string): Promise<void> {
  const response = await fetch(new URL(`/api/gallery/${id}`, defaultBase).toString(), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    await handleResponse(response);
  }

  broadcastUpdate();
}

export async function reorderAlbums(order: string[]): Promise<void> {
  const response = await fetch(new URL("/api/gallery/reorder", defaultBase).toString(), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });

  await handleResponse(response);
  broadcastUpdate();
}

export const GALLERY_EVENT = EVENT_NAME;
