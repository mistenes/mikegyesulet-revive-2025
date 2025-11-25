import { LanguageCode } from "./language";

export type SectionContent = Record<string, unknown>;

export type LocalizedSectionContent = Record<LanguageCode, SectionContent>;

export type PageContentStore = Record<string, LocalizedSectionContent>;

export type PageContentMetadata = {
  lastEditedAt?: string;
  lastEditedBy?:
    | string
    | {
        id?: string;
        name?: string;
        email?: string;
      };
};

export type PageContentResponse = {
  sections: PageContentStore;
  metadata?: Record<string, PageContentMetadata>;
};
