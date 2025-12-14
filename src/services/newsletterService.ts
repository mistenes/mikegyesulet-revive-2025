import { withCsrfHeader } from "@/utils/csrf";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function handleResponse<T>(response: Response): Promise<T> {
    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch (error) {
        // ignore
    }

    if (!response.ok) {
        const message = (payload as any)?.message || "Ismeretlen hiba történt";
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

export async function sendNewsletter(subject: string, htmlContent: string, testEmail?: string): Promise<{ message: string; stats?: any }> {
    const response = await fetch(`${API_BASE}/api/admin/newsletter/send`, {
        method: "POST",
        credentials: "include",
        headers: withCsrfHeader({ "Content-Type": "application/json" }),
        body: JSON.stringify({ subject, htmlContent, testEmail }),
    });

    return handleResponse(response);
}
