import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { getPublicGallery } from "@/services/galleryService";
import type { GalleryAlbum } from "@/types/gallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSectionContent } from "@/hooks/useSectionContent";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";


export default function Galeria() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const { content: galleryIntroContent } = useSectionContent("gallery_intro");
  const adminPreview = isAdminPreview();

  const handleHeroClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("gallery_intro", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const heroContent = useMemo(() => {
    const fallback = defaultPageContent.gallery_intro;
    const localized = (galleryIntroContent?.[language] || galleryIntroContent?.hu || fallback?.[language] || fallback?.hu || {}) as {
      title?: string;
      description?: string;
    };

    return {
      title: localized.title || "GALÉRIA",
      description: localized.description || "Tekintse meg eseményeink és tevékenységeink fotóit",
    };
  }, [galleryIntroContent, language]);

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
          <h1
            className={`text-5xl md:text-6xl font-bold mb-6 text-foreground ${adminPreview ? "cursor-pointer" : ""}`}
            onClick={(event) => handleHeroClick(event, "title")}
            role={adminPreview ? "button" : undefined}
            tabIndex={adminPreview ? 0 : undefined}
          >
            {heroContent.title}
          </h1>
          <p
            className={`text-xl text-muted-foreground max-w-3xl ${adminPreview ? "cursor-pointer" : ""}`}
            onClick={(event) => handleHeroClick(event, "description")}
            role={adminPreview ? "button" : undefined}
            tabIndex={adminPreview ? 0 : undefined}
          >
            {heroContent.description}
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
                  <Link key={album.id} to={`/galeria/${album.slug}`} className="block">
                    <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-card border-border">
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
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground">Jelenleg nincs megjeleníthető galéria.</div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
