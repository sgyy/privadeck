export type OutputFormat = "image/jpeg" | "image/png" | "image/gif";
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
  frameCount: number;
  frames: Blob[];
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
    multiple: true,
    toType: "image/png",
  });
  const frames = Array.isArray(result) ? result : [result];
  const blob = frames[0];
  const url = URL.createObjectURL(blob);
  const img = await loadImage(url);
  return {
    blob,
    url,
    img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    frameCount: frames.length,
    frames,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Apply EXIF orientation (1-8, TIFF spec), then user rotate (0/90/180/270), then user flip.
 * Canvas dimensions are set to match the final visual output. When maxDim is provided
 * and the longest output side exceeds it, the entire result is uniformly scaled down.
 */
export function renderToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  exifOrientation: number | undefined,
  transform: UserTransform,
  maxDim?: number,
): void {
  const orient = exifOrientation ?? 1;
  const exifSwapsAxes = orient >= 5 && orient <= 8;
  const userSwapsAxes = transform.rotate === 90 || transform.rotate === 270;
  const swap = exifSwapsAxes !== userSwapsAxes;

  const baseW = img.naturalWidth;
  const baseH = img.naturalHeight;
  const outW = swap ? baseH : baseW;
  const outH = swap ? baseW : baseH;

  const scale = maxDim ? Math.min(1, maxDim / Math.max(outW, outH)) : 1;
  const finalW = Math.max(1, Math.round(outW * scale));
  const finalH = Math.max(1, Math.round(outH * scale));

  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, finalW, finalH);

  ctx.translate(finalW / 2, finalH / 2);
  if (scale !== 1) ctx.scale(scale, scale);

  if (transform.flipH) ctx.scale(-1, 1);
  if (transform.flipV) ctx.scale(1, -1);

  if (transform.rotate) {
    ctx.rotate((transform.rotate * Math.PI) / 180);
  }

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

export interface GifEncodeOptions {
  maxDim?: number;
  frameDelayMs?: number;
  onProgress?: (progress: number) => void;
}

const DEFAULT_GIF_MAX_DIM = 1080;
const DEFAULT_GIF_FRAME_DELAY_MS = 100;

export async function convertFramesToGif(
  frames: Blob[],
  exifOrientation: number | undefined,
  transform: UserTransform,
  options: GifEncodeOptions = {},
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error("No frames to encode");
  }

  const maxDim = options.maxDim ?? DEFAULT_GIF_MAX_DIM;
  const frameDelayMs = options.frameDelayMs ?? DEFAULT_GIF_FRAME_DELAY_MS;

  const GIF = (await import("gif.js.optimized")).default;
  const workerScript = new URL(
    "gif.js.optimized/dist/gif.worker.js",
    import.meta.url,
  ).toString();

  // Render the first frame to discover the output canvas size after EXIF + transform + scale.
  const canvas = document.createElement("canvas");
  const firstImg = await loadImageFromBlob(frames[0]);
  renderToCanvas(firstImg, canvas, exifOrientation, transform, maxDim);

  const encoder = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript,
  });

  encoder.addFrame(canvas, { delay: frameDelayMs, copy: true });

  for (let i = 1; i < frames.length; i++) {
    const img = await loadImageFromBlob(frames[i]);
    renderToCanvas(img, canvas, exifOrientation, transform, maxDim);
    encoder.addFrame(canvas, { delay: frameDelayMs, copy: true });
  }

  return new Promise<Blob>((resolve, reject) => {
    encoder.on("progress", (p: number) => {
      options.onProgress?.(p);
    });
    encoder.on("finished", (blob: Blob) => {
      resolve(blob);
    });
    encoder.on("abort", () => {
      reject(new Error("GIF encoding aborted"));
    });
    encoder.render();
  });
}
