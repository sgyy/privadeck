export type OutputFormat = "image/jpeg" | "image/png" | "image/gif";

export interface DecodedHeic {
  frameCount: number;
  firstFramePng: Blob;
}

export async function decodeHeic(file: File): Promise<DecodedHeic> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    multiple: true,
    toType: "image/png",
  });
  const blobs = Array.isArray(result) ? result : [result];
  return { frameCount: blobs.length, firstFramePng: blobs[0] };
}

export async function convertHeic(
  file: File,
  decoded: DecodedHeic,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  if (format === "image/png") {
    return decoded.firstFramePng;
  }
  if (format === "image/jpeg") {
    return reencodePngToJpeg(decoded.firstFramePng, quality);
  }
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/gif" });
  return Array.isArray(result) ? result[0] : result;
}

async function reencodePngToJpeg(pngBlob: Blob, quality: number): Promise<Blob> {
  const url = URL.createObjectURL(pngBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Failed to load decoded image"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
        "image/jpeg",
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
