import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LightGallery } from "@/components/LightGallery";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPublicGalleryAlbum } from "@/services/galleryService";
import type { GalleryAlbum } from "@/types/gallery";

export default function GalleryAlbumPage() {
  const { slug = "" } = useParams();
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const loadAlbum = async () => {
      if (!slug) {
        setError("A galéria nem található");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getPublicGalleryAlbum(slug);
        if (!active) return;
        setAlbum(data);
      } catch (err) {
        console.error(err);
        if (!active) return;
        const message = err instanceof Error ? err.message : "Nem sikerült betölteni a galériát.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadAlbum();
    return () => {
      active = false;
    };
  }, [slug]);

  const eventDate = useMemo(() => {
    if (!album?.eventDate) return null;
    return new Date(album.eventDate).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [album]);

  const handleOpenLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            <Link to="/galeria" className="text-primary hover:underline">
              Galéria
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{album?.title || "Album"}</span>
          </div>

          {isLoading ? (
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Galéria betöltése...</h1>
          ) : error ? (
            <h1 className="text-4xl md:text-5xl font-bold text-destructive">{error}</h1>
          ) : (
            <div className="flex flex-col gap-3">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">{album?.title}</h1>
              {album?.subtitle && (
                <p className="text-lg text-muted-foreground max-w-3xl">{album.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {eventDate && <time>{eventDate}</time>}
                {album?.images?.length ? (
                  <Badge variant="secondary">{album.images.length} fotó</Badge>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      {!isLoading && !error && album && (
        <section className="pb-16 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {album.images.map((image, index) => (
                <Card
                  key={`${image}-${index}`}
                  className="overflow-hidden cursor-pointer group"
                  onClick={() => handleOpenLightbox(index)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={image}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {album && (
        <LightGallery
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={album.images}
          currentIndex={currentIndex}
          onNavigate={setCurrentIndex}
          albumTitle={album.title}
        />
      )}
    </div>
  );
}
