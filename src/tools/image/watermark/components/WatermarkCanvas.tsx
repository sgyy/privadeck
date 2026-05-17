"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import {
  computeEditorScale,
  cssToOriginal,
  getCanvasCssPoint,
  getDpr,
} from "@/tools/image/add-text/lib/canvasPoint";
import { measureLayerBox, type BoundingBox } from "@/tools/image/add-text/lib/hitTest";
import {
  ROTATE_OFFSET_PX,
  cursorForHandle,
  type HandleId,
} from "@/tools/image/add-text/lib/handles";
import { loadFont } from "@/tools/image/add-text/lib/fonts";
import { useWatermark } from "../WatermarkContext";
import { renderWatermark } from "../lib/render";
import {
  SYSTEM_FONT_KEY,
  imageBox,
  textConfigToLayer,
} from "../lib/config";

const SIZE_NORM_MIN = 0.01;
const SIZE_NORM_MAX = 0.6;
const WIDTH_NORM_MIN = 0.02;
const WIDTH_NORM_MAX = 2;
const ROTATE_SNAP_STEP = 15;

type DragMode =
  | { kind: "move"; startCx: number; startCy: number }
  | { kind: "resize"; startMetric: number; startDist: number }
  | {
      kind: "rotate";
      prevPointerAngle: number;
      startRotationDeg: number;
      accumDeg: number;
    };

interface DragState {
  startPointer: { x: number; y: number };
  mode: DragMode;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/** Rotate a world point into the box's local (unrotated, center-origin) frame. */
function worldToLocal(
  box: BoundingBox,
  rotationDeg: number,
  pt: { x: number; y: number },
): { lx: number; ly: number } {
  const dx = pt.x - box.cx;
  const dy = pt.y - box.cy;
  const rad = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { lx: dx * cos - dy * sin, ly: dx * sin + dy * cos };
}

function hitBox(
  box: BoundingBox,
  rotationDeg: number,
  pt: { x: number; y: number },
): boolean {
  const { lx, ly } = worldToLocal(box, rotationDeg, pt);
  return Math.abs(lx) <= box.width / 2 && Math.abs(ly) <= box.height / 2;
}

function handleAt(
  box: BoundingBox,
  rotationDeg: number,
  pt: { x: number; y: number },
  tol: number,
): HandleId | null {
  const { lx, ly } = worldToLocal(box, rotationDeg, pt);
  const w = box.width / 2;
  const h = box.height / 2;
  const points: { id: HandleId; x: number; y: number }[] = [
    { id: "rotate", x: 0, y: -h - ROTATE_OFFSET_PX },
    { id: "nw", x: -w, y: -h },
    { id: "ne", x: w, y: -h },
    { id: "se", x: w, y: h },
    { id: "sw", x: -w, y: h },
  ];
  for (const p of points) {
    if (Math.abs(lx - p.x) <= tol && Math.abs(ly - p.y) <= tol) return p.id;
  }
  return null;
}

export function WatermarkCanvas() {
  const { bitmap, naturalSize, config, setConfig } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [fontTick, setFontTick] = useState(0);
  const [cursor, setCursor] = useState("default");

  const editorScale = useMemo(() => {
    if (!naturalSize || containerWidth === 0) return 0;
    return computeEditorScale(naturalSize, containerWidth);
  }, [naturalSize, containerWidth]);

  // Drag/selection only makes sense for a single placed element. When tiling
  // covers the whole image, position is irrelevant — hide the overlay.
  const interactive = !config.tiling.enabled;

  const box: BoundingBox | null = useMemo(() => {
    if (!naturalSize) return null;
    if (config.mode === "text") {
      if (!config.text.text) return null;
      return measureLayerBox(textConfigToLayer(config, naturalSize), naturalSize);
    }
    if (!config.image.bitmap) return null;
    return imageBox(config, naturalSize);
  }, [config, naturalSize]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const key = config.text.fontKey;
    if (key === SYSTEM_FONT_KEY) return;
    let active = true;
    loadFont(key).then(() => {
      if (active) setFontTick((n) => n + 1);
    });
    return () => {
      active = false;
    };
  }, [config.text.fontKey]);

