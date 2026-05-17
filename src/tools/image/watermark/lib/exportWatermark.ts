import type { ImageSize } from "@/tools/image/add-text/lib/reducer";
import { renderWatermark } from "./render";
import type { OutputSettings, WatermarkConfig } from "./config";

const MIME_MAP: Record<Exclude<OutputSettings["format"], "original">, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function resolveMime(
  output: OutputSettings,
  sourceMime?: string,
): string {
  if (output.format === "original") {
    return sourceMime && sourceMime.startsWith("image/")
      ? sourceMime
      : "image/png";
  }
  return MIME_MAP[output.format];
}

export function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/png") return "png";
  return mime.split("/")[1] || "png";
}

/**
 * Full-resolution render → Blob. Identity transform: config coordinates ARE
 * pixel coordinates at native resolution. OffscreenCanvas with a <canvas>
 * fallback for older Safari (mirrors add-text's exporter).
 */
export async function exportWatermark(
  image: ImageBitmap | HTMLImageElement,
  naturalSize: ImageSize,
  config: WatermarkConfig,
  output: OutputSettings,
  sourceMime?: string,
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

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  renderWatermark({
    ctx: ctx as CanvasRenderingContext2D,
    image,
    naturalSize,
    config,
  });

  const mime = resolveMime(output, sourceMime);
  const isLossless = mime === "image/png";

  if ("convertToBlob" in canvas) {
    return await (canvas as OffscreenCanvas).convertToBlob({
      type: mime,
      quality: isLossless ? undefined : output.quality,
    });
  }
  return await new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      mime,
      isLossless ? undefined : output.quality,
    );
  });
}
