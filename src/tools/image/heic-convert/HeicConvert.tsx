"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Apple,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  RotateCcw,
  RotateCw,
  Sparkles,
  Undo2,
} from "lucide-react";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { Button } from "@/components/ui/Button";
import { createToolTracker, trackEvent } from "@/lib/analytics";
import {
  convertFramesToGif,
  decodeHeic,
  detectApple,
  encodeCanvas,
  parseHeicExif,
  renderToCanvas,
  type AppleSource,
  type DecodedImage,
  type ExifInfo,
  type OutputFormat,
  type UserRotate,
  type UserTransform,
} from "./logic";

const tracker = createToolTracker("heic-convert", "image");

const INITIAL_TRANSFORM: UserTransform = {
  rotate: 0,
  flipH: false,
  flipV: false,
};

export default function HeicConvert() {
  const t = useTranslations("tools.image.heic-convert");
  const [file, setFile] = useState<File | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [exif, setExif] = useState<ExifInfo | null>(null);
  const [apple, setApple] = useState<AppleSource | null>(null);
  const [transform, setTransform] = useState<UserTransform>(INITIAL_TRANSFORM);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [decoding, setDecoding] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [gifProgress, setGifProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const decodedUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  // Track mount state and cleanup decoded URL on unmount.
  // Setup must reset mountedRef.current to true so React Strict Mode's
  // mount→cleanup→remount cycle does not leave it stuck at false.
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
    setExif(null);
    setApple(null);
    setPreviewDataUrl(null);
    setFormat("image/jpeg");

    if (decodedUrlRef.current) {
      URL.revokeObjectURL(decodedUrlRef.current);
      decodedUrlRef.current = null;
    }
    setDecoded(null);

    if (!f) {
      setDecoding(false);
      return;
    }

    setDecoding(true);
    try {
      const [exifInfo, decodedImage] = await Promise.all([
        parseHeicExif(f),
        decodeHeic(f),
      ]);
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        URL.revokeObjectURL(decodedImage.url);
        return;
      }
      decodedUrlRef.current = decodedImage.url;
      const appleSource = detectApple(exifInfo);
      setExif(exifInfo);
      setApple(appleSource);
      setDecoded(decodedImage);
      if (appleSource) {
        try {
          trackEvent("apple_detected", {
            tool_slug: "heic-convert",
            tool_category: "image",
            device_model: appleSource.model,
            software: appleSource.software,
          });
        } catch {
          /* ignore: gtag failures are not user-facing */
        }
      }
    } catch (e) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      const rawMsg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(rawMsg);
      setError(t("decodingFailed"));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setDecoding(false);
      }
    }
  }, [t]);

  useEffect(() => {
    if (!decoded || !canvasRef.current) return;
    renderToCanvas(decoded.img, canvasRef.current, exif?.orientation, transform);
    setPreviewDataUrl(null);
  }, [decoded, exif, transform]);

  const openLightbox = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setPreviewDataUrl(dataUrl);
      setLightboxOpen(true);
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(`preview: ${rawMsg}`);
      setError(t("previewFailed"));
    }
  }, [t]);

  const handleRotate = useCallback((dir: "cw" | "ccw") => {
    setTransform((prev) => {
      const delta = dir === "cw" ? 90 : -90;
      const next = ((prev.rotate + delta + 360) % 360) as UserRotate;
      return { ...prev, rotate: next };
    });
  }, []);

  const handleFlipH = useCallback(() => {
    setTransform((prev) => ({ ...prev, flipH: !prev.flipH }));
  }, []);

  const handleFlipV = useCallback(() => {
    setTransform((prev) => ({ ...prev, flipV: !prev.flipV }));
  }, []);

  const handleReset = useCallback(() => {
    setTransform(INITIAL_TRANSFORM);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!file || !decoded) return;
    if (format !== "image/gif" && !canvasRef.current) return;
    setDownloading(true);
    setError("");
    if (format === "image/gif") setGifProgress(0);
    const start = Date.now();
    try {
      const blob =
        format === "image/gif"
          ? await convertFramesToGif(
              decoded.frames,
              exif?.orientation,
              transform,
              {
                onProgress: (p) => {
                  if (mountedRef.current) setGifProgress(p);
                },
              },
            )
          : await encodeCanvas(canvasRef.current!, format, quality);
      if (!mountedRef.current) return;
      tracker.trackProcessComplete(Date.now() - start);
      const ext = format === "image/gif" ? "gif" : format === "image/jpeg" ? "jpg" : "png";
      const base = file.name.replace(/\.[^.]+$/, "") || "converted";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      if (!mountedRef.current) return;
      const rawMsg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(rawMsg);
      setError(t("downloadFailed"));
    } finally {
      if (mountedRef.current) {
        setDownloading(false);
        setGifProgress(null);
      }
    }
  }, [file, decoded, exif, transform, format, quality, t]);

  const rotateLabel = `${transform.rotate}°`;
  const modified =
    transform.rotate !== 0 || transform.flipH || transform.flipV;
  const isBurst = (decoded?.frameCount ?? 0) > 1;

  return (
    <div className="space-y-4">
      <SingleImageUpload
        file={file}
        onFileChange={handleFileChange}
        accept=".heic,.heif,image/heic,image/heif"
        disabled={decoding || downloading}
      />

      {file && decoding && (
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 py-10 text-sm text-muted-foreground">
          {t("decoding")}
        </div>
      )}

      {decoded && !decoding && (
        <>
          {/* Preview */}
          <div className="relative overflow-hidden rounded-lg border border-border bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] dark:bg-[linear-gradient(45deg,#27272a_25%,transparent_25%,transparent_75%,#27272a_75%),linear-gradient(45deg,#27272a_25%,transparent_25%,transparent_75%,#27272a_75%)]">
            <div className="flex max-h-[70vh] items-center justify-center p-4">
              <canvas
                ref={canvasRef}
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

          {/* Apple badge */}
          {apple && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <Apple className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  Apple {apple.model}
                  {apple.software ? ` · iOS ${apple.software}` : ""}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t("appleNote")}
                </div>
              </div>
            </div>
          )}

          {/* Burst badge */}
          {isBurst && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{t("burstDetected", { count: decoded.frameCount })}</span>
            </div>
          )}

          {/* Transform controls */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-muted-foreground">
                {t("rotate")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate("ccw")}
                title={t("rotateLeft")}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">{t("rotateLeft")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate("cw")}
                title={t("rotateRight")}
              >
                <RotateCw className="h-4 w-4" />
                <span className="sr-only">{t("rotateRight")}</span>
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
                onClick={handleFlipH}
                title={t("flipHorizontal")}
              >
                <FlipHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("flipHorizontal")}</span>
              </Button>
              <Button
                variant={transform.flipV ? "primary" : "outline"}
                size="sm"
                onClick={handleFlipV}
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
                  className="ml-auto"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  {t("reset")}
                </Button>
              )}
            </div>
          </div>

          {/* Format & quality */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("outputFormat")}</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={format === "image/jpeg" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFormat("image/jpeg")}
                >
                  JPG
                </Button>
                <Button
                  variant={format === "image/png" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFormat("image/png")}
                >
                  PNG
                </Button>
                {isBurst && (
                  <Button
                    variant={format === "image/gif" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setFormat("image/gif")}
                  >
                    GIF
                  </Button>
                )}
              </div>
            </div>

            {format === "image/jpeg" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("quality")}: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-auto"
          >
            {downloading
              ? gifProgress !== null
                ? t("encodingGif", { percent: Math.round(gifProgress * 100) })
                : t("downloading")
              : t("download")}
          </Button>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {lightboxOpen && previewDataUrl && (
        <ImageLightbox
          src={previewDataUrl}
          alt={file?.name ?? ""}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
