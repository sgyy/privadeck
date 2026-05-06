import { getPdfjs } from "@/lib/pdfjs";

export interface PageText {
  page: number;
  text: string;
}

export interface ExtractResult {
  pages: PageText[];
  totalChars: number;
  isLikelyScanned: boolean;
  pageCount: number;
}

export interface ExtractOptions {
  pages?: number[];
  password?: string;
  signal?: AbortSignal;
  onProgress?: (current: number, total: number) => void;
}

export interface OcrExtractOptions {
  language: string;
  pages?: number[];
  password?: string;
  signal?: AbortSignal;
  onProgress?: (current: number, total: number, pageProgress: number) => void;
}

export type OutputFormat = "plain" | "markdown" | "json";

const SCAN_AVG_CHARS_THRESHOLD = 50;
const Y_NEWLINE_THRESHOLD = 2;
const X_SPACE_THRESHOLD = 1;

interface PdfTextItem {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
}

export async function extractText(
  file: File,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const pdfjsLib = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({
    data: bytes,
    password: options.password,
  }).promise;

  try {
    const allPages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    const pageNums = options.pages?.length
      ? options.pages.filter((p) => p >= 1 && p <= pdf.numPages)
      : allPages;
    const total = pageNums.length;
    const pages: PageText[] = [];
    let totalChars = 0;

    for (let idx = 0; idx < total; idx++) {
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const pageNum = pageNums[idx];
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = reconstructText(content.items as PdfTextItem[]);
      pages.push({ page: pageNum, text });
      totalChars += text.length;
      options.onProgress?.(idx + 1, total);
    }

    const avgChars = total > 0 ? totalChars / total : 0;
    return {
      pages,
      totalChars,
      isLikelyScanned: avgChars < SCAN_AVG_CHARS_THRESHOLD && total > 0,
      pageCount: pdf.numPages,
    };
  } finally {
    pdf.destroy();
  }
}

/**
 * Rebuild line/paragraph structure from pdfjs textContent items.
 * Uses hasEOL flag and y-coordinate transitions to insert newlines,
 * x-coordinate gaps to insert spaces.
 */
function reconstructText(items: PdfTextItem[]): string {
  let result = "";
  let prevY: number | null = null;
  let prevEndX: number | null = null;
  let prevHadEOL = false;

  for (const item of items) {
    const str = typeof item.str === "string" ? item.str : "";
    const tx = item.transform;
    const y = tx?.[5];
    const x = tx?.[4];
    const width = item.width ?? 0;
    const hasEOL = !!item.hasEOL;

    if (str.length > 0) {
      const yChanged =
        prevY !== null &&
        y !== undefined &&
        Math.abs(prevY - y) > Y_NEWLINE_THRESHOLD;

      if (yChanged && !prevHadEOL && result && !result.endsWith("\n")) {
        result += "\n";
      } else if (
        !yChanged &&
        prevEndX !== null &&
        x !== undefined &&
        x - prevEndX > X_SPACE_THRESHOLD &&
        result &&
        !result.endsWith(" ") &&
        !result.endsWith("\n")
      ) {
        result += " ";
      }

      result += str;

      if (x !== undefined) prevEndX = x + width;
      if (y !== undefined) prevY = y;
    }

    if (hasEOL) {
      if (!result.endsWith("\n")) result += "\n";
      prevEndX = null;
    }
    prevHadEOL = hasEOL;
  }

  return result.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
}

export function formatPlain(pages: PageText[]): string {
  const blocks = pages
    .filter((p) => p.text.trim())
    .map((p) => `--- Page ${p.page} ---\n${p.text}`);
  return blocks.join("\n\n");
}

export function formatMarkdown(pages: PageText[]): string {
  const blocks = pages
    .filter((p) => p.text.trim())
    .map((p) => `## Page ${p.page}\n\n${p.text}`);
  return blocks.join("\n\n");
}

export function formatJson(pages: PageText[]): string {
  return JSON.stringify(pages, null, 2);
}

export function formatResult(pages: PageText[], format: OutputFormat): string {
  switch (format) {
    case "markdown":
      return formatMarkdown(pages);
    case "json":
      return formatJson(pages);
    case "plain":
    default:
      return formatPlain(pages);
  }
}

export async function extractTextOcr(
  file: File,
  options: OcrExtractOptions,
): Promise<ExtractResult> {
  const [{ default: Tesseract }, pdfjsLib] = await Promise.all([
    import("tesseract.js"),
    getPdfjs(),
  ]);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({
    data: bytes,
    password: options.password,
  }).promise;

  try {
    const allPages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    const pageNums = options.pages?.length
      ? options.pages.filter((p) => p >= 1 && p <= pdf.numPages)
      : allPages;
    const total = pageNums.length;
    const pages: PageText[] = [];
    let totalChars = 0;

    for (let idx = 0; idx < total; idx++) {
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const pageNum = pageNums[idx];
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      try {
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs v5 type defs lag the runtime API
        } as any).promise;

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            "image/png",
          );
        });

        const result = await Tesseract.recognize(blob, options.language, {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") {
              options.onProgress?.(
                idx + 1,
                total,
                Math.round(m.progress * 100),
              );
            }
          },
        });

        // Tesseract.recognize() does not accept an AbortSignal — cancel only takes
        // effect at page boundaries.
        if (options.signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        const text = result.data.text || "";
        pages.push({ page: pageNum, text });
        totalChars += text.length;
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
    }

    return {
      pages,
      totalChars,
      isLikelyScanned: false,
      pageCount: pdf.numPages,
    };
  } finally {
    pdf.destroy();
  }
}

export { OCR_LANGUAGES } from "@/lib/ocr/languages";
