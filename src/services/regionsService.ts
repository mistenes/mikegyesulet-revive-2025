import { regionsData } from "@/data/regions";
import type { Region, RegionInput } from "@/types/region";
import { withCsrfHeader } from "@/utils/csrf";
import { readJson, writeJson } from "./storage";

const STORAGE_KEY = "mik-regions";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EVENT_NAME = "regions-updated";
const isBrowser = typeof window !== "undefined";
const defaultBase = API_BASE || (isBrowser ? window.location.origin : "http://localhost");

const fallbackId = () => Date.now().toString(36);

function loadLocalRegions(): Region[] {
  return readJson<Region[]>(STORAGE_KEY, regionsData);
}

function persistLocalRegions(items: Region[], id?: string, shouldBroadcast = true) {
  writeJson(STORAGE_KEY, items);
  if (shouldBroadcast) {
    broadcastUpdate(id);
  }
}

function upsertLocalRegion(region: Region) {
  const existing = loadLocalRegions();
  const index = existing.findIndex((item) => item.id === region.id);
  const next = index >= 0 ? existing.map((item) => (item.id === region.id ? region : item)) : [...existing, region];
  persistLocalRegions(next, region.id);
  return region;
}

function removeLocalRegion(id: string) {
  const existing = loadLocalRegions();
  const next = existing.filter((item) => item.id !== id);
  persistLocalRegions(next, id);
}

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
    if (Array.isArray(data.items) && data.items.length > 0) {
      persistLocalRegions(data.items, undefined, false);
      return data.items;
    }
  } catch (error) {
    // ignore and fall back
  }

  return loadLocalRegions();
}

export async function getAdminRegions(): Promise<Region[]> {
  try {
    const response = await fetch(`${defaultBase}/api/regions`, { credentials: "include" });
    const data = await handleResponse<{ items: Region[] }>(response);
    if (Array.isArray(data.items)) {
      persistLocalRegions(data.items, undefined, false);
      return data.items;
    }
  } catch (error) {
    // ignore and fall back
  }

  return loadLocalRegions();
}

export async function createRegion(input: RegionInput): Promise<Region> {
  const response = await fetch(`${defaultBase}/api/regions`, {
    method: "POST",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });

  try {
    const data = await handleResponse<{ item: Region }>(response);
    return upsertLocalRegion(data.item);
  } catch (error) {
    console.error(error);
    const fallback: Region = { ...input, id: input.id || fallbackId() } as Region;
    return upsertLocalRegion(fallback);
  }
}

export async function updateRegion(id: string, input: RegionInput): Promise<Region> {
  const response = await fetch(`${defaultBase}/api/regions/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });

  try {
    const data = await handleResponse<{ item: Region }>(response);
    return upsertLocalRegion(data.item);
  } catch (error) {
    console.error(error);
    const fallback: Region = { ...input, id } as Region;
    return upsertLocalRegion(fallback);
  }
}

export async function deleteRegion(id: string): Promise<void> {
  const response = await fetch(`${defaultBase}/api/regions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
  });

  try {
    await handleResponse<Record<string, never>>(response);
    removeLocalRegion(id);
  } catch (error) {
    console.error(error);
    removeLocalRegion(id);
  }
}

export const REGIONS_EVENT = EVENT_NAME;
