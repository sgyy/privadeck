import type { ImageSize, TextLayer } from "./reducer";
import { measureLayerBox, type BoundingBox } from "./hitTest";

export type HandleId = "nw" | "ne" | "se" | "sw" | "rotate";

export interface Handle {
  id: HandleId;
  /** Local-frame coordinates (origin = box center, before rotation). */
  lx: number;
  ly: number;
}

/** Distance in original-image px from the box top edge to the rotate handle. */
export const ROTATE_OFFSET_PX = 32;

export function getLayerHandles(
  layer: TextLayer,
  size: ImageSize,
): { box: BoundingBox; handles: Handle[] } {
  const box = measureLayerBox(layer, size);
  const w = box.width / 2;
  const h = box.height / 2;
  const handles: Handle[] = [
    { id: "nw", lx: -w, ly: -h },
    { id: "ne", lx: w, ly: -h },
    { id: "se", lx: w, ly: h },
    { id: "sw", lx: -w, ly: h },
    { id: "rotate", lx: 0, ly: -h - ROTATE_OFFSET_PX },
  ];
  return { box, handles };
}

/**
 * Transform a world-space point (original-image px) into the layer's local
 * frame (origin = box center, aligned with the unrotated box).
 */
export function worldToLocal(
  layer: TextLayer,
  box: BoundingBox,
  point: { x: number; y: number },
): { lx: number; ly: number } {
  const dx = point.x - box.cx;
  const dy = point.y - box.cy;
  const rad = (-layer.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { lx: dx * cos - dy * sin, ly: dx * sin + dy * cos };
}

/**
 * Hit-test a world-space point against the layer's handles.
 * Returns the hit handle id (rotate > corners) or null. `toleranceOrig` is
 * the half-side of the square hit zone, in original-image px.
 */
export function hitTestHandle(
  layer: TextLayer,
  size: ImageSize,
  point: { x: number; y: number },
  toleranceOrig: number,
): HandleId | null {
  const { box, handles } = getLayerHandles(layer, size);
  const { lx, ly } = worldToLocal(layer, box, point);
  // Rotate handle sits outside the box, so check it first to avoid the corner
  // handles eating its hit zone when the box is small.
  const order: HandleId[] = ["rotate", "nw", "ne", "se", "sw"];
  for (const id of order) {
    const h = handles.find((x) => x.id === id);
    if (!h) continue;
    if (Math.abs(lx - h.lx) <= toleranceOrig && Math.abs(ly - h.ly) <= toleranceOrig) {
      return id;
    }
  }
  return null;
}

export function cursorForHandle(id: HandleId): string {
  switch (id) {
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    case "rotate":
      return "crosshair";
  }
}
