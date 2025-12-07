import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import {
  importDocuments,
  fetchAdminDocuments,
  type DocumentImportPayload,
  updateDocument,
  createDocument,
  deleteDocument,
  uploadDocumentFile,
} from "@/services/documentsService";
import { type Document, type DocumentCategory, type DocumentPayload } from "@/types/documents";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, FileInput, FileText, ListChecks, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

type CsvRow = Record<string, string>;

const closingHeaders = {
  location: "a zárónyilatkozat helye",
  date: "a zárónyilatkozat időpontja:",
  pdf: "pdf",
};

const documentsHeaders = {
  name: "dokumentum neve",
  category: "a dokumentum kategóriája",
  pdf: "dokumentum",
  internalName: "belső név",
};

function normalizeHeader(value: string) {
  return value.toLowerCase().trim();
}

function parseCsv(text: string): CsvRow[] {
  const content = text.replace(/^[\uFEFF]+/, "");
  const delimiter = content.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  const cells: string[] = [];

  const flushCell = () => {
    cells.push(current);
    current = "";
  };

  const flushRow = () => {
    if (cells.length || current) {
      flushCell();
      rows.push([...cells]);
      cells.length = 0;
    }
  };

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const isLast = i === content.length - 1;

    if (char === "\"" && content[i - 1] !== "\\") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      flushCell();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[i + 1] === "\n") {
        i += 1;
      }
      flushRow();
      continue;
    }

    current += char;

    if (isLast) {
      flushCell();
    }
  }

  if (!rows.length) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const entry: CsvRow = {};
      headers.forEach((header, index) => {
        entry[header] = (row[index] || "").trim();
      });
      return entry;
    });
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeDate(dateValue: string) {
  const raw = dateValue.trim();
  if (!raw) return "";

  const formatted = raw.replace(/[\s]/g, "");
  const match = formatted.match(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return raw;
}

function getStorageFolder(category: DocumentCategory) {
  return category === "closing-statement" ? "zaronyilatkozatok" : "dokumentumok";
}

function buildFileName(base: string, date?: string, extension = "pdf") {
  const baseSlug = slugify(base || "dokumentum") || "dokumentum";
  const dateSlug = date ? slugify(date).replace(/-/g, "") : "";
  const name = [baseSlug, dateSlug].filter(Boolean).join("-");
  return `${name}.${extension.replace(/^\./, "") || "pdf"}`;
}

function getCsvValue(row: CsvRow, key: string) {
  return row[normalizeHeader(key)] || "";
}

function mapCategory(value: string): DocumentCategory {
  const normalized = value.toLowerCase();
  if (normalized.includes("alapszab")) return "statute";
  if (normalized.includes("alapító") || normalized.includes("alapito")) return "founding";
  if (normalized.includes("záró") || normalized.includes("zaro")) return "closing-statement";
  return "other";
}

const initialNewDocument: DocumentPayload = {
  title: "",
  titleEn: "",
  location: "",
  date: "",
  url: "",
  category: "other",
};

const categoryOptions: { value: DocumentCategory; label: string }[] = [
  { value: "closing-statement", label: "Zárónyilatkozat" },
  { value: "statute", label: "Alapszabály" },
  { value: "founding", label: "Alapító nyilatkozat" },
  { value: "other", label: "Egyéb" },
];

const categoryDisplayOrder: DocumentCategory[] = [
  "statute",
  "founding",
  "other",
  "closing-statement",
];

export default function AdminDocuments() {
  const { isLoading, session } = useAdminAuthGuard();
  const [closingFile, setClosingFile] = useState<File | null>(null);
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedCounts, setParsedCounts] = useState({ closing: 0, documents: 0 });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDocument, setNewDocument] = useState<DocumentPayload>({ ...initialNewDocument });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAdminDocuments()
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }, []);

  const grouped = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        if (doc.category === "closing-statement") {
          acc.closing += 1;
        } else if (doc.category === "other") {
          acc.other += 1;
        } else if (doc.category === "statute") {
          acc.statute += 1;
        } else if (doc.category === "founding") {
          acc.founding += 1;
        }
        return acc;
      },
      { closing: 0, other: 0, statute: 0, founding: 0 },
    );
  }, [documents]);

  const documentsByCategory = useMemo(
    () =>
      categoryDisplayOrder.reduce(
        (acc, category) => {
          const sorted = [...documents]
            .filter((doc) => doc.category === category)
            .sort((a, b) => b.date.localeCompare(a.date));

          acc[category] = sorted;
          return acc;
        },
        {
          "closing-statement": [],
          founding: [],
          other: [],
          statute: [],
        } as Record<DocumentCategory, Document[]>,
      ),
    [documents],
  );

  const categoryLabelMap = useMemo(
    () =>
      categoryOptions.reduce((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {} as Record<DocumentCategory, string>),
    [],
  );

  const updateDocumentField = (id: string | undefined, field: keyof Document, value: string | DocumentCategory) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc;
        const updated = { ...doc, [field]: value } as Document;
        if (field === "title" && (!doc.titleEn || doc.titleEn === doc.title)) {
          updated.titleEn = value as string;
        }
        return updated;
      }),
    );
  };

  const handleNewDocumentChange = (field: keyof DocumentPayload, value: string | DocumentCategory) => {
    setNewDocument((prev) => {
      const updated = { ...prev, [field]: value } as DocumentPayload;
      if (field === "title" && (!prev.titleEn || prev.titleEn === prev.title)) {
        updated.titleEn = value as string;
      }
      return updated;
    });
  };

  const buildTargetPath = (file: File, payload: DocumentPayload) => {
    const extension = (file.name.split(".").pop() || "pdf").toLowerCase();
    const safeBase = payload.title || file.name.replace(/\.[^.]+$/, "");
    return `${getStorageFolder(payload.category)}/${buildFileName(safeBase, payload.date, extension)}`;
  };

  const normalizePayload = (payload: DocumentPayload | Document): DocumentPayload => ({
    title: payload.title.trim(),
    titleEn: (payload.titleEn || payload.title).trim() || payload.title.trim(),
    location: (payload.location || "").trim(),
    date: (payload.date || "").trim(),
    url: payload.url.trim(),
    category: payload.category,
  });

  const handleSaveDocument = async (id?: string) => {
    if (!id) return;

    const target = documents.find((doc) => doc.id === id);
    if (!target) return;

    const payload = normalizePayload(target);
    if (!payload.title || !payload.url) {
      toast.error("A cím és az URL megadása kötelező");
      return;
    }

    setSavingId(id);
    try {
      const updated = await updateDocument(id, payload);
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? updated : doc)));
      toast.success("Dokumentum frissítve");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült frissíteni a dokumentumot";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateDocument = async () => {
    const payload = normalizePayload(newDocument);
    if (!payload.title || !payload.url) {
      toast.error("A cím és az URL megadása kötelező");
      return;
    }

    setIsCreating(true);
    try {
      const created = await createDocument(payload);
      setDocuments((prev) => [created, ...prev]);
      setNewDocument({ ...initialNewDocument });
      setUploadedFileName(null);
      toast.success("Új dokumentum létrehozva");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült létrehozni a dokumentumot";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (id?: string) => {
    if (!id) return;

    setSavingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success("Dokumentum törölve");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült törölni a dokumentumot";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleUploadNewFile = async (file: File | null | undefined) => {
    if (!file) return;
    const payload = normalizePayload(newDocument);
    const targetPath = buildTargetPath(file, payload);

    setUploadingFile(true);
    try {
      const url = await uploadDocumentFile(file, targetPath);
      setNewDocument((prev) => ({ ...prev, url }));
      setUploadedFileName(file.name);
      toast.success("Fájl sikeresen feltöltve");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült feltölteni a fájlt";
      toast.error(message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleUploadNewFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleUploadNewFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  if (isLoading || !session) {
    return (
      <AdminLayout>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Betöltés...</span>
        </div>
      </AdminLayout>
    );
  }

  const handleParsePreview = async () => {
    const closingRows = closingFile ? parseCsv(await closingFile.text()) : [];
    const documentRows = documentsFile ? parseCsv(await documentsFile.text()) : [];
    setParsedCounts({ closing: closingRows.length, documents: documentRows.length });
  };

  const handleImport = async () => {
    if (!closingFile && !documentsFile) {
      toast.error("Tölts fel legalább egy CSV fájlt");
      return;
    }

    setIsImporting(true);
    try {
      const closingRows = closingFile ? parseCsv(await closingFile.text()) : [];
      const documentRows = documentsFile ? parseCsv(await documentsFile.text()) : [];

      const closingPayload = closingRows
        .map((row) => {
          const location = getCsvValue(row, closingHeaders.location);
          const date = normalizeDate(getCsvValue(row, closingHeaders.date));
          const pdfUrl = getCsvValue(row, closingHeaders.pdf);
          if (!pdfUrl) return null;

          return {
            title: "Zárónyilatkozat",
            titleEn: "Closing Statement",
            location,
            date,
            category: "closing-statement" as const,
            sourceUrl: pdfUrl,
            targetPath: `zaronyilatkozatok/${buildFileName(location || "zaronyilatkozat", date)}`,
          };
        })
        .filter(Boolean);

      const existingTitleKeys = new Set(documents.map((doc) => doc.title.toLowerCase().trim()));
      const duplicateTracker = new Map<string, number>();

      const documentPayload = documentRows
        .map((row) => {
          const title = getCsvValue(row, documentsHeaders.name);
          const categoryText = getCsvValue(row, documentsHeaders.category);
          const pdfUrl = getCsvValue(row, documentsHeaders.pdf);
          const internalName = getCsvValue(row, documentsHeaders.internalName);
          if (!title || !pdfUrl) return null;

          const category = mapCategory(categoryText);
          const normalizedTitle = title.toLowerCase();
          const currentCount = duplicateTracker.get(normalizedTitle) || 0;
          duplicateTracker.set(normalizedTitle, currentCount + 1);

          const needsInternalName =
            Boolean(internalName) && (existingTitleKeys.has(normalizedTitle) || currentCount > 0);
          const safeTitleForFile = needsInternalName ? `${title} ${internalName}` : title;

          return {
            title,
            titleEn: title,
            category,
            date: "",
            location: "",
            sourceUrl: pdfUrl,
            targetPath: `dokumentumok/${buildFileName(safeTitleForFile)}`,
          };
        })
        .filter(Boolean);

      const payload: DocumentImportPayload = {
        closingStatements: closingPayload as NonNullable<(typeof closingPayload)[number]>[],
        documents: documentPayload as NonNullable<(typeof documentPayload)[number]>[],
      };

      if (!payload.closingStatements.length && !payload.documents.length) {
        toast.error("Nincs importálható sor a CSV fájlokban");
        return;
      }

      const result = await importDocuments(payload);
      setDocuments(result);
      setParsedCounts({ closing: payload.closingStatements.length, documents: payload.documents.length });
      toast.success("Dokumentumok sikeresen importálva");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nem sikerült importálni a dokumentumokat";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                Dokumentumok importálása
              </h1>
              <p className="text-sm text-muted-foreground">
                Töltsd fel a zárónyilatkozatok és egyéb dokumentumok CSV fájljait, a rendszer automatikusan
                letölti a PDF-eket és feltölti a Bunny tárhelyre.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Cél mappa: zaronyilatkozatok</Badge>
            <Badge variant="secondary">Cél mappa: dokumentumok</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aktuális dokumentumok</CardTitle>
            <CardDescription>Gyors áttekintés az adatbázisban lévő elemekről.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Zárónyilatkozatok
              </div>
              <div className="mt-2 text-2xl font-bold">{grouped.closing}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ListChecks className="h-4 w-4" />
                Egyéb dokumentumok
              </div>
              <div className="mt-2 text-2xl font-bold">{grouped.other}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileInput className="h-4 w-4" />
                Alapszabály
              </div>
              <div className="mt-2 text-2xl font-bold">{grouped.statute}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileInput className="h-4 w-4" />
                Alapító nyilatkozat
              </div>
              <div className="mt-2 text-2xl font-bold">{grouped.founding}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumentumok szerkesztése</CardTitle>
            <CardDescription>Meglévő elemek módosítása és új dokumentumok rögzítése.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="mb-4 font-semibold">Új dokumentum hozzáadása</div>
              <div className="grid gap-3 lg:grid-cols-5">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium">Cím</label>
                  <Input
                    value={newDocument.title}
                    onChange={(event) => handleNewDocumentChange("title", event.target.value)}
                    placeholder="Dokumentum címe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Helyszín (opcionális)</label>
                  <Input
                    value={newDocument.location}
                    onChange={(event) => handleNewDocumentChange("location", event.target.value)}
                    placeholder="Pl. Budapest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dátum</label>
                  <Input
                    value={newDocument.date}
                    onChange={(event) => handleNewDocumentChange("date", event.target.value)}
                    placeholder="ÉÉÉÉ-HH-NN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategória</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newDocument.category}
                    onChange={(event) => handleNewDocumentChange("category", event.target.value as DocumentCategory)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={newDocument.url}
                    onChange={(event) => handleNewDocumentChange("url", event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div
                  className={`lg:col-span-2 rounded-lg border border-dashed p-4 transition ${dragActive ? "border-primary bg-primary/5" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onClick={() => newFileInputRef.current?.click()}
                >
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-5 w-5 text-primary" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">PDF feltöltése húzással vagy kattintással</div>
                      <p className="text-xs text-muted-foreground">
                        A fájl a kiválasztott kategória mappájába kerül: <strong>{getStorageFolder(newDocument.category)}</strong>
                      </p>
                      {uploadedFileName ? (
                        <p className="text-xs text-foreground">Feltöltött fájl: {uploadedFileName}</p>
                      ) : null}
                      {uploadingFile ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Feltöltés folyamatban...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => newFileInputRef.current?.click()}>
                            Fájl kiválasztása
                          </Button>
                          <span className="text-xs text-muted-foreground">PDF vagy egyéb dokumentum</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    ref={newFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button type="button" onClick={handleCreateDocument} disabled={isCreating || uploadingFile}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mentés...
                      </>
                    ) : (
                      "Dokumentum hozzáadása"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                A módosítások azonnal mentésre kerülnek az aktuális adatbázisba.
              </div>
              <div className="space-y-5">
                {categoryDisplayOrder.map((category) => {
                  const docs = documentsByCategory[category];
                  if (!docs.length) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold">{categoryLabelMap[category]}</h3>
                        <Badge variant="outline">{docs.length} db</Badge>
                      </div>

                      <div className="space-y-3">
                        {docs.map((doc) => (
                          <div key={doc.id || doc.title} className="rounded-lg border p-4 space-y-3">
                            <div className="grid gap-3 lg:grid-cols-6">
                              <div className="space-y-2 lg:col-span-2">
                                <label className="text-sm font-medium">Cím</label>
                                <Input
                                  value={doc.title}
                                  onChange={(event) => updateDocumentField(doc.id, "title", event.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Helyszín</label>
                                <Input
                                  value={doc.location || ""}
                                  onChange={(event) => updateDocumentField(doc.id, "location", event.target.value)}
                                  placeholder="Opcionális"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Dátum</label>
                                <Input
                                  value={doc.date || ""}
                                  onChange={(event) => updateDocumentField(doc.id, "date", event.target.value)}
                                  placeholder="ÉÉÉÉ-HH-NN"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Kategória</label>
                                <select
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  value={doc.category}
                                  onChange={(event) => updateDocumentField(doc.id, "category", event.target.value as DocumentCategory)}
                                >
                                  {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2 lg:col-span-2">
                                <label className="text-sm font-medium">URL</label>
                                <Input
                                  value={doc.url}
                                  onChange={(event) => updateDocumentField(doc.id, "url", event.target.value)}
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs text-muted-foreground">Azonosító: {doc.id || "-"}</div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  disabled={!doc.id || savingId === doc.id}
                                >
                                  {savingId === doc.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Törlés...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Törlés
                                    </>
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveDocument(doc.id)}
                                  disabled={!doc.id || savingId === doc.id}
                                >
                                  {savingId === doc.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Mentés...
                                    </>
                                  ) : (
                                    "Módosítás mentése"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nincs megjeleníthető dokumentum.</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV fájlok</CardTitle>
            <CardDescription>
              Add meg külön fájlban a zárónyilatkozatokat és az egyéb dokumentumokat. A feltöltés a fájlkezelő
              által használt Bunny API-n keresztül történik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Zárónyilatkozatok CSV</label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(event) => setClosingFile(event.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Kötelező oszlopok: "A Zárónyilatkozat helye", "A Zárónyilatkozat Időpontja:", "PDF".
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Egyéb dokumentumok CSV</label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(event) => setDocumentsFile(event.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Kötelező oszlopok: "Dokumentum Neve", "A dokumentum kategóriája", "Dokumentum".
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fontos</AlertTitle>
              <AlertDescription>
                A feltöltés a megadott URL-ekről tölti le a PDF-eket, majd feltölti azokat a <strong>zaronyilatkozatok</strong>
                , illetve <strong>dokumentumok</strong> mappába a Bunny tárolón.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleParsePreview}
                disabled={isImporting}
              >
                <ListChecks className="mr-2 h-4 w-4" />
                Sorok számlálása
              </Button>
              <Button type="button" onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Feldolgozás...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Importálás és feltöltés
                  </>
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                Zárónyilatkozat sorok: <strong>{parsedCounts.closing}</strong> · Egyéb sorok: <strong>{parsedCounts.documents}</strong>
              </div>
            </div>

            <Separator />

            <div className="text-sm text-muted-foreground">
              A végleges dokumentumok a <strong>/dokumentumok</strong> oldalon jelennek meg a jelenlegi megjelenéssel
              megegyező módon.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
