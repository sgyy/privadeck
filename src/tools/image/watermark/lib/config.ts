import { createDefaultLayer } from "@/tools/image/add-text/lib/reducer";
import type { ImageSize, TextLayer } from "@/tools/image/add-text/lib/reducer";
import type { BoundingBox } from "@/tools/image/add-text/lib/hitTest";
import { getFontByKey } from "@/tools/image/add-text/lib/fonts";

export type WatermarkMode = "text" | "image";
export type OutputFormat = "original" | "jpeg" | "png" | "webp";

/** Position/size are stored relative to image dimensions → resolution-independent. */
export interface WatermarkTransform {
  /** Center X, 0..1 of width */
  xNorm: number;
  /** Center Y, 0..1 of height */
  yNorm: number;
  rotationDeg: number;
  /** 0..1 */
  opacity: number;
}

export interface TextWatermark {
  text: string;
  /** FONT_REGISTRY key, or "system" sentinel → system-ui (no webfont fetch). */
  fontKey: string;
  fontWeight: 400 | 700;
  fontStyle: "normal" | "italic";
  /** fontSizePx = sizeNorm * naturalSize.h */
  sizeNorm: number;
  color: string;
  strokeColor: string;
  /** strokeWidth(px) = strokeWidthNorm * fontSizePx */
  strokeWidthNorm: number;
  shadowEnabled: boolean;
  shadowColor: string;
  /** All shadow metrics are relative to fontSizePx so they scale with the text. */
  shadowBlurNorm: number;
  shadowOffsetXNorm: number;
  shadowOffsetYNorm: number;
}

export interface ImageWatermarkState {
  /** Decoded logo. Never persisted (not serialisable, privacy). */
  bitmap: ImageBitmap | null;
  sourceName: string;
  /** logoWidth(px) = widthNorm * naturalSize.w; height derived from aspectRatio. */
  widthNorm: number;
  /** logo width / height */
  aspectRatio: number;
}

export interface TilingConfig {
  enabled: boolean;
  gapXNorm: number;
  gapYNorm: number;
  angleDeg: number;
  /** Convenience multiplier; higher = denser (smaller effective gap). */
  density: number;
}

export interface WatermarkConfig {
  /** Driven by the active tab (text/image). */
  mode: WatermarkMode;
  transform: WatermarkTransform;
  text: TextWatermark;
  image: ImageWatermarkState;
  tiling: TilingConfig;
}

export interface OutputSettings {
  format: OutputFormat;
  /** 0.5..1; ignored for png/original. */
  quality: number;
}

export const SYSTEM_FONT_KEY = "system";

export function fontKeyToFamily(fontKey: string): string {
  if (fontKey === SYSTEM_FONT_KEY) return "system-ui";
  return getFontByKey(fontKey)?.family ?? "system-ui";
}

/**
 * Default config. Shadow is ON by default so light text stays visible on light
 * backgrounds — matching the add-text convention of solving visibility via
 * shadow/stroke rather than forcing a bundled webfont (default font = system-ui).
 */
export function createDefaultConfig(): WatermarkConfig {
  return {
    mode: "text",
    transform: { xNorm: 0.5, yNorm: 0.5, rotationDeg: 0, opacity: 0.5 },
    text: {
      text: "Watermark",
      fontKey: SYSTEM_FONT_KEY,
      fontWeight: 700,
      fontStyle: "normal",
      sizeNorm: 0.08,
      color: "#ffffff",
      strokeColor: "#000000",
      strokeWidthNorm: 0,
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlurNorm: 0.14,
      shadowOffsetXNorm: 0.035,
      shadowOffsetYNorm: 0.035,
    },
    image: { bitmap: null, sourceName: "", widthNorm: 0.25, aspectRatio: 1 },
    tiling: { enabled: false, gapXNorm: 0.12, gapYNorm: 0.12, angleDeg: -30, density: 1 },
  };
}

export function createDefaultOutput(): OutputSettings {
  return { format: "png", quality: 0.92 };
}

/**
 * Adapt the text watermark + shared transform into a single add-text TextLayer.
 * Built on createDefaultLayer() so every TextLayer field has a valid value; all
 * pixel sizes are derived from the supplied naturalSize so preview, export and
 * batch stay consistent across resolutions. Used by both the renderer and the
 * drag canvas (hit-test / handles) so they always agree.
 */
export function textConfigToLayer(
  config: WatermarkConfig,
  size: ImageSize,
): TextLayer {
  const fontSizePx = Math.max(1, config.text.sizeNorm * size.h);
  return createDefaultLayer({
    text: config.text.text,
    xNorm: config.transform.xNorm,
    yNorm: config.transform.yNorm,
    rotationDeg: config.transform.rotationDeg,
    opacity: config.transform.opacity,
    fontFamily: fontKeyToFamily(config.text.fontKey),
    fontWeight: config.text.fontWeight,
    fontStyle: config.text.fontStyle,
    fontSizePx,
    align: "center",
    fillMode: "solid",
    color: config.text.color,
    strokeColor: config.text.strokeColor,
    strokeWidth: Math.max(0, config.text.strokeWidthNorm * fontSizePx),
    shadowEnabled: config.text.shadowEnabled,
    shadowColor: config.text.shadowColor,
    shadowBlur: Math.max(0, config.text.shadowBlurNorm * fontSizePx),
    shadowOffsetX: config.text.shadowOffsetXNorm * fontSizePx,
    shadowOffsetY: config.text.shadowOffsetYNorm * fontSizePx,
    bgMode: "none",
    curveMode: "none",
    wrapWidthNorm: null,
  });
}

/** Axis-aligned box of the image/logo watermark, for the drag overlay/handles. */
export function imageBox(config: WatermarkConfig, size: ImageSize): BoundingBox {
  const w = Math.max(1, config.image.widthNorm * size.w);
  const ar = config.image.aspectRatio > 0 ? config.image.aspectRatio : 1;
  const h = Math.max(1, w / ar);
  return {
    cx: config.transform.xNorm * size.w,
    cy: config.transform.yNorm * size.h,
    width: w,
    height: h,
  };
}
