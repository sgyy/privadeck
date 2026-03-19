import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type NumberPosition =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

export type NumberFormat = "number" | "pageN" | "nOfTotal";

export async function addPageNumbers(
  file: File,
  options: {
    position: NumberPosition;
    fontSize: number;
    format: NumberFormat;
    startPage: number;
  },
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, index) => {
    if (index < options.startPage - 1) return;

    const pageNum = index + 1;
    let text = "";
    switch (options.format) {
      case "number":
        text = String(pageNum);
        break;
      case "pageN":
        text = `Page ${pageNum}`;
        break;
      case "nOfTotal":
        text = `${pageNum} / ${totalPages}`;
        break;
    }

    const { width: nw, height: nh } = page.getSize();
    const rotation = page.getRotation().angle;
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const margin = 40;

    // Compute visual dimensions (what the user sees after viewer applies rotation)
    const isTransposed = rotation === 90 || rotation === 270;
    const vw = isTransposed ? nh : nw; // visual width
    const vh = isTransposed ? nw : nh; // visual height

    // Compute position in visual coordinate space
    let vx = 0, vy = 0;
    switch (options.position) {
      case "bottom-center": vx = (vw - textWidth) / 2; vy = margin; break;
      case "bottom-left":   vx = margin; vy = margin; break;
      case "bottom-right":  vx = vw - textWidth - margin; vy = margin; break;
      case "top-center":    vx = (vw - textWidth) / 2; vy = vh - margin; break;
      case "top-left":      vx = margin; vy = vh - margin; break;
      case "top-right":     vx = vw - textWidth - margin; vy = vh - margin; break;
    }

    // Transform visual coordinates back to native (unrotated) coordinate space
    // pdf-lib drawText always operates in native coordinates
    let x = vx, y = vy;
    switch (rotation) {
      case 90:  x = vy; y = nw - vx; break;
      case 180: x = nw - vx; y = nh - vy; break;
      case 270: x = nh - vy; y = vx; break;
      // 0: no transform needed
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
