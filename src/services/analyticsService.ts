export type VisitorStats = {
  pastHour: number;
  past24Hours: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  configured?: boolean;
  message?: string;
};

export async function fetchVisitorStats(): Promise<VisitorStats> {
  const response = await fetch('/api/admin/analytics/visitors', {
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Nem sikerült lekérni az analitika adatokat');
  }

  return response.json();
}
