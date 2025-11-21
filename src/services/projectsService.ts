import type { Project, ProjectInput } from "@/types/project";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EVENT_NAME = "projects-updated";
const isBrowser = typeof window !== "undefined";

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

function broadcastUpdate() {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export async function getAdminProjects(params: { search?: string; status?: "all" | "published" | "draft" } = {}) {
  const url = new URL(`${API_BASE}/api/projects`);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.status) url.searchParams.set("status", params.status);

  const response = await fetch(url.toString(), { credentials: "include" });
  const data = await handleResponse<{ items: Project[] }>(response);
  return data.items;
}

export async function getPublicProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE}/api/projects/public`);
  const data = await handleResponse<{ items: Project[] }>(response);
  return data.items;
}

export async function createProject(project: ProjectInput): Promise<Project> {
  const response = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });

  const data = await handleResponse<Project>(response);
  broadcastUpdate();
  return data;
}

export async function updateProject(id: string, project: ProjectInput): Promise<Project> {
  const response = await fetch(`${API_BASE}/api/projects/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });

  const data = await handleResponse<Project>(response);
  broadcastUpdate();
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/projects/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    await handleResponse(response);
  }

  broadcastUpdate();
}

export async function reorderProjects(order: string[]): Promise<void> {
  const response = await fetch(`${API_BASE}/api/projects/reorder`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });

  await handleResponse(response);
  broadcastUpdate();
}

export const PROJECTS_EVENT = EVENT_NAME;
