import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSectionContent } from "@/hooks/useSectionContent";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";

interface Region {
  name: string;
  coordinates: [number, number];
  description: string;
  color: string;
  members: string;
}

const regions: Region[] = [
  {
    name: "Magyarország",
    coordinates: [19.0402, 47.4979], // Budapest
    description: "Magyarország, ahol központi koordinációt végzünk az ifjúsági szervezetek számára.",
    color: "#FF6B35",
    members: "Magyar ifjúsági szervezetek",
  },
  {
    name: "Erdély",
    coordinates: [23.6236, 46.7712], // Székelyföld
    description: "Erdély, a Kárpát-medence szívében, gazdag magyar kulturális örökséggel.",
    color: "#F7931E",
    members: "Romániai Magyar Ifjúsági Szervezetek Szövetsége (RAMISZ)",
  },
  {
    name: "Felvidék",
    coordinates: [19.1500, 48.1486], // Pozsony környéke
    description: "A Felvidék történelmi emlékei és élő magyar közösségei.",
    color: "#FFC857",
    members: "Ifjú Szívek Szlovákiai Magyar Ifjúsági Kerekasztal",
  },
  {
    name: "Kárpátalja",
    coordinates: [22.7200, 48.4500], // Ungvár környéke
    description: "Kárpátalja, ahol a Kárpátok lábánál élő magyarság őrzi identitását.",
    color: "#8B5CF6",
    members: "Kárpátaljai Magyar Ifjúsági Szervezetek Fóruma (KMIF)",
  },
  {
    name: "Vajdaság",
    coordinates: [19.8335, 45.2671], // Újvidék
    description: "Vajdaság sokszínű kulturális életben a magyarság aktív közösséget alkot.",
    color: "#E63946",
    members: "Vajdasági Ifjúsági Fórum (VIF)",
  },
  {
    name: "Horvátország",
    coordinates: [18.5500, 45.9500], // Baranya környéke
    description: "Horvátországi magyarság megőrzi nyelvét és kultúráját a Dráva mentén.",
    color: "#06B6D4",
    members: "Horvátországi Magyarok Ifjúsági Szervezeteinek Fóruma (HMIF)",
  },
  {
    name: "Muravidék",
    coordinates: [16.3500, 46.6600], // Lendva
    description: "Szlovéniai magyar közösség aktívan részt vesz a régió kulturális életében.",
    color: "#10B981",
    members: "Lendvai Magyar Ifjúsági Egyesület (LMIE)",
  },
  {
    name: "Burgenland",
    coordinates: [16.5400, 47.8500], // Felsőőr környéke
    description: "Burgenlandi magyarok őrzik hagyományaikat Ausztriában.",
    color: "#EC4899",
    members: "Burgenlandi Magyarok Népfőiskolája",
  },
  {
    name: "Bánság és Regát",
    coordinates: [21.2300, 45.7500], // Temesvár
    description: "A Bánság és a Regát magyarságának kulturális központja.",
    color: "#A855F7",
    members: "Országos Magyar Diákszövetség (OMDSZ)",
  },
  {
    name: "Nyugati Diaszpóra",
    coordinates: [13.4050, 52.5200], // Berlin (reprezentatív)
    description: "Nyugat-európai magyar közösségek összefogása.",
    color: "#F59E0B",
    members: "Nyugat-európai Magyar Szervezetek",
  },
];

