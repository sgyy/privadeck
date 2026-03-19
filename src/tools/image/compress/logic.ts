import imageCompression from "browser-image-compression";

export interface CompressResult {
  original: File;
  compressed: Blob;
  originalSize: number;
  compressedSize: number;
  savings: number;
}

export async function compressImage(
  file: File,
  quality: number,
  maxSizeMB: number,
  maxResolution: number,
): Promise<CompressResult> {
  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight: maxResolution,
    useWebWorker: true,
    initialQuality: quality / 100,
  });

  const savings = Math.round((1 - compressed.size / file.size) * 100);

  return {
    original: file,
    compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
    savings,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const RESOLUTION_PRESETS = [
  { label: "Original", value: 0 },
  { label: "4K (3840)", value: 3840 },
  { label: "2K (2560)", value: 2560 },
  { label: "1920", value: 1920 },
  { label: "1280", value: 1280 },
  { label: "800", value: 800 },
];
