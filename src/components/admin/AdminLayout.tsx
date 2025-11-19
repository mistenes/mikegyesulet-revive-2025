import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAdminSession } from "@/hooks/useAdminSession";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAdminSession();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Kijelentkezve");
    } catch (error) {
      console.error("Logout error", error);
      toast.error("Nem sikerült kijelentkezni");
    } finally {
      navigate("/auth");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Admin Header */}
          <header className="border-b border-border bg-card sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                      Admin
                    </h1>
                  </div>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Kijelentkezés
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
