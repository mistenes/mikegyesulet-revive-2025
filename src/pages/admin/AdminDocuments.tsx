import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { importDocuments, fetchAdminDocuments, type DocumentImportPayload } from "@/services/documentsService";
import { type Document, type DocumentCategory } from "@/types/documents";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, FileInput, FileText, ListChecks, Loader2, UploadCloud } from "lucide-react";
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

function buildFileName(base: string, date?: string) {
  const baseSlug = slugify(base || "dokumentum") || "dokumentum";
  const dateSlug = date ? slugify(date).replace(/-/g, "") : "";
  const name = [baseSlug, dateSlug].filter(Boolean).join("-");
  return `${name}.pdf`;
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

export default function AdminDocuments() {
  const { isLoading, session } = useAdminAuthGuard();
  const [closingFile, setClosingFile] = useState<File | null>(null);
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedCounts, setParsedCounts] = useState({ closing: 0, documents: 0 });

  useEffect(() => {
    fetchAdminDocuments()
      .then(setExistingDocuments)
      .catch(() => setExistingDocuments([]));
  }, []);

  const grouped = useMemo(() => {
    return existingDocuments.reduce(
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
  }, [existingDocuments]);

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

      const documentPayload = documentRows
        .map((row) => {
          const title = getCsvValue(row, documentsHeaders.name);
          const categoryText = getCsvValue(row, documentsHeaders.category);
          const pdfUrl = getCsvValue(row, documentsHeaders.pdf);
          if (!title || !pdfUrl) return null;

          const category = mapCategory(categoryText);

          return {
            title,
            titleEn: title,
            category,
            date: "",
            location: "",
            sourceUrl: pdfUrl,
            targetPath: `dokumentumok/${buildFileName(title)}`,
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
      setExistingDocuments(result);
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
