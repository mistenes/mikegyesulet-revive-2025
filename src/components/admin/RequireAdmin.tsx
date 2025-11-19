import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminSession } from "@/hooks/useAdminSession";

interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const location = useLocation();
  const { data, isLoading, isError, error, refetch } = useAdminSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Munkamenet ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-3">
          <p className="text-destructive font-semibold">Hiba történt a munkamenet ellenőrzésekor.</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Ismeretlen hiba"}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Újrapróbálás
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

