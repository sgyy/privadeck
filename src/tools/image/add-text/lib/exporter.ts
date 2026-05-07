import { renderLayers } from "./renderer";
import type { ImageSize, TextLayer } from "./reducer";

export type ExportFormat = "png" | "jpeg" | "webp";

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
}

const MIME_MAP: Record<ExportFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Render full-resolution output and return a Blob.
 * Uses OffscreenCanvas if available (Phase 6 will add fallback to <canvas> for older Safari).
 */
export async function exportImage(
  image: ImageBitmap | HTMLImageElement,
  naturalSize: ImageSize,
  layers: TextLayer[],
  options: ExportOptions,
): Promise<Blob> {
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(naturalSize.w, naturalSize.h)
      : Object.assign(document.createElement("canvas"), {
          width: naturalSize.w,
          height: naturalSize.h,
        });

  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Identity transform: layer coordinates ARE pixel coordinates at full resolution.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  renderLayers({
    ctx: ctx as CanvasRenderingContext2D,
    image,
    naturalSize,
    layers,
  });

  const mime = MIME_MAP[options.format];
  if ("convertToBlob" in canvas) {
    return await (canvas as OffscreenCanvas).convertToBlob({
      type: mime,
      quality: options.format === "png" ? undefined : options.quality,
    });
  }

  return await new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      mime,
      options.format === "png" ? undefined : options.quality,
    );
  });
}
