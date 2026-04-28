"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader } from "@/components/shared/VideoUploader";
import { Button } from "@/components/ui/Button";
import { RotateCw, RotateCcw, Undo2, Download } from "lucide-react";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { isWebCodecsSupported, shouldSuggestHevcExtension, UnsupportedVideoCodecError } from "@/lib/media-pipeline";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { createToolTracker } from "@/lib/analytics";
import { rotateVideo, type RotateAngle } from "./logic";
import { VideoPreviewPlayer } from "./VideoPreviewPlayer";
import { brandFilename } from "@/lib/brand";

const tracker = createToolTracker("rotate", "video");

function normalizeRotation(prev: RotateAngle | 0, delta: -90 | 90): RotateAngle | 0 {
  const raw = (prev + delta + 360) % 360;
  if (raw === 0) return 0;
  if (raw === 90 || raw === 180 || raw === 270) return raw as RotateAngle;
  throw new Error(`Invalid rotation value: ${raw}`);
}

export default function VideoRotate() {
  const isClient = useIsClient();
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<RotateAngle | 0>(0);
  const [animationRotation, setAnimationRotation] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isCodecError, setIsCodecError] = useState(false);
  const fileUrl = useObjectUrl(file);
  const t = useTranslations("tools.video.rotate");
  const tc = useTranslations("common");

  // All hooks must be called before any conditional returns
  const previewTransform = useMemo(() => {
    return `rotate(${animationRotation}deg)`;
  }, [animationRotation]);

  const hasChanges = rotation !== 0;

  if (!isClient) {
    return null;
  }

  if (!isSharedArrayBufferSupported() && !isWebCodecsSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  async function handleProcessAndDownload() {
    if (!file || rotation === 0) return;
    setProcessing(true);
    setError("");
    setIsCodecError(false);
    const t0 = performance.now();
    try {
      const blob = await rotateVideo(file, rotation, setProgress);
      // Auto-download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = brandFilename(`rotated_${rotation}_${file.name}`);
      a.click();
      URL.revokeObjectURL(url);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      console.error("Transform failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      if (e instanceof UnsupportedVideoCodecError) {
        setIsCodecError(true);
        setError(tc("unsupportedVideoCodec"));
      } else {
        setError(msg);
      }
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }

  function handleFileChange(f: File | null) {
    setFile(f);
    setRotation(0);
    setAnimationRotation(0);
    setError("");
    setIsCodecError(false);
    setProgress(0);
  }

  function handleReset() {
    setRotation(0);
    setAnimationRotation(0);
    setError("");
    setIsCodecError(false);
    setProgress(0);
  }

  function handleRotateLeft() {
    setRotation((prev) => normalizeRotation(prev, -90));
    setAnimationRotation((prev) => prev - 90);
  }

  function handleRotateRight() {
    setRotation((prev) => normalizeRotation(prev, 90));
    setAnimationRotation((prev) => prev + 90);
  }

  return (
    <div className="space-y-4">
      <VideoUploader
        file={file}
        onFileChange={handleFileChange}
        onCodecWarning={(warning) => setIsCodecError(warning?.isUnsupported ?? false)}
      />

      {file && (
        <div className="space-y-3">
          {/* Transform controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-all hover:border-primary/50 hover:bg-muted"
              title={t("rotateLeft")}
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t("rotateLeft")}</span>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-all hover:border-primary/50 hover:bg-muted"
              title={t("rotateRight")}
            >
              <RotateCw className="h-4 w-4" />
              <span>{t("rotateRight")}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                hasChanges
                  ? "border-border bg-background hover:border-primary/50 hover:bg-muted"
                  : "cursor-not-allowed border-border/30 bg-muted/30 text-muted-foreground"
              }`}
              title={t("reset")}
            >
              <Undo2 className="h-4 w-4" />
              <span>{t("reset")}</span>
            </button>

            <div className="flex-1" />

            <Button
              onClick={handleProcessAndDownload}
              disabled={!hasChanges || processing || isCodecError}
              className="gap-1.5 min-w-[140px]"
            >
              {processing ? (
                <span className="tabular-nums">{t("processing")} {progress}%</span>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>{t("processAndDownload")}</span>
                </>
              )}
            </Button>
          </div>

          {/* Preview */}
          {fileUrl && (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="bg-black/5 dark:bg-black/20">
                <div className="p-2">
                  <VideoPreviewPlayer
                    src={fileUrl}
                    transform={previewTransform}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                isCodecError
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
              }`}
            >
              {error}
              {isCodecError && shouldSuggestHevcExtension() && (
                <p className="mt-1 text-xs opacity-80">{tc("hevcInstallHint")}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
