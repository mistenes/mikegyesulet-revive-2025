import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LightGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  albumTitle: string;
}

const ZOOM_STEP = 0.25;
const MAX_ZOOM = 3;
const MIN_ZOOM = 1;

export const LightGallery = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  albumTitle,
}: LightGalleryProps) => {
  const [zoom, setZoom] = useState(1);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const zoomResetTimeout = useRef<number>();

  const resetZoom = useCallback(() => setZoom(1), []);
  const handleZoomIn = useCallback(
    () => setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM)),
    [],
  );

  const slides = useMemo(
    () =>
      images.map((src, index) => ({
        src,
        alt: `${albumTitle} fotó ${index + 1}`,
      })),
    [albumTitle, images],
  );

  useEffect(() => {
    if (!emblaApi || !isOpen) return undefined;

    emblaApi.reInit({ loop: true, align: "center" });
    emblaApi.scrollTo(currentIndex, true);

    const selectHandler = () => {
      const selectedIndex = emblaApi.selectedScrollSnap();
      onNavigate(selectedIndex);
    };

    emblaApi.on("select", selectHandler);
    return () => {
      emblaApi.off("select", selectHandler);
    };
  }, [emblaApi, currentIndex, isOpen, onNavigate]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") emblaApi?.scrollPrev();
      if (e.key === "ArrowRight") emblaApi?.scrollNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") resetZoom();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emblaApi, handleZoomIn, handleZoomOut, isOpen, onClose, resetZoom]);

  useEffect(() => {
    setZoom(1);
    if (!emblaApi) return;

    zoomResetTimeout.current = window.setTimeout(() => {
      emblaApi.scrollTo(currentIndex, true);
    }, 0);

    return () => {
      if (zoomResetTimeout.current) {
        window.clearTimeout(zoomResetTimeout.current);
      }
    };
  }, [currentIndex, emblaApi]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="absolute top-4 left-4 text-white">
        <h3 className="text-xl font-bold">{albumTitle}</h3>
        <p className="text-sm text-white/70">
          {currentIndex + 1} / {images.length}
        </p>
      </div>

      <div
        className="max-w-6xl w-full px-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-xl bg-black/30 border border-white/10">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={resetZoom}
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {slides.map((slide) => (
                <div key={slide.src} className="flex-[0_0_100%] flex items-center justify-center p-4">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="max-h-[75vh] max-w-full object-contain transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${zoom})` }}
                    draggable={false}
                    onLoad={resetZoom}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
            onClick={() => emblaApi?.scrollPrev()}
          >
            <ChevronLeft className="h-7 w-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
            onClick={() => emblaApi?.scrollNext()}
          >
            <ChevronRight className="h-7 w-7" />
          </Button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-2 scrollbar-hide">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              onClick={() => onNavigate(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                index === currentIndex ? "border-primary scale-105" : "border-white/30 hover:border-white/60"
              }`}
            >
              <img src={slide.src} alt={`Miniatűr ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
