import type { ImageSize, TextLayer } from "./reducer";

export interface SnapGuide {
  /** Vertical guide pinned at world X, or horizontal guide pinned at world Y. */
  axis: "x" | "y";
  /** Position in original-image px. */
  pos: number;
}

export interface SnapResult {
  /** New center X in original-image px after snapping (null = no snap on X). */
  snappedX: number | null;
  /** New center Y in original-image px after snapping (null = no snap on Y). */
  snappedY: number | null;
  guides: SnapGuide[];
}

function nearest(value: number, candidates: number[], threshold: number): number | null {
  let best: { d: number; v: number } | null = null;
  for (const c of candidates) {
    const d = Math.abs(value - c);
    if (d <= threshold && (!best || d < best.d)) best = { d, v: c };
  }
  return best ? best.v : null;
}

/**
 * Compute snap targets for the dragging layer's center against:
 *   - canvas horizontal/vertical midlines and edges (top/left/right/bottom),
 *   - the centers of every other visible, unlocked layer.
 *
 * Only the center is considered (not bbox edges) — this keeps the guide set
 * sparse and the math cheap. Threshold is in original-image px so callers
 * should convert from screen px (e.g. 6 / editorScale).
 */
export function computeCenterSnap(
  draggingId: string,
  draggingCenter: { x: number; y: number },
  layers: TextLayer[],
  size: ImageSize,
  thresholdOrig: number,
): SnapResult {
  const xCandidates: number[] = [size.w / 2, 0, size.w];
  const yCandidates: number[] = [size.h / 2, 0, size.h];
  for (const l of layers) {
    if (l.id === draggingId) continue;
    if (!l.visible) continue;
    xCandidates.push(l.xNorm * size.w);
    yCandidates.push(l.yNorm * size.h);
  }

  const snappedX = nearest(draggingCenter.x, xCandidates, thresholdOrig);
  const snappedY = nearest(draggingCenter.y, yCandidates, thresholdOrig);

  const guides: SnapGuide[] = [];
  if (snappedX !== null) guides.push({ axis: "x", pos: snappedX });
  if (snappedY !== null) guides.push({ axis: "y", pos: snappedY });

  return { snappedX, snappedY, guides };
}
