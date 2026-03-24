import imageCompression from "browser-image-compression";

export type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";

export type PresetKey = "high-quality" | "balanced" | "small-file" | "custom";

export interface CompressOptions {
  quality: number;
  maxSizeMB: number;
  maxWidthOrHeight: number;
  outputFormat: OutputFormat;
  preserveExif: boolean;
  customWidth?: number;
  customHeight?: number;
}

export interface CompressResult {
  original: File;
  compressed: Blob;
  originalSize: number;
  compressedSize: number;
  savings: number;
  outputFormat: string;
}

export const COMPRESSION_PRESETS: Record<
  PresetKey,
  Pick<CompressOptions, "quality" | "maxSizeMB" | "maxWidthOrHeight">
> = {
  "high-quality": { quality: 90, maxSizeMB: 10, maxWidthOrHeight: 0 },
  balanced: { quality: 75, maxSizeMB: 1, maxWidthOrHeight: 0 },
  "small-file": { quality: 50, maxSizeMB: 1, maxWidthOrHeight: 1920 },
  custom: { quality: 80, maxSizeMB: 1, maxWidthOrHeight: 0 },
};

export async function compressImage(
  file: File,
  options: CompressOptions,
): Promise<CompressResult> {
  const maxDim =
    options.customWidth && options.customHeight
      ? Math.max(options.customWidth, options.customHeight)
      : options.maxWidthOrHeight || 16384;

  const compressionOptions: Record<string, unknown> = {
    maxSizeMB: options.maxSizeMB,
    maxWidthOrHeight: maxDim,
    useWebWorker: true,
    initialQuality: options.quality / 100,
    preserveExif: options.preserveExif,
  };

  if (options.outputFormat !== "original") {
    compressionOptions.fileType = options.outputFormat;
  }

  const compressed = await imageCompression(
    file,
    compressionOptions as Parameters<typeof imageCompression>[1],
  );

  const savings = Math.round((1 - compressed.size / file.size) * 100);

  return {
    original: file,
    compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
    savings,
    outputFormat: options.outputFormat === "original" ? file.type : options.outputFormat,
  };
}

export { formatFileSize } from "@/lib/utils/formatFileSize";

export const RESOLUTION_PRESETS = [
  { label: "Original", value: 0 },
  { label: "4K (3840)", value: 3840 },
  { label: "2K (2560)", value: 2560 },
  { label: "1920", value: 1920 },
  { label: "1280", value: 1280 },
  { label: "800", value: 800 },
];
