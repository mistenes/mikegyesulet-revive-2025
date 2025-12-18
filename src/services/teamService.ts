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

export interface TeamMember {
    id: string;
    name: string;
    position: string;
    email: string;
    section: string;
    image_url: string;
    sort_order: number;
}

export type TeamMemberInput = Omit<TeamMember, "id" | "sort_order"> & { sort_order?: number };

export async function getTeamMembers(): Promise<TeamMember[]> {
    const response = await fetch(`${API_BASE}/api/team-members`);
    const data = await handleResponse<{ items: TeamMember[] }>(response);
    return data.items;
}

export async function createTeamMember(data: TeamMemberInput): Promise<TeamMember> {
    const response = await fetch(`${API_BASE}/api/admin/team-members`, {
        method: "POST",
        headers: withCsrfHeader({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse<TeamMember>(response);
}

export async function updateTeamMember(id: string, data: TeamMemberInput): Promise<TeamMember> {
    const response = await fetch(`${API_BASE}/api/admin/team-members/${id}`, {
        method: "PUT",
        headers: withCsrfHeader({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse<TeamMember>(response);
}

export async function deleteTeamMember(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/admin/team-members/${id}`, {
        method: "DELETE",
        headers: withCsrfHeader(),
        credentials: "include",
    });
    return handleResponse<void>(response);
}

export async function reorderTeamMembers(items: { id: string; sort_order: number }[]): Promise<void> {
    const response = await fetch(`${API_BASE}/api/admin/team-members/reorder`, {
        method: "POST",
        headers: withCsrfHeader({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ items }),
    });
    return handleResponse<void>(response);
}
