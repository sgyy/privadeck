"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader, formatSize } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { videoToGif, type GifQuality } from "./logic";

const PRESET_DEFAULTS: Record<GifQuality, { fps: number; scale: number }> = {
  small:    { fps: 8,  scale: 50 },
  balanced: { fps: 10, scale: 75 },
  high:     { fps: 15, scale: 100 },
};

export default function VideoToGif() {
  const isClient = useIsClient();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoFps, setVideoFps] = useState(25);
  const [fps, setFps] = useState(10);
  const [scale, setScale] = useState(75);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [quality, setQuality] = useState<GifQuality>("balanced");
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.video.to-gif");

  const applyPreset = useCallback((q: GifQuality, srcFps: number) => {
    const d = PRESET_DEFAULTS[q];
    setFps(Math.min(d.fps, srcFps));
    setScale(d.scale);
  }, []);

  if (!isClient) {
    return null;
  }

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  async function handleConvert() {
    if (!file || startTime >= endTime) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const blob = await videoToGif(
        file,
        { fps, width: Math.round(videoWidth * scale / 100), startTime, endTime, quality },
        setProgress,
      );
      setResult(blob);
    } catch (e) {
      console.error("GIF conversion failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  const outputWidth = videoWidth ? Math.round(videoWidth * scale / 100) : 0;

  return (
    <div className="space-y-4">
      <VideoUploader
        file={file}
        onFileChange={(f) => {
          setFile(f);
          setResult(null);
          setStartTime(0);
          setError("");
        }}
        onMetadataLoaded={(meta) => {
          const srcFps = meta.fps ?? 25;
          setDuration(meta.duration);
          setVideoWidth(meta.width);
          setVideoFps(srcFps);
          setEndTime(Math.min(meta.duration, 10));
          applyPreset("balanced", srcFps);
        }}
      />

      {file && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("quality")}</label>
            <div className="flex gap-2">
              {(["small", "balanced", "high"] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuality(q);
                    applyPreset(q, videoFps);
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                    quality === q
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold"
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  {t(`quality_${q}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">FPS: {fps}</label>
              <input type="range" min={3} max={Math.max(3, videoFps)} value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("scale")}: {scale}%{outputWidth > 0 && ` (${outputWidth}px)`}</label>
              <input type="range" min={10} max={100} step={5} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("start")}: {startTime.toFixed(1)}s</label>
              <input
                type="range" min={0} max={duration} step={0.1} value={startTime}
                onChange={(e) => setStartTime(Math.min(Number(e.target.value), endTime - 0.1))}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("end")}: {endTime.toFixed(1)}s</label>
              <input
                type="range" min={0} max={duration} step={0.1} value={endTime}
                onChange={(e) => setEndTime(Math.max(Number(e.target.value), startTime + 0.1))}
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>
          )}

          {processing && <ProcessingProgress progress={progress} />}

          <Button onClick={handleConvert} disabled={processing || startTime >= endTime}>
            {processing ? `${t("converting")} ${progress}%` : t("convert")}
          </Button>

          {result && resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="bg-black/5 p-2 dark:bg-black/20">
                  <img src={resultUrl} alt="GIF preview" className="mx-auto max-h-[400px] rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{formatSize(file.size)}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-medium">{formatSize(result.size)}</span>
                </div>
                <DownloadButton data={result} filename={file.name.replace(/\.[^.]+$/, ".gif")} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
