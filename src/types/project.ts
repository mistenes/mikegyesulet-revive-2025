export interface ProjectTranslation {
  title: string;
  description: string;
}

export interface Project {
  id: string;
  sortOrder: number;
  heroImageUrl: string;
  heroImageAlt: string;
  location: string;
  dateRange: string;
  linkUrl: string;
  published: boolean;
  translations: {
    hu: ProjectTranslation;
    en: ProjectTranslation;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
