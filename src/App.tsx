import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getSettings } from "@/services/settingsService";
import mikLogo from "@/assets/mik-logo.svg";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminPages from "./pages/admin/AdminPages";
import AdminNews from "./pages/admin/AdminNews";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminMedia from "./pages/admin/AdminMedia";
import Rolunk from "./pages/Rolunk";
import Regiok from "./pages/Regiok";
import Kapcsolat from "./pages/Kapcsolat";
import Dokumentumok from "./pages/Dokumentumok";
import Projektek from "./pages/Projektek";
import Galeria from "./pages/Galeria";
import NotFound from "./pages/NotFound";
import NewsArticlePage from "./pages/NewsArticle";
import NewsIndex from "./pages/NewsIndex";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const settings = getSettings();
    const faviconUrl =
      settings.general.site_favicon?.value || settings.general.site_logo?.value || mikLogo;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = faviconUrl;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/rolunk" element={<Rolunk />} />
              <Route path="/regiok" element={<Regiok />} />
              <Route path="/kapcsolat" element={<Kapcsolat />} />
              <Route path="/dokumentumok" element={<Dokumentumok />} />
              <Route path="/projektek" element={<Projektek />} />
              <Route path="/galeria" element={<Galeria />} />
              <Route path="/news" element={<NewsIndex />} />
              <Route path="/news/:slug" element={<NewsArticlePage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/pages" element={<AdminPages />} />
              <Route path="/admin/news" element={<AdminNews />} />
              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/admin/gallery" element={<AdminGallery />} />
              <Route path="/admin/media" element={<AdminMedia />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
