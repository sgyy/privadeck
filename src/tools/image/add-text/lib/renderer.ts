import type { ImageSize, TextLayer } from "./reducer";
import { buildFontString, measureLayerBox } from "./hitTest";
import { fillSpacedText, measureSpacedTextWidth, wrapTextToWidth } from "./textWrap";

export interface RenderInput {
  ctx: CanvasRenderingContext2D;
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement | null;
  naturalSize: ImageSize;
  layers: TextLayer[];
}

/**
 * Pure renderer: draws base image then each visible layer in order.
 * The ctx must already be transformed so that drawing in `naturalSize`
 * coordinates produces the right output. Both editor preview and full-resolution
 * exporter call this.
 */
export function renderLayers({ ctx, image, naturalSize, layers }: RenderInput): void {
  ctx.clearRect(0, 0, naturalSize.w, naturalSize.h);
  if (image) ctx.drawImage(image, 0, 0, naturalSize.w, naturalSize.h);
  for (const layer of layers) {
    if (!layer.visible || !layer.text) continue;
    drawLayer(ctx, layer, naturalSize);
  }
}

function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  size: ImageSize,
): string[] {
  if (layer.wrapWidthNorm == null) {
    return layer.text.split("\n");
  }
  const maxWidth = layer.wrapWidthNorm * size.w;
  return wrapTextToWidth(ctx, layer.text, maxWidth, layer.letterSpacing);
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  size: ImageSize,
): void {
  // When shadow is on and opacity < 1, the inline 3-pass would composite the
  // fill twice through globalAlpha. Render to an offscreen canvas at α=1 and
  // composite once via drawImage to keep the math right.
  if (
    layer.shadowEnabled &&
    layer.opacity < 1 &&
    typeof document !== "undefined"
  ) {
    drawLayerOffscreen(ctx, layer, size);
    return;
  }
  drawLayerInline(ctx, layer, size);
}

function drawLayerInline(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  size: ImageSize,
): void {
  const cx = layer.xNorm * size.w;
  const cy = layer.yNorm * size.h;
  const lineHeight = layer.fontSizePx * layer.lineHeight;

  ctx.save();
  ctx.globalAlpha = layer.opacity;

  // Move into layer-local coordinates: origin at layer center, rotated.
  ctx.translate(cx, cy);
  if (layer.rotationDeg !== 0) {
    ctx.rotate((layer.rotationDeg * Math.PI) / 180);
  }

  ctx.font = buildFontString(layer);
  ctx.fillStyle = layer.color;
  ctx.strokeStyle = layer.strokeColor;
  ctx.lineWidth = layer.strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.textBaseline = "middle";

  const lines = getWrappedLines(ctx, layer, size);
  const totalHeight = lines.length * lineHeight;
  const startY = -totalHeight / 2 + lineHeight / 2;

  drawBackground(ctx, layer, lines, lineHeight, startY);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const y = startY + i * lineHeight;
    drawLineWithEffects(ctx, layer, line, y);
  }

  ctx.restore();
}

function drawLayerOffscreen(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  size: ImageSize,
): void {
  const cx = layer.xNorm * size.w;
  const cy = layer.yNorm * size.h;

  // Size the offscreen to the layer's pre-rotation bbox + shadow margin so
  // the shadow halo is not clipped at the edge.
  const measuredLines = (() => {
    ctx.save();
    ctx.font = buildFontString(layer);
    const result =
      layer.wrapWidthNorm == null
        ? layer.text.split("\n")
        : wrapTextToWidth(
            ctx,
            layer.text,
            layer.wrapWidthNorm * size.w,
            layer.letterSpacing,
          );
    ctx.restore();
    return result;
  })();

  ctx.save();
  ctx.font = buildFontString(layer);
  let maxLineWidth = 0;
  for (const line of measuredLines) {
    const w = measureSpacedTextWidth(ctx, line, layer.letterSpacing);
    if (w > maxLineWidth) maxLineWidth = w;
  }
  ctx.restore();

  const lineHeight = layer.fontSizePx * layer.lineHeight;
  const totalHeight = measuredLines.length * lineHeight;
  const padX = layer.bgMode !== "none" ? layer.bgPaddingX * 2 : 0;
  const padY = layer.bgMode !== "none" ? layer.bgPaddingY * 2 : 0;
  const stroke = Math.max(layer.strokeWidth, 0);
  const contentW = Math.max(maxLineWidth, layer.fontSizePx) + padX + stroke;
  const contentH = totalHeight + padY + stroke;

  const shadowMargin =
    Math.max(0, layer.shadowBlur) +
    Math.max(Math.abs(layer.shadowOffsetX), Math.abs(layer.shadowOffsetY)) +
    8;
  const offW = Math.ceil(contentW + 2 * shadowMargin);
  const offH = Math.ceil(contentH + 2 * shadowMargin);

  const off = document.createElement("canvas");
  off.width = offW;
  off.height = offH;
  const offCtx = off.getContext("2d");
  if (!offCtx) {
    drawLayerInline(ctx, layer, size);
    return;
  }

  // Render the layer flat (no rotation, full opacity) at the offscreen center.
  // Re-scale wrap width so wrapping uses the same absolute pixel budget.
  const offSize: ImageSize = { w: offW, h: offH };
  const offLayer: TextLayer = {
    ...layer,
    opacity: 1,
    rotationDeg: 0,
    xNorm: 0.5,
    yNorm: 0.5,
    wrapWidthNorm:
      layer.wrapWidthNorm == null
        ? null
        : (layer.wrapWidthNorm * size.w) / offW,
  };
  drawLayerInline(offCtx, offLayer, offSize);

  // Composite once with rotation + opacity.
  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.translate(cx, cy);
  if (layer.rotationDeg !== 0) {
    ctx.rotate((layer.rotationDeg * Math.PI) / 180);
  }
  ctx.drawImage(off, -offW / 2, -offH / 2);
  ctx.restore();
}

