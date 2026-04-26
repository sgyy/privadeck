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

export { formatFileSize } from "@/lib/utils/formatFileSize";
