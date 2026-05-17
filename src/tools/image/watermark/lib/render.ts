import { renderLayers } from "@/tools/image/add-text/lib/renderer";
import { measureLayerBox } from "@/tools/image/add-text/lib/hitTest";
import type { ImageSize, TextLayer } from "@/tools/image/add-text/lib/reducer";
import { textConfigToLayer, type WatermarkConfig } from "./config";
import { computeTileCenters } from "./tiling";

export interface WatermarkRenderInput {
  ctx: CanvasRenderingContext2D;
  image: ImageBitmap | HTMLImageElement | null;
  naturalSize: ImageSize;
  config: WatermarkConfig;
}

/**
 * Single render path shared by preview, single export and batch. The ONLY
 * difference between them is the ctx transform (preview is scaled, export is
 * identity) — config is always identical, so a watermark placed in a 1080p
 * preview lands at the same relative spot/size in a 4K batch export.
 *
 * Text mode reuses add-text's verified renderLayers (stroke / shadow / gradient
 * all handled there). Image mode is a separate, isolated branch — add-text's
 * renderer does not draw images and is never modified from here.
 */
export function renderWatermark({
  ctx,
  image,
  naturalSize,
  config,
}: WatermarkRenderInput): void {
  if (config.mode === "text") {
    // renderLayers clears the canvas and draws the base image itself, so we
    // must NOT pre-draw — just hand it the image + the (possibly tiled) layers.
    const layers = config.text.text
      ? buildTextLayers(config, naturalSize)
      : [];
    renderLayers({ ctx, image, naturalSize, layers });
    return;
  }

  // Image / logo mode — drawn manually (add-text renderer can't draw images).
  ctx.clearRect(0, 0, naturalSize.w, naturalSize.h);
  if (image) ctx.drawImage(image, 0, 0, naturalSize.w, naturalSize.h);

  const bmp = config.image.bitmap;
  if (!bmp) return;
  const w = Math.max(1, config.image.widthNorm * naturalSize.w);
  const ar = config.image.aspectRatio > 0 ? config.image.aspectRatio : 1;
  const h = Math.max(1, w / ar);

  if (config.tiling.enabled) {
    const { gapX, gapY } = tileGaps(config, naturalSize);
    const centers = computeTileCenters(
      naturalSize,
      w + gapX,
      h + gapY,
      config.tiling.angleDeg,
    );
    const rot = config.transform.rotationDeg + config.tiling.angleDeg;
    for (const c of centers) {
      drawLogo(ctx, bmp, c.x, c.y, w, h, rot, config.transform.opacity);
    }
  } else {
    drawLogo(
      ctx,
      bmp,
      config.transform.xNorm * naturalSize.w,
      config.transform.yNorm * naturalSize.h,
      w,
      h,
      config.transform.rotationDeg,
      config.transform.opacity,
    );
  }
}

function buildTextLayers(
  config: WatermarkConfig,
  size: ImageSize,
): TextLayer[] {
  const base = textConfigToLayer(config, size);
  if (!config.tiling.enabled) return [base];

  const box = measureLayerBox(base, size);
  const { gapX, gapY } = tileGaps(config, size);
  const centers = computeTileCenters(
    size,
    box.width + gapX,
    box.height + gapY,
    config.tiling.angleDeg,
  );
  const rot = config.transform.rotationDeg + config.tiling.angleDeg;
  return centers.map((c, i) => ({
    ...base,
    id: `${base.id}-${i}`,
    xNorm: c.x / size.w,
    yNorm: c.y / size.h,
    rotationDeg: rot,
  }));
}

function tileGaps(
  config: WatermarkConfig,
  size: ImageSize,
): { gapX: number; gapY: number } {
  const density = Math.max(config.tiling.density, 0.1);
  return {
    gapX: (config.tiling.gapXNorm * size.w) / density,
    gapY: (config.tiling.gapYNorm * size.h) / density,
  };
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap | HTMLImageElement,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotationDeg: number,
  opacity: number,
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(cx, cy);
  if (rotationDeg !== 0) ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.drawImage(bmp, -w / 2, -h / 2, w, h);
  ctx.restore();
}