export const RegionsMap = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { language } = useLanguage();
  const adminPreview = isAdminPreview();
  const { content: mapSection, isLoading: mapContentLoading } = useSectionContent("map_section");

  const mapContent = useMemo(() => {
    const localized = (mapSection?.[language] || mapSection?.hu) as
      | { title?: string; description?: string }
      | undefined;
    const fallback = (defaultPageContent.map_section?.[language] || defaultPageContent.map_section?.hu) as
      | { title?: string; description?: string }
      | undefined;

    return localized || fallback || {};
  }, [language, mapSection]);

  const isHidden = mapSection?.isVisible === false && !adminPreview;

  const handleMapTextClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("map_section", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const initializeMap = useCallback((token?: string) => {
    const tokenToUse = token || mapboxToken;
    if (!mapContainer.current || !tokenToUse) return;

    try {
      // Add custom styles for popups only
      const style = document.createElement('style');
      style.textContent = `
        .mapboxgl-popup-content {
          padding: 0 !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
          border-radius: 16px !important;
          overflow: hidden;
        }

        .mapboxgl-popup-tip {
          border-top-color: rgba(255, 255, 255, 0.95) !important;
        }
      `;
      document.head.appendChild(style);

      mapboxgl.accessToken = tokenToUse;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [21.0, 47.5], // Center on Carpathian Basin
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
        antialias: true,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        "top-right"
      );

      // Enable scroll zoom
      map.current.scrollZoom.enable();

      // Wait for map to load before adding markers
      map.current.on('load', () => {
        if (!map.current) return;

        map.current.resize();

        // Track currently open popup
        let currentPopup: mapboxgl.Popup | null = null;

        // Add simple markers for each region
        regions.forEach((region) => {
          if (!map.current) return;

          // Create simple marker element
          const el = document.createElement("div");
          el.style.cssText = `
            background: ${region.color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          `;

          // Create enhanced popup content with glassmorphism
          const popupContent = `
            <div style="
              padding: 20px;
              min-width: 280px;
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 16px;
              border: 1px solid rgba(255, 255, 255, 0.5);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            ">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: linear-gradient(135deg, ${region.color}, ${region.color}dd);
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 12px ${region.color}40;
                ">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <h3 style="
                  margin: 0;
                  font-size: 20px;
                  font-weight: 700;
                  color: #1a1a1a;
                  font-family: 'Sora', sans-serif;
                ">
                  ${region.name}
                </h3>
              </div>
              <p style="
                margin: 0 0 16px 0;
                font-size: 14px;
                line-height: 1.6;
                color: #555;
              ">
                ${region.description}
              </p>
              <div style="
                padding: 12px;
                background: linear-gradient(135deg, ${region.color}15, ${region.color}08);
                border-radius: 10px;
                border-left: 3px solid ${region.color};
              ">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                  Tagszervezet
                </p>
                <p style="margin: 0; font-size: 13px; font-weight: 500; color: #333; line-height: 1.4;">
                  ${region.members}
                </p>
              </div>
            </div>
          `;

          // Create popup with custom styling
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            className: 'custom-popup',
            maxWidth: '320px'
          }).setHTML(popupContent);

          // Add marker to map
          const marker = new mapboxgl.Marker(el)
            .setLngLat(region.coordinates)
            .setPopup(popup)
            .addTo(map.current!);

          // Close previous popup when new one opens
          el.addEventListener('click', () => {
            if (currentPopup && currentPopup !== popup) {
              currentPopup.remove();
            }
            currentPopup = popup;
          });

          // Clear reference when popup is closed
          popup.on('close', () => {
            if (currentPopup === popup) {
              currentPopup = null;
            }
          });
        });

        setIsMapInitialized(true);
      });

    } catch (error) {
      toast.error("Hiba a térkép betöltésekor. Ellenőrizd a token-t!");
      console.error(error);
    }
  }, [mapboxToken]);

  useEffect(() => {
    const loadToken = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const envToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
        if (envToken) {
          setMapboxToken(envToken);
          setTimeout(() => initializeMap(envToken), 100);
          return;
        }

        const response = await fetch("/api/public/mapbox-token");
        if (!response.ok) {
          throw new Error("Mapbox token not configured");
        }

        const data = await response.json();
        if (!data?.token) {
          throw new Error("Missing token");
        }

        setMapboxToken(data.token);
        setTimeout(() => initializeMap(data.token), 100);
      } catch (error) {
        console.error("Failed to load Mapbox token", error);
        setLoadError(
          "A Mapbox token nincs beállítva a környezetben. Add meg a MAPBOX_TOKEN értékét a Render környezeti változók között.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, [initializeMap]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!isMapInitialized || !map.current) return;

    const handleResize = () => {
      map.current?.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMapInitialized]);

  if (isHidden) return null;

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-gradient-subtle relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />

      <div className="container px-4 relative z-10">
        <div
          className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20 mb-6">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">
              INTERAKTÍV TÉRKÉP
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
            onClick={(event) => handleMapTextClick(event, "title")}
            role={adminPreview ? "button" : undefined}
            tabIndex={adminPreview ? 0 : undefined}
          >
            {mapContentLoading ? "" : mapContent.title || "Térkép"}
          </h2>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            onClick={(event) => handleMapTextClick(event, "description")}
            role={adminPreview ? "button" : undefined}
            tabIndex={adminPreview ? 0 : undefined}
          >
            {mapContentLoading
              ? ""
              : mapContent.description ||
              "Fedezd fel térképünkön, hogy mely régiókban képviseljük a magyar ifjúság érdekeit."}
          </p>
        </div>

        {isLoading ? (
          <div className="max-w-2xl mx-auto mb-8 p-6 bg-card border border-border rounded-2xl shadow-lg">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Token betöltése...</span>
            </div>
          </div>
        ) : !isMapInitialized && !mapboxToken && (
          <div
            className={`max-w-2xl mx-auto mb-8 p-6 bg-card border border-border rounded-2xl shadow-lg transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Mapbox token hiányzik
                </h3>
                <p className="text-sm text-muted-foreground">
                  Állítsd be a MAPBOX_TOKEN környezeti változót a Render szolgáltatásnál, majd indítsd újra az alkalmazást.
                </p>
                {loadError && (
                  <p className="text-sm text-destructive mt-2">{loadError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className={`max-w-6xl mx-auto transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none z-10" />
            <div
              ref={mapContainer}
              className="w-full h-[600px] relative transition-opacity duration-300"
              style={{
                opacity: isMapInitialized ? 1 : 0,
                background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)'
              }}
            />
            {!isMapInitialized && !isLoading && (
              <div className="w-full h-[600px] flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                  <p className="text-muted-foreground font-medium">
                    Add meg a Mapbox tokent az admin felületen
                  </p>
                </div>
              </div>
            )}

            {/* Integrated Legend Overlay */}
            {isMapInitialized && (
              <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none">
                <div className="bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-border/50 pointer-events-auto">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-primary to-accent rounded-full" />
                    Régiók színkódja
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {regions.map((region) => (
                      <div
                        key={region.name}
                        className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform"
                      >
                        <div
                          className="w-4 h-4 rounded-full ring-2 ring-white shadow-md group-hover:ring-4 transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${region.color}, ${region.color}dd)`,
                            boxShadow: `0 0 12px ${region.color}40`
                          }}
                        />
                        <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                          {region.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
