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
  // composite once via drawImage to keep the math right. Arc text skips this
  // path — its bounding box doesn't match the offscreen sizing math, so it
  // accepts the alpha-doubling artifact in this rare combination.
  const isArc = layer.curveMode === "arc" && layer.curvature !== 0;
  if (
    layer.shadowEnabled &&
    layer.opacity < 1 &&
    !isArc &&
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
  ctx.strokeStyle = layer.strokeColor;
  ctx.lineWidth = layer.strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.textBaseline = "middle";

  // Arc text takes a different path: single line, no background frame, every
  // glyph is rotated to follow the tangent. wrapWidth and bg are ignored.
  // We deliberately don't call applyFillStyle here — a CanvasGradient created
  // in the layer-local frame would be sampled per-character at the arc's
  // vertical apex (≈ y=0), so every glyph would end up the same colour.
  // drawArcLine handles gradient mode by lerping per-character instead.
  if (layer.curveMode === "arc" && layer.curvature !== 0) {
    ctx.fillStyle = layer.color;
    drawArcLine(ctx, layer);
    ctx.restore();
    return;
  }

  const lines = getWrappedLines(ctx, layer, size);
  const totalHeight = lines.length * lineHeight;
  const startY = -totalHeight / 2 + lineHeight / 2;

  let maxLineW = 0;
  for (const line of lines) {
    const w = measureSpacedTextWidth(ctx, line, layer.letterSpacing);
    if (w > maxLineW) maxLineW = w;
  }
  applyFillStyle(ctx, layer, {
    width: Math.max(maxLineW, layer.fontSizePx),
    height: Math.max(totalHeight, layer.fontSizePx),
  });

  drawBackground(ctx, layer, lines, lineHeight, startY);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const y = startY + i * lineHeight;
    drawLineWithEffects(ctx, layer, line, y);
  }

  ctx.restore();
}

interface FillBbox {
  width: number;
  height: number;
}

function applyFillStyle(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  bbox: FillBbox,
): void {
  if (layer.fillMode !== "gradient") {
    ctx.fillStyle = layer.color;
    return;
  }
  // Compute endpoints so the gradient covers the bbox along the requested angle,
  // centered at the local origin (which sits at the text block center).
  const angle = (layer.gradientAngle * Math.PI) / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const span = (Math.abs(dx) * bbox.width + Math.abs(dy) * bbox.height) / 2;
  const grad = ctx.createLinearGradient(-span * dx, -span * dy, span * dx, span * dy);
  grad.addColorStop(0, layer.gradientStartColor);
  grad.addColorStop(1, layer.gradientEndColor);
  ctx.fillStyle = grad;
}

function drawArcLine(ctx: CanvasRenderingContext2D, layer: TextLayer): void {
  const text = layer.text.replace(/\n/g, " ");
  const chars = Array.from(text);
  if (chars.length === 0) return;
  const widths = chars.map((c) => measureSpacedTextWidth(ctx, c, 0));
  const totalWidth =
    widths.reduce((a, b) => a + b, 0) + Math.max(0, chars.length - 1) * layer.letterSpacing;
  if (totalWidth <= 0) return;

  const totalAngle = (layer.curvature / 100) * Math.PI;
  const alpha = Math.abs(totalAngle) / 2;
  const R = totalWidth / (2 * Math.sin(alpha));
  const sgn = Math.sign(layer.curvature) || 1;
  const useGradient = layer.fillMode === "gradient";

  const prevAlign = ctx.textAlign;
  ctx.textAlign = "center";

  let walked = -totalWidth / 2;
  for (let i = 0; i < chars.length; i++) {
    const w = widths[i];
    const charArc = walked + w / 2;
    walked += w + layer.letterSpacing;
    const theta = charArc / R;

    const x = R * Math.sin(theta);
    const y = -sgn * R * (1 - Math.cos(theta));
    const rot = -sgn * theta;

    if (useGradient) {
      const t = chars.length > 1 ? i / (chars.length - 1) : 0;
      ctx.fillStyle = lerpHexColor(
        layer.gradientStartColor,
        layer.gradientEndColor,
        t,
      );
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    drawCharWithEffects(ctx, layer, chars[i]);
    ctx.restore();
  }

  ctx.textAlign = prevAlign;
}

function lerpHexColor(a: string, b: string, t: number): string {
  const parse = (h: string): [number, number, number] | null => {
    if (!h.startsWith("#")) return null;
    if (h.length === 4) {
      return [
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
        parseInt(h[3] + h[3], 16),
      ];
    }
    if (h.length === 7) {
      return [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ];
    }
    return null;
  };
  const A = parse(a);
  const B = parse(b);
  if (!A || !B) return a;
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function drawCharWithEffects(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  char: string,
): void {
  if (layer.shadowEnabled && layer.shadowBlur >= 0) {
    ctx.save();
    ctx.shadowColor = layer.shadowColor;
    ctx.shadowBlur = layer.shadowBlur;
    ctx.shadowOffsetX = layer.shadowOffsetX;
    ctx.shadowOffsetY = layer.shadowOffsetY;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
  if (layer.strokeWidth > 0) {
    ctx.strokeText(char, 0, 0);
  }
  ctx.fillText(char, 0, 0);
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
