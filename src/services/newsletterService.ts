import { withCsrfHeader } from "@/utils/csrf";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

type ErrorPayload = { message?: string };

function extractErrorMessage(payload: unknown): string {
    if (payload && typeof payload === "object" && "message" in payload && typeof (payload as ErrorPayload).message === "string") {
        return (payload as ErrorPayload).message as string;
    }
    return "Ismeretlen hiba történt";
}

async function handleResponse<T>(response: Response): Promise<T> {
    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch {
        // ignore
    }

    if (!response.ok) {
        const message = extractErrorMessage(payload);
        throw new Error(message);
    }

    return payload as T;
}

export interface Subscriber {
    id: string;
    email: string;
    name: string;
    verified: boolean;
    created_at: string;
    verified_at?: string;
}

export async function getSubscribers(): Promise<Subscriber[]> {
    const response = await fetch(`${API_BASE}/api/admin/newsletter/subscribers`, {
        credentials: "include"
    });
    const data = await handleResponse<{ items: Subscriber[] }>(response);
    return data.items;
}

export interface NewsletterDraft {
    subject: string;
    content_json?: unknown;
    content_html: string;
}

export interface NewsletterSendStats {
    sent: number;
    failed: number;
}

export async function getDraft(): Promise<NewsletterDraft | null> {
    const response = await fetch(`${API_BASE}/api/admin/newsletter/draft`, {
        credentials: "include"
    });
    return handleResponse(response);
}

export async function saveDraft(data: NewsletterDraft): Promise<void> {
    const response = await fetch(`${API_BASE}/api/admin/newsletter/draft`, {
        method: "POST",
        credentials: "include",
        headers: withCsrfHeader({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function sendNewsletter(subject: string, htmlContent: string, testEmail?: string): Promise<{ message: string; stats?: NewsletterSendStats }> {
    const response = await fetch(`${API_BASE}/api/admin/newsletter/send`, {
        method: "POST",
        credentials: "include",
        headers: withCsrfHeader({ "Content-Type": "application/json" }),
        body: JSON.stringify({ subject, htmlContent, testEmail }),
    });

    return handleResponse(response);
}

// Bunny Storage Integration for Designs

const BUNNY_NEWSLETTER_PATH = "/newsletter"; // Base folder in Bunny

type BunnyObject = {
    ObjectName: string;
    IsDirectory: boolean;
};

export async function listDesignsFromBunny(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/bunny/storage?path=${encodeURIComponent(BUNNY_NEWSLETTER_PATH)}&directory=true`, {
        credentials: "include"
    });
    const data = await handleResponse<BunnyObject[]>(response);
    // Bunny returns objects with { ObjectName: "foo.json", ... }
    // We only want JSON files
    return data
        .filter((item) => !item.IsDirectory && item.ObjectName.endsWith('.json'))
        .map((item) => item.ObjectName);
}

export async function saveDesignToBunny(filename: string, content: NewsletterDraft): Promise<void> {
    // Ensure filename ends with .json
    const finalName = filename.endsWith('.json') ? filename : `${filename}.json`;
    const path = `${BUNNY_NEWSLETTER_PATH}/${finalName}`;

    const response = await fetch(`${API_BASE}/api/bunny/storage?path=${encodeURIComponent(path)}`, {
        method: "PUT",
        credentials: "include",
        headers: withCsrfHeader({ "Content-Type": "application/json" }),
        body: JSON.stringify(content),
    });

    if (!response.ok) {
        throw new Error("Failed to save design to storage");
    }
}

export async function loadDesignFromBunny(filename: string): Promise<NewsletterDraft> {
    const path = `${BUNNY_NEWSLETTER_PATH}/${filename}`;
    const response = await fetch(`${API_BASE}/api/bunny/storage?path=${encodeURIComponent(path)}`, {
        credentials: "include"
    });
    return handleResponse(response);
}

export async function deleteDesignFromBunny(filename: string): Promise<void> {
    const path = `${BUNNY_NEWSLETTER_PATH}/${filename}`;
    const response = await fetch(`${API_BASE}/api/bunny/storage?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
        credentials: "include",
        headers: withCsrfHeader(),
    });

    if (!response.ok) {
        throw new Error("Failed to delete design");
    }
}
