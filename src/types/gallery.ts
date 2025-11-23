export interface GalleryAlbum {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  eventDate: string | null;
  coverImageUrl: string;
  coverImageAlt: string;
  images: string[];
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryAlbumInput {
  title: string;
  subtitle: string;
  eventDate: string;
  coverImageUrl: string;
  coverImageAlt: string;
  images: string[];
  sortOrder: number;
  published: boolean;
}
