import { defaultNews } from "@/data/defaultNews";
import { NewsArticle, NewsInput } from "@/types/news";
import { readJson, writeJson } from "./storage";

const STORAGE_KEY = "mik-news";
const EVENT_NAME = "news-updated";
const isBrowser = typeof window !== "undefined";

type NewsEventDetail = { id?: string };

function loadNews(): NewsArticle[] {
  return readJson<NewsArticle[]>(STORAGE_KEY, defaultNews);
}

function persistNews(articles: NewsArticle[]) {
  writeJson(STORAGE_KEY, articles);
}

function broadcastUpdate(detail?: NewsEventDetail) {
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  }
}

export async function getPublishedNews(): Promise<NewsArticle[]> {
  return loadNews().filter((article) => article.published);
}

export async function getAllNews(): Promise<NewsArticle[]> {
  return loadNews();
}

export async function createNews(article: NewsInput): Promise<void> {
  const articles = loadNews();
  const id = crypto.randomUUID?.() || `${Date.now()}`;
  const now = new Date().toISOString();

  articles.unshift({
    id,
    category: article.category,
    imageUrl: article.imageUrl,
    published: article.published,
    publishedAt: article.published ? now : null,
    createdAt: now,
    translations: article.translations,
  });

  persistNews(articles);
  broadcastUpdate({ id });
}

export async function updateNews(id: string, article: NewsInput): Promise<void> {
  const articles = loadNews();
  const now = new Date().toISOString();

  const updated = articles.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      category: article.category,
      imageUrl: article.imageUrl,
      published: article.published,
      publishedAt: article.published ? (item.publishedAt || now) : null,
      translations: article.translations,
    };
  });

  persistNews(updated);
  broadcastUpdate({ id });
}

export async function deleteNews(id: string): Promise<void> {
  const articles = loadNews().filter((item) => item.id !== id);
  persistNews(articles);
  broadcastUpdate({ id });
}

export const NEWS_EVENT = EVENT_NAME;
