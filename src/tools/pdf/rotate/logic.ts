import { PDFDocument, degrees } from "pdf-lib";

export async function rotatePdf(
  file: File,
  rotations: Record<number, number>,
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();

  for (const [pageIndex, angle] of Object.entries(rotations)) {
    const page = pages[Number(pageIndex)];
    if (page) {
      const currentRotation = page.getRotation().angle;
      const raw = currentRotation + angle;
      const normalized = ((raw % 360) + 360) % 360;
      page.setRotation(degrees(normalized));
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
