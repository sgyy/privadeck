import type { CompressOptions, CompressResult, ProgressCallback } from "./types";
import { rasterize } from "./rasterize";
import { imageOptimize } from "./imageOptimize";
import { detectMode } from "./detectMode";

export type {
  PdfQuality,
  CompressMode,
  CleanupOptions,
  CompressOptions,
  CompressResult,
  CompressReport,
  CompressReportItem,
  SizeMode,
  TargetSizeOptions,
} from "./types";
export {
  compressToTargetSize,
  type TargetSizeProgress,
  type TargetSizeProgressCallback,
} from "./targetSize";
export { detectMode } from "./detectMode";

export async function compressPdf(
  file: File,
  options: CompressOptions,
  onProgress?: ProgressCallback,
): Promise<CompressResult> {
  let detectedMode: Exclude<CompressOptions["mode"], "auto"> | undefined;
  let resolvedMode: Exclude<CompressOptions["mode"], "auto">;

  if (options.mode === "auto") {
    const detection = await detectMode(file, options.signal);
    detectedMode = detection.mode;
    resolvedMode = detection.mode;
  } else {
    resolvedMode = options.mode;
  }

  const resolvedOptions: CompressOptions = { ...options, mode: resolvedMode };

  if (resolvedMode === "image-optimize") {
    const result = await imageOptimize(file, resolvedOptions, onProgress);
    if (result !== null) return { ...result, detectedMode };
    const fallback = await rasterize(file, resolvedOptions, onProgress);
    return { ...fallback, detectedMode };
  }

  const result = await rasterize(file, resolvedOptions, onProgress);
  return { ...result, detectedMode };
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