function drawLineWithEffects(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  line: string,
  y: number,
): void {
  // Pass 1: shadow (uses fillText's built-in shadow on first paint)
  if (layer.shadowEnabled && layer.shadowBlur >= 0) {
    ctx.save();
    ctx.shadowColor = layer.shadowColor;
    ctx.shadowBlur = layer.shadowBlur;
    ctx.shadowOffsetX = layer.shadowOffsetX;
    ctx.shadowOffsetY = layer.shadowOffsetY;
    fillSpacedText(ctx, line, 0, y, layer.letterSpacing, layer.align, "fill");
    ctx.restore();
  }

  // Pass 2: stroke (no shadow)
  if (layer.strokeWidth > 0) {
    fillSpacedText(ctx, line, 0, y, layer.letterSpacing, layer.align, "stroke");
  }

  // Pass 3: fill (covers the centre, hiding the underlying shadow-pass fill)
  fillSpacedText(ctx, line, 0, y, layer.letterSpacing, layer.align, "fill");
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  lines: string[],
  lineHeight: number,
  startY: number,
): void {
  if (layer.bgMode === "none" || lines.length === 0) return;

  ctx.save();
  const bgColor = applyAlpha(layer.bgColor, layer.bgOpacity);
  ctx.fillStyle = bgColor;
  const radius = layer.bgRadius;

  if (layer.bgMode === "full") {
    let maxWidth = 0;
    for (const line of lines) {
      const w = measureSpacedTextWidth(ctx, line, layer.letterSpacing);
      if (w > maxWidth) maxWidth = w;
    }
    const totalH = lines.length * lineHeight;
    const x = -maxWidth / 2 - layer.bgPaddingX;
    const y = startY - lineHeight / 2 - layer.bgPaddingY;
    drawRoundedRect(
      ctx,
      x,
      y,
      maxWidth + 2 * layer.bgPaddingX,
      totalH + 2 * layer.bgPaddingY,
      radius,
    );
    ctx.fill();
  } else if (layer.bgMode === "line") {
    for (let i = 0; i < lines.length; i++) {
      const w = measureSpacedTextWidth(ctx, lines[i], layer.letterSpacing);
      const lineY = startY + i * lineHeight;
      let x: number;
      if (layer.align === "left") x = 0 - layer.bgPaddingX;
      else if (layer.align === "right") x = -w - layer.bgPaddingX;
      else x = -w / 2 - layer.bgPaddingX;
      drawRoundedRect(
        ctx,
        x,
        lineY - lineHeight / 2 - layer.bgPaddingY,
        w + 2 * layer.bgPaddingX,
        lineHeight + 2 * layer.bgPaddingY,
        radius,
      );
      ctx.fill();
    }
  } else if (layer.bgMode === "word") {
    for (let i = 0; i < lines.length; i++) {
      const lineY = startY + i * lineHeight;
      const totalLineWidth = measureSpacedTextWidth(
        ctx,
        lines[i],
        layer.letterSpacing,
      );
      let cursorX: number;
      if (layer.align === "left") cursorX = 0;
      else if (layer.align === "right") cursorX = -totalLineWidth;
      else cursorX = -totalLineWidth / 2;

      const elements = lines[i].split(/(\s+)/).filter((s) => s.length > 0);
      for (let j = 0; j < elements.length; j++) {
        const elt = elements[j];
        const w = measureSpacedTextWidth(ctx, elt, layer.letterSpacing);
        if (elt.trim().length > 0) {
          drawRoundedRect(
            ctx,
            cursorX - layer.bgPaddingX,
            lineY - lineHeight / 2 - layer.bgPaddingY,
            w + 2 * layer.bgPaddingX,
            lineHeight + 2 * layer.bgPaddingY,
            radius,
          );
          ctx.fill();
        }
        cursorX += w;
        // The grapheme boundary between this element and the next still gets
        // the layer letter-spacing offset, matching fillSpacedText's behavior.
        if (j < elements.length - 1) cursorX += layer.letterSpacing;
      }
    }
  }
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function applyAlpha(color: string, alpha: number): string {
  // #rgb, #rgba, #rrggbb, #rrggbbaa → re-emit as rgba() with the supplied alpha.
  // Any non-hex input or malformed length falls through unchanged so we don't
  // silently turn a named/rgb()/rgba() color into black.
  if (color.startsWith("#")) {
    let r: number | null = null;
    let g: number | null = null;
    let b: number | null = null;
    if (color.length === 4 || color.length === 5) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else if (color.length === 7 || color.length === 9) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
    if (r != null && g != null && b != null && !isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

// Re-export so callers don't have to import from ../hitTest
export { measureLayerBox };
