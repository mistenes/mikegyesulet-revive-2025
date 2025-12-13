import { withCsrfHeader } from "@/utils/csrf";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type NewsletterList = {
  id: number;
  name: string;
  uuid?: string;
  subscriber_count?: number;
};

export type NewsletterCampaign = {
  id: number;
  name: string;
  subject: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type NewsletterOverview = {
  configured: boolean;
  message?: string;
  defaultListId?: number;
  lists: NewsletterList[];
  campaigns: NewsletterCampaign[];
};

export async function subscribeToNewsletter(email: string, name?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Nem sikerült feliratkozni a hírlevélre");
  }
}

export async function fetchNewsletterOverview(): Promise<NewsletterOverview> {
  const response = await fetch(`${API_BASE}/api/admin/newsletter/overview`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Nem sikerült lekérni a hírlevél adatokat");
  }

  return response.json();
}

export type CreateNewsletterCampaignInput = {
  subject: string;
  name?: string;
  preheader?: string;
  listIds?: number[];
  html: string;
  text?: string;
  sendNow?: boolean;
};

export async function createNewsletterCampaign(input: CreateNewsletterCampaignInput): Promise<NewsletterCampaign> {
  const response = await fetch(`${API_BASE}/api/admin/newsletter/campaigns`, {
    method: "POST",
    credentials: "include",
    headers: { ...withCsrfHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Nem sikerült menteni a hírlevelet");
  }

  return response.json();
}

export async function sendNewsletterCampaign(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/newsletter/campaigns/${id}/send`, {
    method: "POST",
    credentials: "include",
    headers: withCsrfHeader(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Nem sikerült elküldeni a hírlevelet");
  }
}
