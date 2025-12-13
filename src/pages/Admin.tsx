import { Card } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { fetchVisitorStats } from "@/services/analyticsService";

export default function Admin() {
  const { isLoading, session } = useAdminAuthGuard();
  const {
    data: visitorStats,
    isLoading: isLoadingVisitors,
    isError: visitorError,
  } = useQuery({
    queryKey: ["admin-visitor-stats"],
    queryFn: fetchVisitorStats,
  });

  const visitorStatItems = [
    { label: "Elmúlt óra", value: visitorStats?.pastHour ?? 0 },
    { label: "Elmúlt 24 óra", value: visitorStats?.past24Hours ?? 0 },
    { label: "Ez a hét", value: visitorStats?.thisWeek ?? 0 },
    { label: "Ez a hónap", value: visitorStats?.thisMonth ?? 0 },
    { label: "Ez az év", value: visitorStats?.thisYear ?? 0 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
              Üdvözöllek az Admin felületen!
            </h1>
            <p className="text-muted-foreground">
              Használd a bal oldali menüt a navigációhoz
            </p>
          </div>
        </div>

        {!session.mfaEnabled && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Kétlépcsős azonosítás ajánlott</AlertTitle>
            <AlertDescription>
              A fiókod jelenleg nem védett 2FA-val. Kapcsold be a Biztonság menüpontban, hogy megakadályozd az illetéktelen
              hozzáférést.
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Látogatottsági adatok</p>
              <h2 className="text-xl font-semibold">Google Analytics</h2>
              {visitorStats?.message && (
                <p className="text-sm text-muted-foreground">{visitorStats.message}</p>
              )}
              {!visitorStats?.configured && !visitorStats?.message && (
                <p className="text-sm text-muted-foreground">A mérések eléréséhez állítsd be a GA4 hitelesítő adatokat.</p>
              )}
            </div>
            {isLoadingVisitors && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {visitorStatItems.map((stat) => (
              <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold" aria-live="polite">
                  {stat.value.toLocaleString("hu-HU")}
                </p>
              </div>
            ))}
          </div>

          {visitorError && (
            <p className="text-sm text-destructive">Nem sikerült betölteni az analitika adatokat.</p>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Kezdés</h2>
          <p className="text-sm text-muted-foreground">
            Válaszd ki a bal oldali menüből a szerkeszteni kívánt tartalmat, vagy látogasd meg a Biztonság menüpontot az
            adminisztrációs fiók védelmének erősítéséhez.
          </p>
        </Card>

      </div>
    </AdminLayout>
  );
}
