export type UserRotate = 0 | 90 | 180 | 270;

export interface Transform {
  rotate: UserRotate;
  flipH: boolean;
  flipV: boolean;
}

export const INITIAL_TRANSFORM: Transform = {
  rotate: 0,
  flipH: false,
  flipV: false,
};

export type Op = "flipH" | "flipV" | "rotateCW" | "rotateCCW";

// In renderToCanvas, transforms are pushed onto the ctx as flipH → flipV → rotate.
// Equivalently, the image is rotated first then flipped in screen space, so toggling
// flipH after a rotate mirrors the *visible* image — already WYSIWYG without axis swap.
export function applyOperation(prev: Transform, op: Op): Transform {
  switch (op) {
    case "rotateCW":
      return { ...prev, rotate: ((prev.rotate + 90) % 360) as UserRotate };
    case "rotateCCW":
      return { ...prev, rotate: ((prev.rotate + 270) % 360) as UserRotate };
    case "flipH":
      return { ...prev, flipH: !prev.flipH };
    case "flipV":
      return { ...prev, flipV: !prev.flipV };
  }
}

export interface DecodedImage {
  img: HTMLImageElement;
  url: string;
  width: number;
  height: number;
}

export function loadImageFromFile(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function renderToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  transform: Transform,
  maxDim?: number,
): void {
  const swap = transform.rotate === 90 || transform.rotate === 270;
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
  if (transform.rotate) ctx.rotate((transform.rotate * Math.PI) / 180);
  ctx.drawImage(img, -baseW / 2, -baseH / 2);
  ctx.restore();
}

export type EncodeMime = "image/jpeg" | "image/png" | "image/webp";

export function pickOutputMime(file: File): EncodeMime {
  const t = (file.type || "").toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg") return "image/jpeg";
  if (t === "image/webp") return "image/webp";
  return "image/png";
}

export function mimeToExt(mime: EncodeMime): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

export function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: EncodeMime,
  quality?: number,
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
      mime,
      mime === "image/jpeg" ? (quality ?? 0.92) : undefined,
    );
  });
}
