import { PDFDocument } from "pdf-lib";

export async function mergePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }

  const bytes = await merged.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
