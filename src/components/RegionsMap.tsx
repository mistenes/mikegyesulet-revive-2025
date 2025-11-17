import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { toast } from "sonner";

interface Region {
  name: string;
  coordinates: [number, number];
  description: string;
  color: string;
  members: string;
}

const regions: Region[] = [
  {
    name: "Erdély",
    coordinates: [23.6236, 46.7712],
    description: "Erdély, a Kárpát-medence szívében, gazdag magyar kulturális örökséggel rendelkezik.",
    color: "#FF6B35",
    members: "Romániai Magyar Ifjúsági Szervezetek Szövetsége (RAMISZ)",
  },
  {
    name: "Felvidék",
    coordinates: [19.6987, 48.7164],
    description: "A Felvidék történelmi emlékei és élő magyar közösségei megőrzik hagyományainkat.",
    color: "#F7931E",
    members: "Ifjú Szívek Szlovákiai Magyar Ifjúsági Kerekasztal",
  },
  {
    name: "Kárpátalja",
    coordinates: [22.2879, 48.6208],
    description: "Kárpátalja, ahol a Kárpátok lábánál élő magyarság őrzi identitását.",
    color: "#FFC857",
    members: "Kárpátaljai Magyar Ifjúsági Szervezetek Fóruma (KMIF)",
  },
  {
    name: "Vajdaság",
    coordinates: [19.8335, 45.2671],
    description: "Vajdaság sokszínű kulturális életben a magyarság aktív közösséget alkot.",
    color: "#E63946",
    members: "Vajdasági Ifjúsági Fórum (VIF)",
  },
  {
    name: "Horvátország",
    coordinates: [18.0161, 45.8150],
    description: "Horvátországi magyarság megőrzi nyelvét és kultúráját a Dráva mentén.",
    color: "#A8DADC",
    members: "Horvátországi Magyarok Ifjúsági Szervezeteinek Fóruma (HMIF)",
  },
  {
    name: "Szlovénia",
    coordinates: [16.5467, 46.5547],
    description: "Szlovéniai magyar közösség aktívan részt vesz a régió kulturális életében.",
    color: "#457B9D",
    members: "Lendvai Magyar Ifjúsági Egyesület (LMIE)",
  },
];

export const RegionsMap = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(true);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [21.0, 47.5], // Center on Carpathian Basin
        zoom: 6,
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        "top-right"
      );

      // Add markers for each region
      regions.forEach((region) => {
        if (!map.current) return;

        // Create custom marker element
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.style.backgroundColor = region.color;
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.borderRadius = "50%";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.transition = "transform 0.2s";

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.2)";
        });

        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        // Create popup content
        const popupContent = `
          <div style="padding: 12px; min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: ${region.color};">
              ${region.name}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">
              ${region.description}
            </p>
            <div style="padding-top: 8px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #666;">
                Tagszervezet:
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #333;">
                ${region.members}
              </p>
            </div>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(popupContent);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat(region.coordinates)
          .setPopup(popup)
          .addTo(map.current);
      });

      setIsMapInitialized(true);
      setShowTokenInput(false);
      toast.success("Térkép betöltve! Kattints a jelölőkre a részletekért.");
    } catch (error) {
      toast.error("Hiba a térkép betöltésekor. Ellenőrizd a token-t!");
      console.error(error);
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-gradient-subtle relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      
      <div className="container px-4 relative z-10">
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
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
          >
            Kárpát-medencei jelenlétünk
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fedezd fel térképünkön, hogy mely régiókban képviseljük a magyar ifjúság érdekeit.
            Kattints a jelölőkre a részletes információkért!
          </p>
        </div>

        {showTokenInput && !isMapInitialized && (
          <div
            className={`max-w-2xl mx-auto mb-8 p-6 bg-card border border-border rounded-2xl shadow-lg transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Mapbox token szükséges
                </h3>
                <p className="text-sm text-muted-foreground">
                  A térkép megjelenítéséhez adj meg egy Mapbox publikus tokent.
                  Szerezz egyet a{" "}
                  <a
                    href="https://mapbox.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    mapbox.com
                  </a>{" "}
                  oldalon.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={initializeMap}
                disabled={!mapboxToken}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Betöltés
              </Button>
            </div>
          </div>
        )}

        {isMapInitialized && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowTokenInput(true);
              setIsMapInitialized(false);
              map.current?.remove();
            }}
            className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur"
          >
            <X className="h-4 w-4 mr-2" />
            Token módosítása
          </Button>
        )}

        <div
          className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div
            ref={mapContainer}
            className="w-full h-[600px] bg-muted"
            style={{ display: isMapInitialized ? "block" : "none" }}
          />
          {!isMapInitialized && !showTokenInput && (
            <div className="w-full h-[600px] flex items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Adj meg egy Mapbox tokent a térkép betöltéséhez
                </p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/5 rounded-3xl" />
        </div>

        {/* Region Legend */}
        <div
          className={`mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {regions.map((region) => (
            <div
              key={region.name}
              className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: region.color }}
              />
              <span className="text-sm font-medium text-foreground">
                {region.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
