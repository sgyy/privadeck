import { getPdfjs } from "@/lib/pdfjs";
import type { CompressMode } from "./types";

const TEXT_DENSITY_THRESHOLD = 200;

export interface ModeDetectionResult {
  mode: Exclude<CompressMode, "auto">;
  textCharCount: number;
  reason: "text-heavy" | "scan-like";
}

export async function detectMode(
  file: Blob,
  signal?: AbortSignal,
): Promise<ModeDetectionResult> {
  const pdfjsLib = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (signal?.aborted) {
    throw new DOMException("Compression aborted", "AbortError");
  }
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  try {
    const sampleCount = Math.min(3, pdf.numPages);
    let totalChars = 0;

    for (let i = 1; i <= sampleCount; i++) {
      if (signal?.aborted) {
        throw new DOMException("Compression aborted", "AbortError");
      }
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      for (const item of textContent.items) {
        if ("str" in item) {
          totalChars += item.str.length;
        }
      }
    }

    const avgCharsPerPage = totalChars / sampleCount;

    if (avgCharsPerPage >= TEXT_DENSITY_THRESHOLD) {
      return { mode: "image-optimize", textCharCount: totalChars, reason: "text-heavy" };
    }
    return { mode: "rasterize", textCharCount: totalChars, reason: "scan-like" };
  } finally {
    pdf.destroy();
  }
}
