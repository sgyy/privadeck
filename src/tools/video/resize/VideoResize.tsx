"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader, formatSize } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { isWebCodecsSupported, shouldSuggestHevcExtension, UnsupportedVideoCodecError } from "@/lib/media-pipeline";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { resizeVideo, type ResizePreset } from "./logic";

const PRESETS: { value: ResizePreset; label: string }[] = [
  { value: "720p", label: "720p (1280)" },
  { value: "480p", label: "480p (854)" },
  { value: "360p", label: "360p (640)" },
  { value: "custom", label: "Custom" },
];

export default function VideoResize() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<ResizePreset>("720p");
  const [customWidth, setCustomWidth] = useState(1920);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isCodecError, setIsCodecError] = useState(false);
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.video.resize");
  const tc = useTranslations("common");

  if (!isSharedArrayBufferSupported() && !isWebCodecsSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  async function handleResize() {
    if (!file) return;
    if (preset === "custom" && (!Number.isFinite(customWidth) || customWidth < 2)) {
      setError("Width must be at least 2px");
      return;
    }
    setProcessing(true);
    setResult(null);
    setError("");
    setIsCodecError(false);
    try {
      const blob = await resizeVideo(
        file,
        preset,
        preset === "custom" ? customWidth : undefined,
        setProgress,
      );
      setResult(blob);
    } catch (e) {
      console.error("Resize failed:", e);
      if (e instanceof UnsupportedVideoCodecError) {
        setIsCodecError(true);
        setError(tc("unsupportedVideoCodec"));
      } else {
        setError(String(e instanceof Error ? e.message : e));
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <VideoUploader
        file={file}
        onFileChange={(f) => {
          setFile(f);
          setResult(null);
          setError("");
          setIsCodecError(false);
        }}
        onCodecWarning={(warning) => setIsCodecError(warning?.isUnsupported ?? false)}
      />

      {file && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("resolution")}</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  variant={preset === p.value ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {preset === "custom" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">
                  {t("width")}:
                </label>
                <input
                  type="number"
                  min={100}
                  max={7680}
                  step={2}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            )}
          </div>

          {error && (
            <div className={`rounded-lg border p-3 text-sm ${isCodecError
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
              }`}>
              {error}
              {isCodecError && shouldSuggestHevcExtension() && (
                <p className="mt-1 text-xs opacity-80">{tc("hevcInstallHint")}</p>
              )}
            </div>
          )}

          {processing && <ProcessingProgress progress={progress} />}

          <Button onClick={handleResize} disabled={processing || isCodecError}>
            {processing
              ? `${t("processing")} ${progress}%`
              : t("resize")}
          </Button>

          {result && resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="bg-black/5 dark:bg-black/20">
                  <video src={resultUrl} controls className="mx-auto max-h-[400px] w-full" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{formatSize(file.size)}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-medium">{formatSize(result.size)}</span>
                  {(() => {
                    const pct = Math.round((1 - result.size / file.size) * 100);
                    const isSmaller = pct > 0;
                    return (
                      <span className={`font-medium ${isSmaller ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                        ({isSmaller ? `-${pct}%` : `+${Math.abs(pct)}%`})
                      </span>
                    );
                  })()}
                </div>
                <DownloadButton data={result} filename={`resized_${file.name.replace(/\.[^.]+$/, "")}.mp4`} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
