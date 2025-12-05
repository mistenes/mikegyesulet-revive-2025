export type DocumentCategory = "statute" | "founding" | "closing-statement" | "other";

export type Document = {
  id?: string;
  title: string;
  titleEn: string;
  location?: string;
  date: string;
  url: string;
  category: DocumentCategory;
};

export type DocumentPayload = Omit<Document, "id">;
