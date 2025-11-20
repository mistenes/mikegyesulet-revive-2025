import { defaultPageContent } from "@/data/defaultPageContent";
import { LocalizedSectionContent, PageContentStore } from "@/types/pageContent";
import { readJson, writeJson } from "./storage";

const STORAGE_KEY = "mik-page-content";
const EVENT_NAME = "page-content-updated";
const isBrowser = typeof window !== "undefined";

type UpdateEventDetail = {
  sectionKey: string;
};

function loadStore(): PageContentStore {
  return readJson<PageContentStore>(STORAGE_KEY, defaultPageContent);
}

function persistStore(store: PageContentStore) {
  writeJson(STORAGE_KEY, store);
}

export function getAllSections(): PageContentStore {
  return loadStore();
}

export function getSectionContent(sectionKey: string): LocalizedSectionContent {
  const store = loadStore();
  return store[sectionKey] || defaultPageContent[sectionKey] || { hu: {}, en: {} };
}

export function saveSection(sectionKey: string, content: LocalizedSectionContent) {
  const store = loadStore();
  store[sectionKey] = content;
  persistStore(store);

  if (isBrowser) {
    window.dispatchEvent(
      new CustomEvent<UpdateEventDetail>(EVENT_NAME, {
        detail: { sectionKey }
      })
    );
  }
}

export const PAGE_CONTENT_EVENT = EVENT_NAME;
