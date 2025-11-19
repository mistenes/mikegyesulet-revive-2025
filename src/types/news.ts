import { LanguageCode } from './language';

export interface NewsTranslation {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

export interface NewsArticle {
  id: string;
  category: string;
  imageUrl?: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  translations: Record<LanguageCode, NewsTranslation>;
}

export interface NewsInput {
  category: string;
  imageUrl?: string;
  published: boolean;
  translations: Record<LanguageCode, NewsTranslation>;
}
