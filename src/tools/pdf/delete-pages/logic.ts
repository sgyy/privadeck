import { PDFDocument } from "pdf-lib";

export async function deletePages(
  file: File,
  pagesToDelete: Set<number>,
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  const keepIndices = [];

  for (let i = 0; i < totalPages; i++) {
    if (!pagesToDelete.has(i + 1)) {
      keepIndices.push(i);
    }
  }

  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, keepIndices);
  for (const page of pages) {
    newPdf.addPage(page);
  }

  const bytes = await newPdf.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
