import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "@/lib/pdfjs";
import type {
  CompressOptions,
  CompressReportItem,
  CompressResult,
  ProgressCallback,
} from "./types";
import { applyCleanup, buildOriginalWithCleanup, FALLBACK_THRESHOLD } from "./cleanup";

const PRESET_MAP: Record<"high" | "medium" | "low", { dpi: number; jpegQuality: number }> = {
  high: { dpi: 108, jpegQuality: 0.8 },
  medium: { dpi: 72, jpegQuality: 0.6 },
  low: { dpi: 54, jpegQuality: 0.4 },
};

function resolveConfig(options: CompressOptions): { scale: number; jpegQuality: number } {
  if (options.quality === "custom") {
    const dpi = options.customDpi ?? 72;
    const jpegQuality = (options.customJpegQuality ?? 60) / 100;
    return { scale: dpi / 72, jpegQuality };
  }
  const preset = PRESET_MAP[options.quality];
  return { scale: preset.dpi / 72, jpegQuality: preset.jpegQuality };
}

export async function rasterize(
  file: File,
  options: CompressOptions,
  onProgress?: ProgressCallback,
): Promise<CompressResult> {
  const config = resolveConfig(options);
  const pdfjsLib = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const srcPdf = await pdfjsLib.getDocument({ data: bytes }).promise;

  try {
    const newDoc = await PDFDocument.create();
    const reportItems: CompressReportItem[] = [];

    // Precompute per-page area to estimate beforeBytes proportionally.
    // bytes.length includes shared overhead (xref, fonts, metadata), so
    // the result is still an estimate — but page-area-weighted estimates
    // surface "this page is the biggest" far better than uniform averages.
    const pageAreas: number[] = [];
    let totalArea = 0;
    for (let i = 1; i <= srcPdf.numPages; i++) {
      const page = await srcPdf.getPage(i);
      const vp = page.getViewport({ scale: 1.0 });
      const area = vp.width * vp.height;
      pageAreas.push(area);
      totalArea += area;
    }

    for (let i = 1; i <= srcPdf.numPages; i++) {
      if (options.signal?.aborted) {
        throw new DOMException("Compression aborted", "AbortError");
      }
      const page = await srcPdf.getPage(i);
      const viewport = page.getViewport({ scale: config.scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;

      try {
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
        const image = await newDoc.embedJpg(jpegBytes);

        const origViewport = page.getViewport({ scale: 1.0 });
        const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(image, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });

        const weight = totalArea > 0 ? pageAreas[i - 1] / totalArea : 1 / srcPdf.numPages;
        reportItems.push({
          index: i,
          label: `page-${i}`,
          beforeBytes: Math.round(bytes.length * weight),
          afterBytes: jpegBytes.length,
        });
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }

      onProgress?.({ kind: "page", current: i, total: srcPdf.numPages });
    }

    applyCleanup(newDoc, options.cleanup);

    const pdfBytes = await newDoc.save();

    if (pdfBytes.length >= file.size * FALLBACK_THRESHOLD) {
      const fallbackBytes = await buildOriginalWithCleanup(bytes, options.cleanup);
      return {
        blob: new Blob([fallbackBytes as BlobPart], { type: "application/pdf" }),
        usedOriginal: true,
        modeUsed: "rasterize",
      };
    }

    return {
      blob: new Blob([pdfBytes as BlobPart], { type: "application/pdf" }),
      usedOriginal: false,
      modeUsed: "rasterize",
      report: { items: reportItems },
    };
  } finally {
    srcPdf.destroy();
  }
}
