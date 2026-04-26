"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  RotateCcw,
  RotateCw,
  Undo2,
} from "lucide-react";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { Button } from "@/components/ui/Button";
import { createToolTracker, trackEvent } from "@/lib/analytics";
import { brandFilename } from "@/lib/brand";
import {
  type DecodedImage,
  type Op,
  type Transform,
  INITIAL_TRANSFORM,
  applyOperation,
  encodeCanvas,
  loadImageFromFile,
  mimeToExt,
  pickOutputMime,
  renderToCanvas,
} from "./logic";

const tracker = createToolTracker("flip", "image");

export default function Flip() {
  const t = useTranslations("tools.image.flip");
  const [file, setFile] = useState<File | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [transform, setTransform] = useState<Transform>(INITIAL_TRANSFORM);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const decodedUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (decodedUrlRef.current) {
        URL.revokeObjectURL(decodedUrlRef.current);
        decodedUrlRef.current = null;
      }
    };
  }, []);

  const handleFileChange = useCallback(async (f: File | null) => {
    const requestId = ++requestIdRef.current;
    setFile(f);
    setError("");
    setTransform(INITIAL_TRANSFORM);

    if (decodedUrlRef.current) {
      URL.revokeObjectURL(decodedUrlRef.current);
      decodedUrlRef.current = null;
    }
    setDecoded(null);

    if (!f) return;

    try {
      const result = await loadImageFromFile(f);
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        URL.revokeObjectURL(result.url);
        return;
      }
      decodedUrlRef.current = result.url;
      setDecoded(result);
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
    }
  }, []);

  useEffect(() => {
    if (!decoded || !canvasRef.current) return;
    renderToCanvas(decoded.img, canvasRef.current, transform);
  }, [decoded, transform]);

  const apply = useCallback((op: Op) => {
    setTransform((prev) => applyOperation(prev, op));
  }, []);

  const handleReset = useCallback(() => {
    setTransform(INITIAL_TRANSFORM);
  }, []);

  const openLightbox = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        if (!mountedRef.current) {
          URL.revokeObjectURL(url);
          return;
        }
        setLightboxSrc(url);
        setLightboxOpen(true);
      },
      "image/png",
    );
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxSrc(null);
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;
    return () => URL.revokeObjectURL(lightboxSrc);
  }, [lightboxSrc]);

  const handleDownload = useCallback(async () => {
    if (!file || !decoded || !canvasRef.current) return;
    setDownloading(true);
    setError("");
    const start = Date.now();
    try {
      const mime = pickOutputMime(file);
      const blob = await encodeCanvas(canvasRef.current, mime);
      if (!mountedRef.current) return;
      tracker.trackProcessComplete(Date.now() - start);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const ext = mimeToExt(mime);
      const filename = `${baseName}-transformed.${ext}`;
      trackEvent("file_download", {
        tool_slug: "flip",
        tool_category: "image",
        file_type: ext,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = brandFilename(filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(t("downloadFailed"));
    } finally {
      if (mountedRef.current) setDownloading(false);
    }
  }, [file, decoded, t]);

  const rotateLabel = `${transform.rotate}°`;
  const modified =
    transform.rotate !== 0 || transform.flipH || transform.flipV;

  return (
    <div className="space-y-4">
      <SingleImageUpload
        file={file}
        onFileChange={handleFileChange}
        accept="image/*"
        disabled={downloading}
      />

      {decoded && (
        <>
          <div className="relative overflow-hidden rounded-lg border border-border bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] dark:bg-[linear-gradient(45deg,#27272a_25%,transparent_25%,transparent_75%,#27272a_75%),linear-gradient(45deg,#27272a_25%,transparent_25%,transparent_75%,#27272a_75%)]">
            <div className="flex max-h-[70vh] items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                aria-label={t("previewLabel")}
                className="max-h-[calc(70vh-2rem)] max-w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={openLightbox}
              aria-label={t("fullscreen")}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-muted-foreground">
                {t("rotate")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => apply("rotateCCW")}
                disabled={downloading}
                title={t("rotateCCW")}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">{t("rotateCCW")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => apply("rotateCW")}
                disabled={downloading}
                title={t("rotateCW")}
              >
                <RotateCw className="h-4 w-4" />
                <span className="sr-only">{t("rotateCW")}</span>
              </Button>
              <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-muted-foreground">
                {rotateLabel}
              </span>

              <span className="ml-4 mr-1 text-xs font-medium text-muted-foreground">
                {t("flip")}
              </span>
              <Button
                variant={transform.flipH ? "primary" : "outline"}
                size="sm"
                onClick={() => apply("flipH")}
                disabled={downloading}
                title={t("flipHorizontal")}
              >
                <FlipHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("flipHorizontal")}</span>
              </Button>
              <Button
                variant={transform.flipV ? "primary" : "outline"}
                size="sm"
                onClick={() => apply("flipV")}
                disabled={downloading}
                title={t("flipVertical")}
              >
                <FlipVertical className="h-4 w-4" />
                <span className="sr-only">{t("flipVertical")}</span>
              </Button>

              {modified && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={downloading}
                  className="ml-auto"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  {t("reset")}
                </Button>
              )}
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="lg"
            className="w-full"
          >
            <Download className="h-4 w-4" />
            {downloading ? t("downloading") : t("download")}
          </Button>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {lightboxOpen && lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={file?.name}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
