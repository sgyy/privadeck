export type OutputFormat = "image/jpeg" | "image/png";

export async function convertHeic(
  file: File,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  // Dynamic import to avoid "window is not defined" during SSR
  const heic2any = (await import("heic2any")).default;

  const result = await heic2any({
    blob: file,
    toType: format,
    quality,
  });

  // heic2any may return a single Blob or an array of Blobs
  if (Array.isArray(result)) {
    return result[0];
  }
  return result;
}
