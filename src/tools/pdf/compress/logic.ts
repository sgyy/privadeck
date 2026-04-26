import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "@/lib/pdfjs";

export type PdfQuality = "high" | "medium" | "low";

const QUALITY_MAP: Record<PdfQuality, { scale: number; jpegQuality: number }> = {
  high: { scale: 1.5, jpegQuality: 0.8 },
  medium: { scale: 1.0, jpegQuality: 0.6 },
  low: { scale: 0.75, jpegQuality: 0.4 },
};

export async function compressPdf(
  file: File,
  quality: PdfQuality,
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  const config = QUALITY_MAP[quality];
  const pdfjsLib = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const srcPdf = await pdfjsLib.getDocument({ data: bytes }).promise;

  const newDoc = await PDFDocument.create();

  for (let i = 1; i <= srcPdf.numPages; i++) {
    const page = await srcPdf.getPage(i);
    const viewport = page.getViewport({ scale: config.scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Render failed"))),
        "image/jpeg",
        config.jpegQuality,
      );
    });

    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    // Release canvas GPU memory
    canvas.width = 0;
    canvas.height = 0;
    const image = await newDoc.embedJpg(jpegBytes);

    // Use original page dimensions (not scaled)
    const origViewport = page.getViewport({ scale: 1.0 });
    const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(image, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });

    onProgress?.(i, srcPdf.numPages);
  }

  srcPdf.destroy();
  const pdfBytes = await newDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
