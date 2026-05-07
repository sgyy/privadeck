import type { ImageSize, TextLayer } from "./reducer";
import { measureSpacedTextWidth, wrapTextToWidth } from "./textWrap";

export interface BoundingBox {
  /** Center x in original-image pixels */
  cx: number;
  /** Center y in original-image pixels */
  cy: number;
  /** Width in original-image pixels (axis-aligned, before rotation) */
  width: number;
  /** Height in original-image pixels (axis-aligned, before rotation) */
  height: number;
}

let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!measureCtx) {
    measureCanvas = document.createElement("canvas");
    measureCanvas.width = 1;
    measureCanvas.height = 1;
    measureCtx = measureCanvas.getContext("2d");
  }
  return measureCtx;
}

export function buildFontString(layer: TextLayer): string {
  return `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSizePx}px ${layer.fontFamily}, system-ui, sans-serif`;
}

/**
 * Measure the AABB of a text layer in original-image pixel space.
 * Includes background padding when bgMode != "none". Honors auto-wrap so the
 * selection overlay and OBB hit test match what the renderer actually draws.
 */
export function measureLayerBox(layer: TextLayer, size: ImageSize): BoundingBox {
  const ctx = getMeasureCtx();
  let lines: string[];

  if (ctx) {
    ctx.font = buildFontString(layer);
    if (layer.wrapWidthNorm != null) {
      lines = wrapTextToWidth(
        ctx,
        layer.text,
        layer.wrapWidthNorm * size.w,
        layer.letterSpacing,
      );
    } else {
      lines = layer.text.split("\n");
    }
  } else {
    lines = layer.text.split("\n");
  }

  const lineHeight = layer.fontSizePx * layer.lineHeight;

  let maxWidth = 0;
  if (ctx) {
    for (const line of lines) {
      const w = measureSpacedTextWidth(ctx, line, layer.letterSpacing);
      if (w > maxWidth) maxWidth = w;
    }
  } else {
    // Fallback: estimate average glyph width
    maxWidth = Math.max(...lines.map((l) => l.length)) * layer.fontSizePx * 0.55;
  }

  const padX = layer.bgMode !== "none" ? layer.bgPaddingX * 2 : 0;
  const padY = layer.bgMode !== "none" ? layer.bgPaddingY * 2 : 0;
  const width = maxWidth + padX + Math.max(layer.strokeWidth, 0);
  const height = lines.length * lineHeight + padY + Math.max(layer.strokeWidth, 0);

  return {
    cx: layer.xNorm * size.w,
    cy: layer.yNorm * size.h,
    width: Math.max(width, layer.fontSizePx),
    height: Math.max(height, layer.fontSizePx),
  };
}

/**
 * OBB hit test: rotates the test point into the layer's local frame
 * and checks against the AABB. Returns true if the point falls inside.
 */
export function hitTestLayer(
  layer: TextLayer,
  size: ImageSize,
  point: { x: number; y: number },
): boolean {
  if (!layer.visible || layer.locked) return false;
  const box = measureLayerBox(layer, size);
  const dx = point.x - box.cx;
  const dy = point.y - box.cy;
  const rad = (-layer.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return (
    Math.abs(localX) <= box.width / 2 && Math.abs(localY) <= box.height / 2
  );
}

/**
 * Find the topmost (last-rendered) layer at the given point.
 * Returns the layer id, or null if none hit.
 */
export function findLayerAtPoint(
  layers: TextLayer[],
  size: ImageSize,
  point: { x: number; y: number },
): string | null {
  for (let i = layers.length - 1; i >= 0; i--) {
    if (hitTestLayer(layers[i], size, point)) return layers[i].id;
  }
  return null;
}
