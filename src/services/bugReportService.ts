import { withCsrfHeader } from '@/utils/csrf';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export type BugReportPayload = {
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  severity?: string;
};

export async function submitBugReport(payload: BugReportPayload): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/bugreports`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...withCsrfHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || 'Nem sikerült elküldeni a hibajelentést');
  }
}
