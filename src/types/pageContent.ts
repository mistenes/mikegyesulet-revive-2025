import { LanguageCode } from "./language";

export type SectionContent = Record<string, unknown>;

export type LocalizedSectionContent = Record<LanguageCode, SectionContent>;

export type PageContentStore = Record<string, LocalizedSectionContent>;
