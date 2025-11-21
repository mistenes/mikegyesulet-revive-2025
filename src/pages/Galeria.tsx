import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { LightGallery } from "@/components/LightGallery";
import { getPublicGallery } from "@/services/galleryService";
import type { GalleryAlbum } from "@/types/gallery";


export default function Galeria() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<GalleryAlbum | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadGallery = async () => {
      try {
        setIsLoading(true);
        const items = await getPublicGallery();
        if (!active) return;
        setAlbums(items);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError("Nem sikerült betölteni a galériát.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadGallery();
    return () => {
      active = false;
    };
  }, []);

  const openLightbox = (album: GalleryAlbum) => {
    setCurrentAlbum(album);
    setCurrentImageIndex(0);
    setLightboxOpen(true);
  };

  const heroAlbums = useMemo(
    () => [...albums].sort((a, b) => a.sortOrder - b.sortOrder),
    [albums],
  );

  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            GALÉRIA
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Tekintse meg eseményeink és tevékenységeink fotóit
          </p>
        </div>
      </section>

      {/* Albums Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Albumok</h2>

          {isLoading ? (
            <div className="text-muted-foreground">Galéria betöltése...</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : heroAlbums.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {heroAlbums.map((album) => {
                const eventDate = album.eventDate
                  ? new Date(album.eventDate).toLocaleDateString('hu-HU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : null;

                return (
                  <Card
                    key={album.id}
                    className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-card border-border"
                    onClick={() => openLightbox(album)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={album.coverImageUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">
                          {album.images.length} fotó
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {album.subtitle}
                      </p>
                      {eventDate && <time className="text-xs text-muted-foreground/70">{eventDate}</time>}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground">Jelenleg nincs megjeleníthető galéria.</div>
          )}
        </div>
      </section>

      <Footer />

      {/* LightGallery */}
      {currentAlbum && (
        <LightGallery
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={currentAlbum.images}
          currentIndex={currentImageIndex}
          onNavigate={setCurrentImageIndex}
          albumTitle={currentAlbum.title}
        />
      )}
    </div>
  );
}
