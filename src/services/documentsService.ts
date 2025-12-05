import { defaultDocuments } from "@/data/documents";
import { type Document, type DocumentPayload } from "@/types/documents";
import { withCsrfHeader } from "@/utils/csrf";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

type DocumentImportItem = Omit<DocumentPayload, "url"> & {
  sourceUrl: string;
  targetPath: string;
  url?: string;
};

export type DocumentImportPayload = {
  closingStatements: DocumentImportItem[];
  documents: DocumentImportItem[];
};

function normalizeDocuments(payload: unknown): Document[] {
  if (!payload || typeof payload !== "object") return [];

  const documents = Array.isArray((payload as { documents?: unknown }).documents)
    ? ((payload as { documents?: Document[] }).documents as Document[])
    : Array.isArray(payload)
      ? (payload as Document[])
      : [];

  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    titleEn: doc.titleEn || doc.title,
    location: doc.location || undefined,
    date: doc.date || "",
    url: doc.url,
    category: doc.category,
  }));
}

async function handleResponse(response: Response) {
  let data: unknown = null;
  try {
    data = await response.json();
  } catch (error) {
    // ignore
  }

  if (!response.ok) {
    const message = (data as { message?: string })?.message || "Ismeretlen hiba történt";
    throw new Error(message);
  }

  return data;
}

export async function fetchDocuments(): Promise<Document[]> {
  try {
    const response = await fetch(`${API_BASE}/api/documents`);
    const data = await handleResponse(response);
    const docs = normalizeDocuments(data);
    return docs.length ? docs : defaultDocuments;
  } catch (error) {
    return defaultDocuments;
  }
}

export async function fetchAdminDocuments(): Promise<Document[]> {
  const response = await fetch(`${API_BASE}/api/admin/documents`, {
    credentials: "include",
  });
  const data = await handleResponse(response);
  return normalizeDocuments(data);
}

export async function importDocuments(payload: DocumentImportPayload): Promise<Document[]> {
  const response = await fetch(`${API_BASE}/api/admin/documents/import`, {
    method: "POST",
    credentials: "include",
    headers: withCsrfHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse(response);
  return normalizeDocuments(data);
}
