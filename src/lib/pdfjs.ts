let configured = false;

export async function getPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!configured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    configured = true;
  }
  return pdfjsLib;
}

export type { PDFDocumentProxy } from "pdfjs-dist";
