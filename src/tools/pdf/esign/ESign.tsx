"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { addSignature, getPageCount, formatFileSize } from "./logic";

export default function ESign() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [posX, setPosX] = useState(350);
  const [posY, setPosY] = useState(50);
  const [sigWidth, setSigWidth] = useState(150);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const t = useTranslations("tools.pdf.esign");

  // Initialize canvas with transparent background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      hasDrawnRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pt = getCanvasPoint(e);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    },
    [getCanvasPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pt = getCanvasPoint(e);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    },
    [getCanvasPoint],
  );

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setResult(null);
  }

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    try {
      const count = await getPageCount(f);
      setPageCount(count);
      setPageNumber(1);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  async function handleApply() {
    if (!file || !canvasRef.current || !hasDrawnRef.current) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");

      // Calculate height from canvas aspect ratio
      const canvas = canvasRef.current;
      const aspectRatio = canvas.height / canvas.width;
      const sigHeight = Math.round(sigWidth * aspectRatio);

      const blob = await addSignature(file, dataUrl, pageNumber - 1, {
        x: posX,
        y: posY,
        width: sigWidth,
        height: sigHeight,
      });
      setResult(blob);
    } catch (e) {
      console.error("E-Sign failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" onFiles={handleFile} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {file && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            {file.name} — {formatFileSize(file.size)} — {pageCount}{" "}
            {t("pages")}
          </div>

          {/* Signature pad */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("drawSignature")}</label>
            <div className="overflow-hidden rounded-lg border border-border">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full cursor-crosshair touch-none bg-white"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
            </div>
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              {t("clearSignature")}
            </Button>
          </div>

          {/* Position settings */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("page")}
              </label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={pageNumber}
                onChange={(e) => {
                  setPageNumber(
                    Math.max(1, Math.min(pageCount, Number(e.target.value))),
                  );
                  setResult(null);
                }}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                X ({t("points")})
              </label>
              <input
                type="number"
                min={0}
                value={posX}
                onChange={(e) => {
                  setPosX(Number(e.target.value));
                  setResult(null);
                }}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Y ({t("points")})
              </label>
              <input
                type="number"
                min={0}
                value={posY}
                onChange={(e) => {
                  setPosY(Number(e.target.value));
                  setResult(null);
                }}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("signatureWidth")} ({t("points")})
              </label>
              <input
                type="number"
                min={20}
                max={600}
                value={sigWidth}
                onChange={(e) => {
                  setSigWidth(Number(e.target.value));
                  setResult(null);
                }}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleApply} disabled={processing}>
              {processing ? t("processing") : t("apply")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={file.name.replace(/\.pdf$/i, "_signed.pdf")}
              />
            )}
          </div>

          {result && (
            <p className="text-sm text-muted-foreground">
              {formatFileSize(result.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
