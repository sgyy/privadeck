import imageCompression from "browser-image-compression";

export type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp" | "image/avif";

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

async function compressImageToAvif(
  file: File,
  options: CompressOptions,
): Promise<CompressResult> {
  // Load image to canvas for pixel data
  const img = await createImageBitmap(file);

  let width = img.width;
  let height = img.height;

  // Apply scale if custom dimensions or maxWidthOrHeight is set
  const maxDim =
    options.customWidth && options.customHeight
      ? Math.max(options.customWidth, options.customHeight)
      : options.maxWidthOrHeight || 0;
  if (maxDim > 0 && (width > maxDim || height > maxDim)) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  const { encode } = await import("@jsquash/avif");
  const avifBuffer = await encode(imageData, {
    quality: options.quality,
    speed: 6,
  });

  const compressed = new Blob([avifBuffer], { type: "image/avif" });
  const savings = Math.round((1 - compressed.size / file.size) * 100);

  return {
    original: file,
    compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
    savings,
    outputFormat: "image/avif",
  };
}

export async function compressImage(
  file: File,
  options: CompressOptions,
): Promise<CompressResult> {
  if (options.outputFormat === "image/avif") {
    return compressImageToAvif(file, options);
  }

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
