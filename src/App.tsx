import { useEffect, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getSettings } from "@/services/settingsService";
import { getLocalizedPath } from "@/lib/localePaths";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminPages from "./pages/admin/AdminPages";
import AdminNews from "./pages/admin/AdminNews";
import AdminNewsNewArticle from "./pages/admin/AdminNewsNewArticle";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRegions from "./pages/admin/AdminRegions";
import AcceptInvite from "./pages/admin/AcceptInvite";
import AdminFileManager from "./pages/admin/AdminFileManager";
import AdminDocuments from "./pages/admin/AdminDocuments";
import Rolunk from "./pages/Rolunk";
import Regiok from "./pages/Regiok";
import Kapcsolat from "./pages/Kapcsolat";
import Dokumentumok from "./pages/Dokumentumok";
import Projektek from "./pages/Projektek";
import ProjectPage from "./pages/ProjectPage";
import Galeria from "./pages/Galeria";
import GalleryAlbumPage from "./pages/GalleryAlbumPage";
import NotFound from "./pages/NotFound";
import NewsArticlePage from "./pages/NewsArticle";
import NewsIndex from "./pages/NewsIndex";
import { LanguageRouteSync } from "./components/LanguageRouteSync";
import { LocalizedRoute } from "./components/LocalizedRoute";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const settings = getSettings();
    const faviconUrl = (settings.general.site_favicon?.value as string | undefined)?.trim();
    const existingLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");

    if (faviconUrl) {
      const link = existingLink || document.createElement("link");
      link.rel = "icon";
      link.href = faviconUrl;
      if (!existingLink) {
        document.head.appendChild(link);
      }
    } else if (existingLink) {
      document.head.removeChild(existingLink);
    }
  }, []);

  const publicRoutes = useMemo(
    () => [
      { path: "/", element: <Index /> },
      { path: "/rolunk", element: <Rolunk /> },
      { path: "/regiok", element: <Regiok /> },
      { path: "/kapcsolat", element: <Kapcsolat /> },
      { path: "/dokumentumok", element: <Dokumentumok /> },
      { path: "/projektek", element: <Projektek /> },
      { path: "/projektek/:slug", element: <ProjectPage /> },
      { path: "/galeria", element: <Galeria /> },
      { path: "/galeria/:slug", element: <GalleryAlbumPage /> },
      { path: "/news", element: <NewsIndex /> },
      { path: "/news/:slug", element: <NewsArticlePage /> },
    ],
    []
  );

  const renderLocalizedRoutes = (base: string, locale: "hu" | "en") =>
    publicRoutes.map(({ path, element }) => {
      const normalizedPath = path === "/" ? base || "/" : `${base}${path}`;

      return (
        <Route
          key={`${locale}-${path}`}
          path={getLocalizedPath(normalizedPath, locale)}
          element={<LocalizedRoute locale={locale} element={element} />}
        />
      );
    });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <LanguageProvider>
            <LanguageRouteSync />
            <Toaster />
            <Sonner />
            <Routes>
              {renderLocalizedRoutes("", "hu")}
              {renderLocalizedRoutes("/en", "en")}
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/pages" element={<AdminPages />} />
              <Route path="/admin/pages/:pageSlug" element={<AdminPages />} />
              <Route path="/admin/regions" element={<AdminRegions />} />
              <Route path="/admin/news/new-article" element={<AdminNewsNewArticle />} />
              <Route path="/admin/news" element={<AdminNews />} />
              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/admin/gallery" element={<AdminGallery />} />
              <Route path="/admin/documents" element={<AdminDocuments />} />
              <Route path="/admin/file-manager" element={<AdminFileManager />} />
              <Route path="/admin/media" element={<AdminMedia />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/accept-invite" element={<AcceptInvite />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
