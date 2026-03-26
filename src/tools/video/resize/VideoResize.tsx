"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { FFmpegLoadingState } from "@/components/shared/FFmpegLoadingState";
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
  const t = useTranslations("tools.video.resize");
  const tc = useTranslations("common");

  const { status: ffmpegStatus, load: loadFFmpeg } = useFFmpeg();

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

          <div className="flex items-center gap-4">
            <Button onClick={handleResize} disabled={processing}>
              {processing
                ? `${t("processing")} ${progress}%`
                : t("resize")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={`resized_${file.name.replace(/\.[^.]+$/, "")}.mp4`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
