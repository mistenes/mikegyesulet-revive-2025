import { LanguageCode } from './language';

export type SectionContent = Record<string, any>;

export type LocalizedSectionContent = Record<LanguageCode, SectionContent>;

export type PageContentStore = Record<string, LocalizedSectionContent>;
