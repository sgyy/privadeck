import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export async function addWatermark(
  file: File,
  options: { text: string; opacity: number; fontSize: number },
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);

    // Draw diagonal watermark at center (rotated 45°)
    // pdf-lib rotates around the text origin (bottom-left), so compensate
    const angle = Math.PI / 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    page.drawText(options.text, {
      x: width / 2 - (textWidth / 2) * cos + (options.fontSize / 2) * sin,
      y: height / 2 - (textWidth / 2) * sin - (options.fontSize / 2) * cos,
      size: options.fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: options.opacity,
      rotate: degrees(45),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