  // Recover from forced pointer-capture loss (alt+tab, OS gestures).
  useEffect(() => {
    const el = overlayCanvasRef.current;
    if (!el) return;
    const onLost = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setCursor("default");
    };
    el.addEventListener("lostpointercapture", onLost);
    return () => el.removeEventListener("lostpointercapture", onLost);
  }, []);

  // Size both canvases to the scaled image (DPR-aware).
  useEffect(() => {
    const base = baseCanvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!base || !naturalSize || editorScale === 0) return;
    const dpr = getDpr();
    const cssW = naturalSize.w * editorScale;
    const cssH = naturalSize.h * editorScale;
    for (const c of [base, overlay]) {
      if (!c) continue;
      c.style.width = `${cssW}px`;
      c.style.height = `${cssH}px`;
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    }
  }, [naturalSize, editorScale]);

  // Paint base image + watermark.
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas || !naturalSize || !bitmap || editorScale === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const totalScale = getDpr() * editorScale;
    ctx.setTransform(totalScale, 0, 0, totalScale, 0, 0);
    renderWatermark({ ctx, image: bitmap, naturalSize, config });
  }, [bitmap, naturalSize, config, editorScale, fontTick]);

  // Paint selection overlay.
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !naturalSize || editorScale === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const totalScale = getDpr() * editorScale;
    ctx.setTransform(totalScale, 0, 0, totalScale, 0, 0);
    ctx.clearRect(0, 0, naturalSize.w, naturalSize.h);
    if (!interactive || !box) return;

    const lineWidth = Math.max(2 / editorScale, 1);
    const hs = 10 / editorScale;
    ctx.save();
    ctx.translate(box.cx, box.cy);
    ctx.rotate((config.transform.rotationDeg * Math.PI) / 180);
    ctx.strokeStyle = "#06B6D4";
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([6 / editorScale, 4 / editorScale]);
    ctx.strokeRect(-box.width / 2, -box.height / 2, box.width, box.height);
    ctx.setLineDash([]);
    const corners: [number, number][] = [
      [-box.width / 2, -box.height / 2],
      [box.width / 2, -box.height / 2],
      [box.width / 2, box.height / 2],
      [-box.width / 2, box.height / 2],
    ];
    for (const [hx, hy] of corners) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
      ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    const ry = -box.height / 2 - ROTATE_OFFSET_PX;
    ctx.beginPath();
    ctx.moveTo(0, -box.height / 2);
    ctx.lineTo(0, ry);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, ry, hs / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [box, interactive, config.transform.rotationDeg, naturalSize, editorScale]);

  const pointFromEvent = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current!;
      return cssToOriginal(getCanvasCssPoint(e, canvas), editorScale);
    },
    [editorScale],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!naturalSize || editorScale === 0 || !interactive || !box) return;
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const pt = pointFromEvent(e);
      const rot = config.transform.rotationDeg;
      const tol = 12 / editorScale;
      const handleId = handleAt(box, rot, pt, tol);

      if (handleId === "rotate") {
        dragRef.current = {
          startPointer: pt,
          mode: {
            kind: "rotate",
            prevPointerAngle: Math.atan2(pt.y - box.cy, pt.x - box.cx),
            startRotationDeg: rot,
            accumDeg: 0,
          },
        };
        setCursor("crosshair");
        return;
      }
      if (handleId) {
        const dist = Math.max(
          Math.hypot(pt.x - box.cx, pt.y - box.cy),
          1,
        );
        const startMetric =
          config.mode === "text"
            ? config.text.sizeNorm
            : config.image.widthNorm;
        dragRef.current = {
          startPointer: pt,
          mode: { kind: "resize", startMetric, startDist: dist },
        };
        setCursor(cursorForHandle(handleId));
        return;
      }
      if (hitBox(box, rot, pt)) {
        dragRef.current = {
          startPointer: pt,
          mode: { kind: "move", startCx: box.cx, startCy: box.cy },
        };
        setCursor("grabbing");
      }
    },
    [naturalSize, editorScale, interactive, box, config, pointFromEvent],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!naturalSize || editorScale === 0) return;
      const drag = dragRef.current;
      const pt = pointFromEvent(e);

      if (!drag) {
        if (interactive && box) {
          const rot = config.transform.rotationDeg;
          const h = handleAt(box, rot, pt, 12 / editorScale);
          if (h) setCursor(cursorForHandle(h));
          else setCursor(hitBox(box, rot, pt) ? "move" : "default");
        }
        return;
      }
      e.preventDefault();

      if (drag.mode.kind === "move") {
        const { startCx, startCy } = drag.mode;
        const dx = pt.x - drag.startPointer.x;
        const dy = pt.y - drag.startPointer.y;
        setConfig((prev) => ({
          ...prev,
          transform: {
            ...prev.transform,
            xNorm: clamp01((startCx + dx) / naturalSize.w),
            yNorm: clamp01((startCy + dy) / naturalSize.h),
          },
        }));
        return;
      }

      if (drag.mode.kind === "resize" && box) {
        const dist = Math.hypot(pt.x - box.cx, pt.y - box.cy);
        const ratio = dist / drag.mode.startDist;
        const next = drag.mode.startMetric * ratio;
        setConfig((prev) =>
          prev.mode === "text"
            ? {
                ...prev,
                text: {
                  ...prev.text,
                  sizeNorm: clamp(next, SIZE_NORM_MIN, SIZE_NORM_MAX),
                },
              }
            : {
                ...prev,
                image: {
                  ...prev.image,
                  widthNorm: clamp(next, WIDTH_NORM_MIN, WIDTH_NORM_MAX),
                },
              },
        );
        return;
      }

      if (drag.mode.kind === "rotate" && box) {
        const cur = Math.atan2(pt.y - box.cy, pt.x - box.cx);
        let step = cur - drag.mode.prevPointerAngle;
        if (step > Math.PI) step -= 2 * Math.PI;
        else if (step < -Math.PI) step += 2 * Math.PI;
        drag.mode.prevPointerAngle = cur;
        drag.mode.accumDeg += (step * 180) / Math.PI;
        let deg = normalizeDeg(drag.mode.startRotationDeg + drag.mode.accumDeg);
        if (e.shiftKey) {
          deg = Math.round(deg / ROTATE_SNAP_STEP) * ROTATE_SNAP_STEP;
        }
        setConfig((prev) => ({
          ...prev,
          transform: { ...prev.transform, rotationDeg: deg },
        }));
      }
    },
    [
      naturalSize,
      editorScale,
      interactive,
      box,
      config.transform.rotationDeg,
      pointFromEvent,
      setConfig,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      dragRef.current = null;
      setCursor("default");
    },
    [],
  );

  if (!naturalSize) {
    return (
      <div
        ref={containerRef}
        className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground"
      >
        {t("uploadHint")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="flex w-full justify-center overflow-hidden rounded-lg border border-border bg-muted/20"
      >
        <div className="relative inline-block">
          <canvas ref={baseCanvasRef} className="block max-w-full" />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 max-w-full"
            style={{ touchAction: "none", cursor }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>
      {interactive && (
        <p className="text-center text-xs text-muted-foreground">
          {t("dragHint")}
        </p>
      )}
    </div>
  );
}
