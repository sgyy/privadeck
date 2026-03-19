import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "@/lib/pdfjs";

export interface CropMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export async function cropPdf(
  file: File,
  margins: CropMargins,
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const cropW = width - margins.left - margins.right;
    const cropH = height - margins.top - margins.bottom;
    if (cropW <= 0 || cropH <= 0) {
      throw new Error(
        `Margins exceed page dimensions (${Math.round(width)}x${Math.round(height)} pt)`
      );
    }
    page.setCropBox(margins.left, margins.bottom, cropW, cropH);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjsLib = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const count = pdf.numPages;
  pdf.destroy();
  return count;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
