import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfjs } from "@/lib/pdfjs";

export interface PdfPreview {
  pdfDoc: PDFDocumentProxy;
  pageCount: number;
  thumbnail: string;
}

export class PdfEncryptedError extends Error {
  constructor() {
    super("PDF_ENCRYPTED");
    this.name = "PdfEncryptedError";
  }
}

export class PdfWrongPasswordError extends Error {
  constructor() {
    super("PDF_WRONG_PASSWORD");
    this.name = "PdfWrongPasswordError";
  }
}

export async function getPdfPreview(
  file: Blob,
  options?: { thumbnailWidth?: number; password?: string },
): Promise<PdfPreview> {
  const targetW = options?.thumbnailWidth ?? 160;
  const pdfjsLib = await getPdfjs();
  const buf = await file.arrayBuffer();
  let pdfDoc: PDFDocumentProxy;
  try {
    pdfDoc = await pdfjsLib.getDocument({
      data: buf,
      password: options?.password,
    }).promise;
  } catch (e) {
    const name = (e as { name?: string })?.name;
    const code = (e as { code?: number })?.code;
    if (name === "PasswordException") {
      // pdf.js: code 1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD
      if (options?.password !== undefined || code === 2) {
        throw new PdfWrongPasswordError();
      }
      throw new PdfEncryptedError();
    }
    throw e;
  }
  try {
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = targetW / viewport.width;
    const scaled = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = scaled.width;
    canvas.height = scaled.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs v5 type defs lag the runtime API
      await page.render({ canvasContext: ctx, viewport: scaled, canvas } as any).promise;
      return { pdfDoc, pageCount: pdfDoc.numPages, thumbnail: canvas.toDataURL("image/png") };
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  } catch (e) {
    pdfDoc.destroy();
    throw e;
  }
}
