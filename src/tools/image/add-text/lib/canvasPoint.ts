import type { ImageSize } from "./reducer";

export interface Point {
  x: number;
  y: number;
}

export function getCanvasCssPoint(
  e: PointerEvent | React.PointerEvent,
  canvas: HTMLCanvasElement,
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

export function cssToOriginal(point: Point, editorScale: number): Point {
  return {
    x: point.x / editorScale,
    y: point.y / editorScale,
  };
}

export function originalToCss(point: Point, editorScale: number): Point {
  return {
    x: point.x * editorScale,
    y: point.y * editorScale,
  };
}

export function normalizedToOriginal(
  xNorm: number,
  yNorm: number,
  size: ImageSize,
): Point {
  return { x: xNorm * size.w, y: yNorm * size.h };
}

export function originalToNormalized(
  point: Point,
  size: ImageSize,
): { xNorm: number; yNorm: number } {
  return {
    xNorm: clamp01(point.x / size.w),
    yNorm: clamp01(point.y / size.h),
  };
}

export function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function computeEditorScale(
  natural: ImageSize,
  containerWidth: number,
  maxWidth = 900,
  maxHeight = 600,
): number {
  const widthScale = Math.min(containerWidth, maxWidth) / natural.w;
  const heightScale = maxHeight / natural.h;
  return Math.min(widthScale, heightScale, 1);
}

export function getDpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}
