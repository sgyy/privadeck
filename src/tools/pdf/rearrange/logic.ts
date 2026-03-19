import { PDFDocument } from "pdf-lib";

export async function rearrangePdf(
  file: File,
  newOrder: number[],
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const srcDoc = await PDFDocument.load(bytes);
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(srcDoc, newOrder);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const pdfBytes = await newDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
