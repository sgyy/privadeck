import type {
  CompressMode,
  CompressOptions,
  CompressResult,
  PdfQuality,
  ProgressCallback,
  TargetSizeOptions,
} from "./types";
import { rasterize } from "./rasterize";
import { imageOptimize } from "./imageOptimize";
import { buildOriginalWithCleanup } from "./cleanup";
import { detectMode } from "./detectMode";

export type TargetSizeProgress =
  | { kind: "iteration"; iteration: number; totalIterations: number; quality: PdfQuality }
  | { kind: "page" | "image"; current: number; total: number };

export type TargetSizeProgressCallback = (event: TargetSizeProgress) => void;

interface AttemptPlan {
  quality: PdfQuality;
  customDpi?: number;
  customJpegQuality?: number;
}

const PRESET_ATTEMPTS: AttemptPlan[] = [
  { quality: "high" },
  { quality: "medium" },
  { quality: "low" },
  { quality: "custom", customDpi: 72, customJpegQuality: 30 },
];

async function runAttempt(
  file: File,
  mode: Exclude<CompressMode, "auto">,
  plan: AttemptPlan,
  cleanup: TargetSizeOptions["cleanup"],
  signal: AbortSignal | undefined,
  onProgress: ProgressCallback | undefined,
): Promise<CompressResult> {
  const options: CompressOptions = {
    mode,
    quality: plan.quality,
    customDpi: plan.customDpi,
    customJpegQuality: plan.customJpegQuality,
    cleanup,
    signal,
  };

  if (mode === "image-optimize") {
    const result = await imageOptimize(file, options, onProgress);
    if (result !== null) return result;
    return rasterize(file, options, onProgress);
  }
  return rasterize(file, options, onProgress);
}

export async function compressToTargetSize(
  file: File,
  options: TargetSizeOptions,
  onProgress?: TargetSizeProgressCallback,
): Promise<CompressResult> {
  const { targetBytes, mode, cleanup, signal } = options;

  if (file.size <= targetBytes) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleanedBytes = await buildOriginalWithCleanup(bytes, cleanup);
    return {
      blob: new Blob([cleanedBytes as BlobPart], { type: "application/pdf" }),
      usedOriginal: true,
      // No detectMode needed when the file already fits — pick a reasonable
      // default for modeUsed without running pdfjs.
      modeUsed: mode === "auto" ? "image-optimize" : mode,
      targetMet: true,
    };
  }

  let detectedMode: Exclude<CompressMode, "auto"> | undefined;
  let resolvedMode: Exclude<CompressMode, "auto">;
  if (mode === "auto") {
    detectedMode = (await detectMode(file, signal)).mode;
    resolvedMode = detectedMode;
  } else {
    resolvedMode = mode;
  }

  let bestResult: CompressResult | null = null;

  for (let i = 0; i < PRESET_ATTEMPTS.length; i++) {
    if (signal?.aborted) {
      throw new DOMException("Compression aborted", "AbortError");
    }
    const plan = PRESET_ATTEMPTS[i];
    onProgress?.({
      kind: "iteration",
      iteration: i + 1,
      totalIterations: PRESET_ATTEMPTS.length,
      quality: plan.quality,
    });

    const result = await runAttempt(file, resolvedMode, plan, cleanup, signal, (event) => {
      onProgress?.(event);
    });

    if (bestResult === null || result.blob.size < bestResult.blob.size) {
      bestResult = result;
    }

    if (result.blob.size <= targetBytes) {
      return { ...result, detectedMode, targetMet: true };
    }
  }

  // All attempts exhausted; return smallest result, marked as not meeting target.
  return { ...bestResult!, detectedMode, targetMet: false };
}
