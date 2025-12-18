import { useEffect, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as CookieConsent from "vanilla-cookieconsent";
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
import AdminResetPassword from "./pages/admin/AdminResetPassword";
import AdminFileManager from "./pages/admin/AdminFileManager";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminBugReport from "./pages/admin/AdminBugReport";
import AdminFooterContent from "./pages/admin/AdminFooterContent";
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
    const applyFavicon = (faviconUrl?: string | null) => {
      const cleanedUrl = faviconUrl?.trim();
      const existingLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");

      if (cleanedUrl) {
        const link = existingLink || document.createElement("link");
        link.rel = "icon";
        link.href = cleanedUrl;
        if (!existingLink) {
          document.head.appendChild(link);
        }
      } else if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };

    const settings = getSettings();
    applyFavicon(settings.general.site_favicon?.value as string | undefined);

    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<ReturnType<typeof getSettings>>).detail;
      const newFavicon = detail?.general?.site_favicon?.value as string | undefined;
      applyFavicon(newFavicon);
    };

    window.addEventListener("mik-settings-updated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("mik-settings-updated", handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    const gaScriptId = "ga-script";
    const gaInlineScriptId = "ga-inline-config";

    const setGaDisabled = (isAllowed: boolean) => {
      if (!measurementId) return;
      (window as typeof window & { [key: string]: boolean })[
        `ga-disable-${measurementId}`
      ] = !isAllowed;
    };

    const injectGaScripts = () => {
      if (!measurementId) return;
      if (document.getElementById(gaScriptId)) return;

      const gtmScript = document.createElement("script");
      gtmScript.async = true;
      gtmScript.id = gaScriptId;
      gtmScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

      const inlineScript = document.createElement("script");
      inlineScript.id = gaInlineScriptId;
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;

      document.head.appendChild(gtmScript);
      document.head.appendChild(inlineScript);
    };

    const syncAnalyticsConsent = () => {
      const analyticsAccepted = CookieConsent.acceptedCategory("analytics");
      setGaDisabled(analyticsAccepted);

      if (analyticsAccepted) {
        injectGaScripts();
      }
    };

    CookieConsent.run({
      disablePageInteraction: false,
      guiOptions: {
        consentModal: {
          layout: "bar",
          position: "bottom center",
          flipButtons: true,
          equalWeightButtons: true,
        },
        preferencesModal: {
          layout: "box",
          position: "right",
          equalWeightButtons: true,
        },
      },
      categories: {
        necessary: { readOnly: true },
        analytics: {},
      },
      language: {
        default: "hu",
        translations: {
          hu: {
            consentModal: {
              title: "Sütik használata",
              description:
                "A weboldal sütiket használ a működéshez és az élmény javításához. A kötelező sütik az oldal alapvető működését biztosítják, az analitikai sütik segítenek jobban megérteni a látogatottságot.",
              acceptAllBtn: "Minden süti elfogadása",
              acceptNecessaryBtn: "Csak a szükségeseket",
              showPreferencesBtn: "Beállítások kezelése",
              closeIconLabel: "Bezárás",
            },
            preferencesModal: {
              title: "Süti beállítások",
              acceptAllBtn: "Minden süti elfogadása",
              acceptNecessaryBtn: "Csak a szükségeseket",
              savePreferencesBtn: "Beállítások mentése",
              closeIconLabel: "Bezárás",
              serviceCounterLabel: "szolgáltatás",
              sections: [
                {
                  title: "Szükséges sütik",
                  description:
                    "Ezek a sütik nélkülözhetetlenek a weboldal megfelelő működéséhez (pl. alapvető biztonsági és munkamenet-kezelési feladatok).",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analitikai sütik",
                  description:
                    "A Google Analytics segítségével anonim statisztikákat gyűjtünk, hogy jobban értsük, hogyan használják a látogatók az oldalt.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
      onConsent: syncAnalyticsConsent,
      onChange: syncAnalyticsConsent,
    });

    syncAnalyticsConsent();

    return () => {
      const script = document.getElementById(gaScriptId);
      const inlineScript = document.getElementById(gaInlineScriptId);

      if (script?.parentNode) {
        script.parentNode.removeChild(script);
      }

      if (inlineScript?.parentNode) {
        inlineScript.parentNode.removeChild(inlineScript);
      }
    };
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
              <Route path="/admin/bugreport" element={<AdminBugReport />} />
              <Route path="/admin/footer-content" element={<AdminFooterContent />} />
              <Route path="/admin/accept-invite" element={<AcceptInvite />} />
              <Route path="/admin/reset-password" element={<AdminResetPassword />} />
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
