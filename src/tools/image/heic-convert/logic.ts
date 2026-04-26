export type OutputFormat = "image/jpeg" | "image/png";

export type UserRotate = 0 | 90 | 180 | 270;

export interface UserTransform {
  rotate: UserRotate;
  flipH: boolean;
  flipV: boolean;
}

export interface ExifInfo {
  make?: string;
  model?: string;
  software?: string;
  orientation?: number;
  dateTimeOriginal?: string;
}

export interface AppleSource {
  model: string;
  software?: string;
}

export interface DecodedImage {
  blob: Blob;
  url: string;
  img: HTMLImageElement;
  width: number;
  height: number;
}

export async function parseHeicExif(file: File): Promise<ExifInfo> {
  try {
    const exifr = (await import("exifr")).default;
    const tags = await exifr.parse(file, [
      "Make",
      "Model",
      "Software",
      "Orientation",
      "DateTimeOriginal",
    ]);
    if (!tags) return {};
    return {
      make: typeof tags.Make === "string" ? tags.Make.trim() : undefined,
      model: typeof tags.Model === "string" ? tags.Model.trim() : undefined,
      software: typeof tags.Software === "string" ? tags.Software.trim() : undefined,
      orientation: typeof tags.Orientation === "number" ? tags.Orientation : undefined,
      dateTimeOriginal:
        tags.DateTimeOriginal instanceof Date
          ? tags.DateTimeOriginal.toISOString()
          : typeof tags.DateTimeOriginal === "string"
            ? tags.DateTimeOriginal
            : undefined,
    };
  } catch {
    return {};
  }
}

export function detectApple(exif: ExifInfo): AppleSource | null {
  if (!exif.make) return null;
  if (exif.make.toLowerCase() !== "apple") return null;
  return {
    model: exif.model || "Apple Device",
    software: exif.software,
  };
}

export async function decodeHeic(file: File): Promise<DecodedImage> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/png",
  });
  const blob = Array.isArray(result) ? result[0] : result;
  const url = URL.createObjectURL(blob);
  const img = await loadImage(url);
  return { blob, url, img, width: img.naturalWidth, height: img.naturalHeight };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Apply EXIF orientation (1-8, TIFF spec), then user rotate (0/90/180/270), then user flip.
 * Canvas dimensions are set to match the final visual output.
 */
export function renderToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  exifOrientation: number | undefined,
  transform: UserTransform,
): void {
  const orient = exifOrientation ?? 1;
  const exifSwapsAxes = orient >= 5 && orient <= 8;
  const userSwapsAxes = transform.rotate === 90 || transform.rotate === 270;
  const swap = exifSwapsAxes !== userSwapsAxes;

  const baseW = img.naturalWidth;
  const baseH = img.naturalHeight;
  const outW = swap ? baseH : baseW;
  const outH = swap ? baseW : baseH;

  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, outW, outH);

  // Move origin to center so rotations and flips compose around the middle
  ctx.translate(outW / 2, outH / 2);

  // Apply user flip first in the output frame
  if (transform.flipH) ctx.scale(-1, 1);
  if (transform.flipV) ctx.scale(1, -1);

  // Apply user rotate
  if (transform.rotate) {
    ctx.rotate((transform.rotate * Math.PI) / 180);
  }

  // Apply EXIF orientation (drawn image is still in sensor frame, so we rotate/mirror it)
  applyExifOrientation(ctx, orient);

  ctx.drawImage(img, -baseW / 2, -baseH / 2);
  ctx.restore();
}

function applyExifOrientation(ctx: CanvasRenderingContext2D, orientation: number): void {
  switch (orientation) {
    case 2:
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.rotate(Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.rotate(Math.PI / 2);
      break;
    case 7:
      ctx.rotate(-Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 8:
      ctx.rotate(-Math.PI / 2);
      break;
    case 1:
    default:
      break;
  }
}

export function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image"));
          return;
        }
        resolve(blob);
      },
      format,
      format === "image/jpeg" ? quality : undefined,
    );
  });
}
