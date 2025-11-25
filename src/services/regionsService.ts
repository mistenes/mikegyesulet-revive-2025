import { regionsData } from "@/data/regions";
import type { Region, RegionInput } from "@/types/region";
import { withCsrfHeader } from "@/utils/csrf";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EVENT_NAME = "regions-updated";
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

function broadcastUpdate(id?: string) {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id } }));
}

export async function getPublicRegions(): Promise<Region[]> {
  try {
    const response = await fetch(`${defaultBase}/api/regions/public`);
    const data = await handleResponse<{ items: Region[] }>(response);
    if (Array.isArray(data.items) && data.items.length > 0) return data.items;
  } catch (error) {
    // ignore and fall back
  }

  return regionsData;
}

export async function getAdminRegions(): Promise<Region[]> {
  try {
    const response = await fetch(`${defaultBase}/api/regions`, { credentials: "include" });
    const data = await handleResponse<{ items: Region[] }>(response);
    if (Array.isArray(data.items)) return data.items;
  } catch (error) {
    // ignore and fall back
  }

  return regionsData;
}

export async function createRegion(input: RegionInput): Promise<Region> {
  const response = await fetch(`${defaultBase}/api/regions`, {
    method: "POST",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });

  const data = await handleResponse<{ item: Region }>(response);
  broadcastUpdate(data.item.id);
  return data.item;
}

export async function updateRegion(id: string, input: RegionInput): Promise<Region> {
  const response = await fetch(`${defaultBase}/api/regions/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });

  const data = await handleResponse<{ item: Region }>(response);
  broadcastUpdate(data.item.id);
  return data.item;
}

export async function deleteRegion(id: string): Promise<void> {
  const response = await fetch(`${defaultBase}/api/regions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
  });

  await handleResponse<Record<string, never>>(response);
  broadcastUpdate(id);
}

export const REGIONS_EVENT = EVENT_NAME;
