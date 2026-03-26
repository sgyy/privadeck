"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader, formatSize } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { FFmpegLoadingState } from "@/components/shared/FFmpegLoadingState";
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
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.video.resize");
  const tc = useTranslations("common");

  const { status: ffmpegStatus, load: loadFFmpeg } = useFFmpeg({ preload: true });

  if (!isSharedArrayBufferSupported()) {
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
    const ff = await loadFFmpeg();
    if (!ff) { setProcessing(false); return; }
    try {
      const blob = await resizeVideo(
        file,
        preset,
        preset === "custom" ? customWidth : undefined,
        setProgress
      );
      setResult(blob);
    } catch (e) {
      console.error("Resize failed:", e);
      setError(String(e instanceof Error ? e.message : e));
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
        }}
      />

      {ffmpegStatus === "loading" && <FFmpegLoadingState />}

      {ffmpegStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {tc("ffmpegLoadError")}
        </div>
      )}

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
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {processing && <ProcessingProgress progress={progress} />}

          <Button onClick={handleResize} disabled={processing}>
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
