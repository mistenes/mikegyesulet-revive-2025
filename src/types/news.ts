import { LanguageCode } from './language';

export interface NewsTranslation {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

export interface NewsCategoryTranslations {
  hu: string;
  en: string;
}

export interface NewsCategory {
  id: string;
  name: NewsCategoryTranslations;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  categoryId: string | null;
  category: string;
  categoryTranslations?: NewsCategoryTranslations;
  imageUrl?: string;
  imageAlt?: string;
  sticky?: boolean;
  date?: string;
  languageAvailability?: "hu" | "en" | "both";
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  translations: Record<LanguageCode, NewsTranslation>;
}

export interface NewsInput {
  categoryId?: string | null;
  category?: string;
  categoryTranslations?: NewsCategoryTranslations;
  imageUrl?: string;
  imageAlt?: string;
  sticky?: boolean;
  date?: string;
  languageAvailability?: "hu" | "en" | "both";
  published: boolean;
  translations: Record<LanguageCode, NewsTranslation>;
}

export interface NewsListResponse {
  items: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
}
