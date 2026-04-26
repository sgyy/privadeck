import { PDFDocument } from "pdf-lib";

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

export { formatFileSize } from "@/lib/utils/formatFileSize";
