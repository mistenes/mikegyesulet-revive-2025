import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, type AdminUser } from "@/lib/authService";

export function useAdminSession() {
  const queryClient = useQueryClient();

  const query = useQuery<AdminUser | null>({
    queryKey: ["adminSession"],
    queryFn: authService.validateSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logout = async () => {
    await authService.logout();
    queryClient.removeQueries({ queryKey: ["adminSession"] });
  };

  return { ...query, logout };
}

