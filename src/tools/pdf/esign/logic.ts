import { PDFDocument } from "pdf-lib";

export async function addSignature(
  file: File,
  signatureDataUrl: string,
  pageIndex: number,
  position: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);

  // Convert data URL to PNG bytes
  const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const binaryStr = atob(base64Data);
  const pngBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    pngBytes[i] = binaryStr.charCodeAt(i);
  }

  const pngImage = await pdfDoc.embedPng(pngBytes);

  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Invalid page index: ${pageIndex + 1}`);
  }

  const page = pages[pageIndex];
  const { height: pageHeight } = page.getSize();
  // Convert from top-left origin (user-friendly) to PDF bottom-left origin
  page.drawImage(pngImage, {
    x: position.x,
    y: pageHeight - position.y - position.height,
    width: position.width,
    height: position.height,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}


export { formatFileSize } from "@/lib/utils/formatFileSize";
