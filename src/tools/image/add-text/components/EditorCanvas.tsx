"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";
import { renderLayers } from "../lib/renderer";
import {
  computeEditorScale,
  cssToOriginal,
  getCanvasCssPoint,
  getDpr,
  originalToNormalized,
  type Point,
} from "../lib/canvasPoint";
import { findLayerAtPoint, measureLayerBox } from "../lib/hitTest";
import {
  ROTATE_OFFSET_PX,
  cursorForHandle,
  hitTestHandle,
  type HandleId,
} from "../lib/handles";
import { computeCenterSnap, type SnapGuide } from "../lib/snap";
import type { TextLayer } from "../lib/reducer";

type DragMode =
  | { kind: "move"; startXNorm: number; startYNorm: number }
  | { kind: "resize"; handleId: HandleId; startFontSize: number; startDist: number }
  | {
      kind: "rotate";
      /** Last pointer angle (rad). Mutated each frame so we accumulate
       * incremental deltas instead of one-shot diffs from the start angle —
       * the latter snaps by ±360° when the pointer crosses atan2's ±π edge. */
      prevPointerAngle: number;
      startRotationDeg: number;
      accumDeg: number;
    };

interface DragState {
  layerId: string;
  startPointer: Point;
  mode: DragMode;
  snapshot: TextLayer[];
}

interface DragHud {
  /** Right-aligned inline label for the active drag, e.g. "64px" or "30°". */
  text: string;
}

