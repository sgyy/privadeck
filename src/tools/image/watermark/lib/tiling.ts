import type { ImageSize } from "@/tools/image/add-text/lib/reducer";

/** Hard cap on tile instances — protects preview/export perf at high density. */
export const MAX_TILE_INSTANCES = 600;

/**
 * Centers for a tiled watermark. Builds a grid in a frame rotated by angleDeg
 * around the image center, spanning the image diagonal so coverage is complete
 * for any angle. Caller supplies the per-cell step (element size + gap) in px.
 */
export function computeTileCenters(
  size: ImageSize,
  stepX: number,
  stepY: number,
  angleDeg: number,
  maxInstances = MAX_TILE_INSTANCES,
): { x: number; y: number }[] {
  const sx = Math.max(stepX, 1);
  const sy = Math.max(stepY, 1);
  const cx = size.w / 2;
  const cy = size.h / 2;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // Half the diagonal + one step guarantees the rotated grid overflows every edge.
  const half = Math.hypot(size.w, size.h) / 2 + Math.max(sx, sy);

  const centers: { x: number; y: number }[] = [];
  for (let y = -half; y <= half; y += sy) {
    for (let x = -half; x <= half; x += sx) {
      centers.push({
        x: x * cos - y * sin + cx,
        y: x * sin + y * cos + cy,
      });
      if (centers.length >= maxInstances) return centers;
    }
  }
  return centers;
}
