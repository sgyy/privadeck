import { zipSync } from "fflate";
import { getPdfjs } from "@/lib/pdfjs";

export interface PdfToImageOptions {
  format: "png" | "jpeg";
  quality: number;
  scale: number;
}

export interface ConvertedPage {
  blob: Blob;
  filename: string;
  pageNumber: number;
  width: number;
  height: number;
}

export async function convertPdfToImages(
  file: File,
  options: PdfToImageOptions,
  onProgress?: (current: number, total: number) => void,
  onPage?: (page: ConvertedPage) => void,
): Promise<ConvertedPage[]> {
  const pdfjsLib = await getPdfjs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const baseName = file.name.replace(/\.pdf$/i, "");
  const results: ConvertedPage[] = [];
  const mime = options.format === "jpeg" ? "image/jpeg" : "image/png";
  const ext = options.format === "jpeg" ? ".jpg" : ".png";

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: options.scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs-dist v5 render() requires canvas prop not in type defs
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to convert page"))),
        mime,
        options.format === "jpeg" ? options.quality / 100 : undefined,
      );
    });

    const converted: ConvertedPage = {
      blob,
      filename: `${baseName}_page_${i}${ext}`,
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
    };
    results.push(converted);
    onPage?.(converted);
    onProgress?.(i, totalPages);
  }

  return results;
}

export async function downloadAsZip(
  pages: ConvertedPage[],
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};

  for (const page of pages) {
    const dot = page.filename.lastIndexOf(".");
    const stem = dot > 0 ? page.filename.slice(0, dot) : page.filename;
    const ext = dot > 0 ? page.filename.slice(dot) : "";
    let key = page.filename;
    let suffix = 1;
    while (files[key] !== undefined) {
      suffix++;
      key = `${stem}_${suffix}${ext}`;
    }
    const buffer = await page.blob.arrayBuffer();
    files[key] = new Uint8Array(buffer);
  }

  const zipped = zipSync(files);
  return new Blob([zipped as BlobPart], { type: "application/zip" });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