const FONT_MIN = 12;
const FONT_MAX = 400;
const ROTATE_SNAP_STEP = 15;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export function EditorCanvas() {
  const { state, dispatch, isDraggingRef } = useEditor();
  const t = useTranslations("tools.image.add-text");
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [cursor, setCursor] = useState<string>("default");
  const [hud, setHud] = useState<DragHud | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

  const editorScale = useMemo(() => {
    if (!state.imageNaturalSize || containerWidth === 0) return 0;
    return computeEditorScale(state.imageNaturalSize, containerWidth);
  }, [state.imageNaturalSize, containerWidth]);

  // Track container width
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

  // Recover from forced pointer-capture loss (alt+tab, OS gestures, iOS scroll
  // hijack). React does not synthesise this as `onPointerCancel`, so we have
  // to listen to the native `lostpointercapture` event directly. Without this
  // `isDraggingRef` can stick at true forever, silencing every later auto-commit.
  // Note: this event ALSO fires on every normal `releasePointerCapture`, so we
  // skip when the pointerup handler already cleared dragRef — otherwise we'd
  // clobber the hover-aware cursor that pointerup just set.
  useEffect(() => {
    const el = overlayCanvasRef.current;
    if (!el) return;
    const onLost = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      isDraggingRef.current = false;
      setCursor("default");
      setHud(null);
      setSnapGuides((prev) => (prev.length > 0 ? [] : prev));
    };
    el.addEventListener("lostpointercapture", onLost);
    return () => el.removeEventListener("lostpointercapture", onLost);
  }, [isDraggingRef]);

  // Resize canvases when image or scale changes
  useEffect(() => {
    const base = baseCanvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!base || !overlay || !state.imageNaturalSize || editorScale === 0) return;

    const natural = state.imageNaturalSize;
    const dpr = getDpr();
    const cssWidth = natural.w * editorScale;
    const cssHeight = natural.h * editorScale;

    for (const c of [base, overlay]) {
      c.style.width = `${cssWidth}px`;
      c.style.height = `${cssHeight}px`;
      c.width = Math.round(cssWidth * dpr);
      c.height = Math.round(cssHeight * dpr);
    }
  }, [state.imageNaturalSize, editorScale]);

  // Paint the base canvas (image + layers)
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas || !state.imageNaturalSize || !state.imageBitmap || editorScale === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const totalScale = getDpr() * editorScale;
    ctx.setTransform(totalScale, 0, 0, totalScale, 0, 0);
    renderLayers({
      ctx,
      image: state.imageBitmap,
      naturalSize: state.imageNaturalSize,
      layers: state.layers,
    });
  }, [state.imageBitmap, state.imageNaturalSize, state.layers, editorScale]);

  // Paint the overlay canvas (selection box + handles)
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !state.imageNaturalSize || editorScale === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const totalScale = getDpr() * editorScale;
    ctx.setTransform(totalScale, 0, 0, totalScale, 0, 0);
    ctx.clearRect(0, 0, state.imageNaturalSize.w, state.imageNaturalSize.h);

    const selected = state.layers.find((l) => l.id === state.selectedLayerId);
    if (!selected || !state.imageNaturalSize) return;
    const box = measureLayerBox(selected, state.imageNaturalSize);
    const lineWidth = Math.max(2 / editorScale, 1);
    const hs = 10 / editorScale; // handle size in original-image px

    ctx.save();
    ctx.translate(box.cx, box.cy);
    ctx.rotate((selected.rotationDeg * Math.PI) / 180);
    ctx.strokeStyle = "#06B6D4";
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([6 / editorScale, 4 / editorScale]);
    ctx.strokeRect(-box.width / 2, -box.height / 2, box.width, box.height);
    ctx.setLineDash([]);

    // 4 corner handles — white fill + cyan border so they read on any background
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

    // Rotation handle: line from top-center out to a circle above the box
    const rx = 0;
    const ry = -box.height / 2 - ROTATE_OFFSET_PX;
    ctx.beginPath();
    ctx.moveTo(0, -box.height / 2);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx, ry, hs / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Snap guides — draw in canvas space (no rotation), full image extent.
    if (snapGuides.length > 0) {
      ctx.strokeStyle = "#06B6D4";
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([4 / editorScale, 4 / editorScale]);
      for (const g of snapGuides) {
        ctx.beginPath();
        if (g.axis === "x") {
          ctx.moveTo(g.pos, 0);
          ctx.lineTo(g.pos, state.imageNaturalSize.h);
        } else {
          ctx.moveTo(0, g.pos);
          ctx.lineTo(state.imageNaturalSize.w, g.pos);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, [state.layers, state.selectedLayerId, state.imageNaturalSize, editorScale, snapGuides]);

  // Pointer handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!state.imageNaturalSize || editorScale === 0) return;
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      setSnapGuides((prev) => (prev.length > 0 ? [] : prev));

      const cssPt = getCanvasCssPoint(e, canvas);
      const origPt = cssToOriginal(cssPt, editorScale);

      // First, check whether the pointer landed on a handle of the currently
      // selected layer. Handle hits beat body hits because handles often overlap
      // the layer's bbox edges.
      const selected = state.layers.find((l) => l.id === state.selectedLayerId);
      const handleTol = 12 / editorScale;
      const handleId = selected
        ? hitTestHandle(selected, state.imageNaturalSize, origPt, handleTol)
        : null;

      if (selected && handleId) {
        const snapshot = state.layers.map((l) => ({ ...l }));
        const cx = selected.xNorm * state.imageNaturalSize.w;
        const cy = selected.yNorm * state.imageNaturalSize.h;
        if (handleId === "rotate") {
          dragRef.current = {
            layerId: selected.id,
            startPointer: origPt,
            mode: {
              kind: "rotate",
              prevPointerAngle: Math.atan2(origPt.y - cy, origPt.x - cx),
              startRotationDeg: selected.rotationDeg,
              accumDeg: 0,
            },
            snapshot,
          };
          setCursor("crosshair");
          setHud({ text: `${Math.round(selected.rotationDeg)}°` });
        } else {
          const dist = Math.hypot(origPt.x - cx, origPt.y - cy);
          dragRef.current = {
            layerId: selected.id,
            startPointer: origPt,
            mode: {
              kind: "resize",
              handleId,
              startFontSize: selected.fontSizePx,
              startDist: Math.max(dist, 1),
            },
            snapshot,
          };
          setCursor(cursorForHandle(handleId));
          setHud({ text: `${selected.fontSizePx}px` });
        }
        isDraggingRef.current = true;
        return;
      }

      // Body hit → move drag, or click empty space to deselect.
      const hitId = findLayerAtPoint(state.layers, state.imageNaturalSize, origPt);
      if (hitId) {
        const layer = state.layers.find((l) => l.id === hitId)!;
        dispatch({ type: "SELECT_LAYER", payload: { id: hitId } });
        dragRef.current = {
          layerId: hitId,
          startPointer: origPt,
          mode: {
            kind: "move",
            startXNorm: layer.xNorm,
            startYNorm: layer.yNorm,
          },
          snapshot: state.layers.map((l) => ({ ...l })),
        };
        isDraggingRef.current = true;
        setCursor("grabbing");
      } else {
        dispatch({ type: "SELECT_LAYER", payload: { id: null } });
        dragRef.current = null;
        setCursor("default");
        setHud(null);
      }
    },
    [
      state.imageNaturalSize,
      state.layers,
      state.selectedLayerId,
      editorScale,
      dispatch,
      isDraggingRef,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!state.imageNaturalSize || editorScale === 0) return;
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      const cssPt = getCanvasCssPoint(e, canvas);
      const origPt = cssToOriginal(cssPt, editorScale);

      const drag = dragRef.current;
      if (drag) {
        e.preventDefault();
        const layer = state.layers.find((l) => l.id === drag.layerId);
        if (!layer) return;

        if (drag.mode.kind === "move") {
          const dx = origPt.x - drag.startPointer.x;
          const dy = origPt.y - drag.startPointer.y;
          let newOrigX = drag.mode.startXNorm * state.imageNaturalSize.w + dx;
          let newOrigY = drag.mode.startYNorm * state.imageNaturalSize.h + dy;
          if (!e.shiftKey) {
            const snap = computeCenterSnap(
              drag.layerId,
              { x: newOrigX, y: newOrigY },
              state.layers,
              state.imageNaturalSize,
              6 / editorScale,
            );
            if (snap.snappedX !== null) newOrigX = snap.snappedX;
            if (snap.snappedY !== null) newOrigY = snap.snappedY;
            setSnapGuides(snap.guides);
          } else {
            // Functional setState bails out on identity match, so this stays
            // cheap when Shift is held continuously — no need to capture
            // `snapGuides` in the callback's deps.
            setSnapGuides((prev) => (prev.length > 0 ? [] : prev));
          }
          const { xNorm, yNorm } = originalToNormalized(
            { x: newOrigX, y: newOrigY },
            state.imageNaturalSize,
          );
          dispatch({
            type: "UPDATE_LAYER",
            payload: { id: drag.layerId, patch: { xNorm, yNorm } },
          });
          return;
        }

        if (drag.mode.kind === "resize") {
          const cx = layer.xNorm * state.imageNaturalSize.w;
          const cy = layer.yNorm * state.imageNaturalSize.h;
          const currentDist = Math.hypot(origPt.x - cx, origPt.y - cy);
          const ratio = currentDist / drag.mode.startDist;
          const newSize = clamp(
            Math.round(drag.mode.startFontSize * ratio),
            FONT_MIN,
            FONT_MAX,
          );
          if (newSize !== layer.fontSizePx) {
            dispatch({
              type: "UPDATE_LAYER",
              payload: { id: drag.layerId, patch: { fontSizePx: newSize } },
            });
          }
          setHud({ text: `${newSize}px` });
          return;
        }

        // rotate — accumulate incremental deltas. Each frame we look at the
        // step from the previous pointer angle, normalise that step into
        // (-π, π] (so a wrap across atan2's ±π boundary becomes a tiny step,
        // not a 360° snap), then add it to the running accum.
        const cx = layer.xNorm * state.imageNaturalSize.w;
        const cy = layer.yNorm * state.imageNaturalSize.h;
        const currentAngle = Math.atan2(origPt.y - cy, origPt.x - cx);
        let stepRad = currentAngle - drag.mode.prevPointerAngle;
        if (stepRad > Math.PI) stepRad -= 2 * Math.PI;
        else if (stepRad < -Math.PI) stepRad += 2 * Math.PI;
        drag.mode.prevPointerAngle = currentAngle;
        drag.mode.accumDeg += (stepRad * 180) / Math.PI;
        let newDeg = normalizeDeg(
          drag.mode.startRotationDeg + drag.mode.accumDeg,
        );
        if (e.shiftKey) {
          newDeg = Math.round(newDeg / ROTATE_SNAP_STEP) * ROTATE_SNAP_STEP;
        }
        if (newDeg !== layer.rotationDeg) {
          dispatch({
            type: "UPDATE_LAYER",
            payload: { id: drag.layerId, patch: { rotationDeg: newDeg } },
          });
        }
        setHud({ text: `${Math.round(newDeg)}°` });
        return;
      }

      // Hover: figure out the right cursor. Handles on the selected layer beat
      // body hits — same priority as in pointerdown.
      const selected = state.layers.find((l) => l.id === state.selectedLayerId);
      const handleTol = 12 / editorScale;
      const handleId = selected
        ? hitTestHandle(selected, state.imageNaturalSize, origPt, handleTol)
        : null;
      if (handleId) {
        setCursor(cursorForHandle(handleId));
        return;
      }
      const hitId = findLayerAtPoint(state.layers, state.imageNaturalSize, origPt);
      setCursor(hitId ? "move" : "default");
    },
    [
      state.imageNaturalSize,
      state.layers,
      state.selectedLayerId,
      editorScale,
      dispatch,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      const canvas = overlayCanvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      if (drag) {
        const original = drag.snapshot.find((l) => l.id === drag.layerId);
        const current = state.layers.find((l) => l.id === drag.layerId);
        if (original && current && JSON.stringify(original) !== JSON.stringify(current)) {
          dispatch({
            type: "COMMIT_HISTORY",
            payload: { snapshot: drag.snapshot },
          });
        }
      }
      dragRef.current = null;
      isDraggingRef.current = false;
      setHud(null);
      setSnapGuides((prev) => (prev.length > 0 ? [] : prev));
      // Recompute hover cursor from the final pointer position so the cursor
      // settles to the right state after release.
      if (state.imageNaturalSize && canvas) {
        const cssPt = getCanvasCssPoint(e, canvas);
        const origPt = cssToOriginal(cssPt, editorScale);
        const selected = state.layers.find((l) => l.id === state.selectedLayerId);
        const handleTol = 12 / editorScale;
        const handleId = selected
          ? hitTestHandle(selected, state.imageNaturalSize, origPt, handleTol)
          : null;
        if (handleId) {
          setCursor(cursorForHandle(handleId));
        } else {
          const hitId = findLayerAtPoint(state.layers, state.imageNaturalSize, origPt);
          setCursor(hitId ? "move" : "default");
        }
      } else {
        setCursor("default");
      }
    },
    [
      state.layers,
      state.imageNaturalSize,
      state.selectedLayerId,
      editorScale,
      dispatch,
      isDraggingRef,
    ],
  );

  if (!state.imageNaturalSize) {
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
        {hud && (
          <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/70 px-2 py-1 font-mono text-xs text-white tabular-nums">
            {hud.text}
          </div>
        )}
      </div>
    </div>
  );
}
