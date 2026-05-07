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
import type { TextLayer } from "../lib/reducer";

interface DragState {
  layerId: string;
  startPointer: Point;
  startXNorm: number;
  startYNorm: number;
  snapshot: TextLayer[];
}

type CursorState = "default" | "move" | "grabbing";

export function EditorCanvas() {
  const { state, dispatch, isDraggingRef } = useEditor();
  const t = useTranslations("tools.image.add-text");
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [cursor, setCursor] = useState<CursorState>("default");

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
  useEffect(() => {
    const el = overlayCanvasRef.current;
    if (!el) return;
    const onLost = () => {
      dragRef.current = null;
      isDraggingRef.current = false;
      setCursor("default");
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

  // Paint the overlay canvas (selection box)
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

    ctx.save();
    ctx.translate(box.cx, box.cy);
    ctx.rotate((selected.rotationDeg * Math.PI) / 180);
    ctx.strokeStyle = "#06B6D4";
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([6 / editorScale, 4 / editorScale]);
    ctx.strokeRect(-box.width / 2, -box.height / 2, box.width, box.height);
    ctx.setLineDash([]);
    // Corner handles
    const hs = 8 / editorScale;
    ctx.fillStyle = "#06B6D4";
    for (const [hx, hy] of [
      [-box.width / 2, -box.height / 2],
      [box.width / 2, -box.height / 2],
      [box.width / 2, box.height / 2],
      [-box.width / 2, box.height / 2],
    ]) {
      ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    ctx.restore();
  }, [state.layers, state.selectedLayerId, state.imageNaturalSize, editorScale]);

  // Pointer handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!state.imageNaturalSize || editorScale === 0) return;
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);

      const cssPt = getCanvasCssPoint(e, canvas);
      const origPt = cssToOriginal(cssPt, editorScale);
      const hitId = findLayerAtPoint(state.layers, state.imageNaturalSize, origPt);

      if (hitId) {
        const layer = state.layers.find((l) => l.id === hitId)!;
        dispatch({ type: "SELECT_LAYER", payload: { id: hitId } });
        dragRef.current = {
          layerId: hitId,
          startPointer: origPt,
          startXNorm: layer.xNorm,
          startYNorm: layer.yNorm,
          snapshot: state.layers.map((l) => ({ ...l })),
        };
        isDraggingRef.current = true;
        setCursor("grabbing");
      } else {
        dispatch({ type: "SELECT_LAYER", payload: { id: null } });
        dragRef.current = null;
        setCursor("default");
      }
    },
    [state.imageNaturalSize, state.layers, editorScale, dispatch, isDraggingRef],
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
        const dx = origPt.x - drag.startPointer.x;
        const dy = origPt.y - drag.startPointer.y;
        const newOrigX = drag.startXNorm * state.imageNaturalSize.w + dx;
        const newOrigY = drag.startYNorm * state.imageNaturalSize.h + dy;
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

      // Hover: cheap hit-test to flip the cursor between move and default.
      const hitId = findLayerAtPoint(state.layers, state.imageNaturalSize, origPt);
      setCursor(hitId ? "move" : "default");
    },
    [state.imageNaturalSize, state.layers, editorScale, dispatch],
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
        if (
          original &&
          current &&
          (original.xNorm !== current.xNorm || original.yNorm !== current.yNorm)
        ) {
          dispatch({
            type: "COMMIT_HISTORY",
            payload: { snapshot: drag.snapshot },
          });
        }
      }
      dragRef.current = null;
      isDraggingRef.current = false;
      // Recompute hover state from the final pointer position so the cursor
      // settles on `move` if the pointer is still over a layer, `default` otherwise.
      if (state.imageNaturalSize && canvas) {
        const cssPt = getCanvasCssPoint(e, canvas);
        const origPt = cssToOriginal(cssPt, editorScale);
        const hitId = findLayerAtPoint(state.layers, state.imageNaturalSize, origPt);
        setCursor(hitId ? "move" : "default");
      } else {
        setCursor("default");
      }
    },
    [state.layers, state.imageNaturalSize, editorScale, dispatch, isDraggingRef],
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
      </div>
    </div>
  );
}
