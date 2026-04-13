"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader, formatSize } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
import { TimeRangeSlider } from "@/components/shared/TimeRangeSlider";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { videoToWebp } from "./logic";

const MIN_DURATION = 0.5;

/** Calculate output height maintaining aspect ratio */
function calcOutputHeight(width: number, srcWidth: number, srcHeight: number): number {
  if (srcWidth === 0) return 0;
  return Math.round((width / srcWidth) * srcHeight);
}

/** Ensure even number for video encoding compatibility */
function even(n: number): number {
  return Math.round(n / 2) * 2;
}

export default function VideoToWebp() {
  const isClient = useIsClient();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [videoFps, setVideoFps] = useState(0);
  const [fps, setFps] = useState(15);
  const [width, setWidth] = useState(480);
  const [quality, setQuality] = useState(75);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.video.to-webp");

  // Derived values
  const maxWidth = videoWidth > 0 ? even(videoWidth) : 1280;
  const maxFps = videoFps > 0 ? Math.min(30, videoFps) : 30;
  const outputHeight = calcOutputHeight(width, videoWidth, videoHeight);

  // Reset width if it exceeds the new max (e.g. when a smaller video is loaded)
  useEffect(() => {
    if (maxWidth > 0 && width > maxWidth) {
      setWidth(maxWidth);
    }
  }, [maxWidth, width]);

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
      const blob = await videoToWebp(
        file,
        { fps, width, quality, startTime, endTime },
        setProgress,
      );
      setResult(blob);
    } catch (e) {
      console.error("WebP conversion failed:", e);
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
          setStartTime(0);
          setError("");
        }}
        onMetadataLoaded={(meta) => {
          setDuration(meta.duration);
          setVideoWidth(meta.width);
          setVideoHeight(meta.height);
          setVideoFps(meta.fps ?? 0);
          // Smart default time range based on video duration
          const defaultEnd = meta.duration < 5
            ? meta.duration
            : meta.duration < 30
              ? 5
              : 10;
          setEndTime(defaultEnd);
          // Set width to original or capped at 1280
          setWidth(Math.min(even(meta.width), 1280));
        }}
      />

      {file && duration > 0 && (
        <div className="space-y-3">
          {/* Time range selector */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <label className="mb-2 block text-sm font-medium">{t("timeRange")}</label>
            <TimeRangeSlider
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              onStartChange={(v) => setStartTime(Math.round(v * 10) / 10)}
              onEndChange={(v) => setEndTime(Math.round(v * 10) / 10)}
            />
          </div>

          {/* Settings grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">FPS: {fps}</label>
              <input
                type="range"
                min={5}
                max={Math.max(5, maxFps)}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("width")}: {width}px
                {videoHeight > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({t("outputSize")}: {width}×{outputHeight})
                  </span>
                )}
              </label>
              <input
                type="range"
                min={120}
                max={Math.max(120, maxWidth)}
                step={even(maxWidth / 20)}
                value={width}
                onChange={(e) => setWidth(even(Number(e.target.value)))}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("quality")}: {quality}
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {processing && <ProcessingProgress progress={progress} />}

          <Button
            onClick={handleConvert}
            disabled={processing || startTime >= endTime - MIN_DURATION}
          >
            {processing
              ? `${t("converting")} ${progress}%`
              : t("convert")}
          </Button>

          {result && resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="bg-black/5 p-2 dark:bg-black/20">
                  <img
                    src={resultUrl}
                    alt="WebP preview"
                    className="mx-auto max-h-[400px] rounded"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {formatSize(file.size)}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-medium">{formatSize(result.size)}</span>
                </div>
                <DownloadButton
                  data={result}
                  filename={file.name.replace(/\.[^.]+$/, ".webp")}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
