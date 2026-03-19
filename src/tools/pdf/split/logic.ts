import { PDFDocument } from "pdf-lib";

export interface SplitResult {
  blob: Blob;
  filename: string;
  pageCount: number;
}

export async function splitByPages(file: File): Promise<SplitResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  const baseName = file.name.replace(/\.pdf$/i, "");
  const results: SplitResult[] = [];

  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(page);
    const bytes = await newPdf.save();
    results.push({
      blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
      filename: `${baseName}_page_${i + 1}.pdf`,
      pageCount: 1,
    });
  }

  return results;
}

export async function splitByRange(
  file: File,
  ranges: [number, number][],
): Promise<SplitResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const baseName = file.name.replace(/\.pdf$/i, "");
  const results: SplitResult[] = [];

  for (let r = 0; r < ranges.length; r++) {
    const [start, end] = ranges[r];
    const indices = [];
    for (let i = start - 1; i < end; i++) {
      indices.push(i);
    }
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, indices);
    for (const page of pages) {
      newPdf.addPage(page);
    }
    const bytes = await newPdf.save();
    results.push({
      blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
      filename: `${baseName}_${start}-${end}.pdf`,
      pageCount: indices.length,
    });
  }

  return results;
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
